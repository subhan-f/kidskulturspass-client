import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Button,
  Table,
  Alert,
  Badge,
  Spinner,
  Form,
} from "react-bootstrap";
import {
  Calendar3,
  ChevronDown,
  ChevronUp,
  Receipt,
  Pencil,
  DashCircle,
  CarFront,
  InfoCircle,
} from "react-bootstrap-icons";
import { DashboardLayout } from "../components/layout";
import { SearchBox, DashboardLoader } from "../components/common";
import { authApi } from "../utils/api";
import axios from "axios";
import EventModal from "../components/EventModal";
import CustomTooltip from "../components/common/CustomToolTip/CustomToolTip";
import {
  CALENDAR_MAPPING,
  API_URL,
  USER_API_URL,
} from "../constants/app.contants";

// Calendar role configuration
const CALENDAR_ROLES = {
  "Geigen Mitmachkonzert": { roles: ["Geiger*in", "Moderator*in"] },
  "Klavier Mitmachkonzert": { roles: ["Pianist*in", "Moderator*in"] },
  "Laternenumzug mit Musik": { roles: ["Instrumentalist*in", "Sängerin*in"] },
  "Nikolaus Besuch": { roles: ["Nikolaus", "Sängerin*in"] },
  Puppentheater: { roles: ["Puppenspieler*in"], singleRole: true },
  "Weihnachts Mitmachkonzert": { roles: ["Detlef", "Sängerin*in"] },
};

function UserAssignedDashboard({ setAuth, handleLogout }) {
  // State Management
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState({});
  const [completedEvents, setCompletedEvents] = useState({});
  const [paidEvents, setPaidEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Daten werden geladen...");
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [activeTab, setActiveTab] = useState("myEvents");
  
  // Modal States
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToLeave, setEventToLeave] = useState(null);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showTravelRoleModal, setShowTravelRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdatingTravelRole, setIsUpdatingTravelRole] = useState(false);
  const [roleNotes, setRoleNotes] = useState("");
  const [otherAttendees, setOtherAttendees] = useState([]);
  
  // Tooltip State
  const [tooltipShow, setTooltipShow] = useState({});
  const [tooltipTargets, setTooltipTargets] = useState({});

  // Utility Functions
  const sortEventsByDate = (eventsArray) => {
    return [...eventsArray].sort((a, b) => {
      const dateA = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
      const dateB = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
      return dateA - dateB;
    });
  };

  const generateDummyEvents = useCallback((eventsData, type) => {
    const dummyEvents = JSON.parse(JSON.stringify(eventsData));

    Object.keys(dummyEvents).forEach((calendar) => {
      dummyEvents[calendar] = dummyEvents[calendar].map((event) => {
        if (type === "completed") {
          event.status = "abgeschlossen";
          event.totalCost = `€${(Math.random() * 500 + 100).toFixed(2)}`;
        } else if (type === "paid") {
          event.status = "bezahlt";
          event.totalCost = `€${(Math.random() * 500 + 100).toFixed(2)}`;
          event.paymentDate = new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("de-DE");
          event.receiptId = `RCPT-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`;
        }
        return event;
      });
    });

    return dummyEvents;
  }, []);

  const determineAvailableRoles = (event, user) => {
    const attendees = event?.attendees || [];
    const currentUser = attendees.find((a) => a.email === user.email);
    const currentRole = (
      currentUser?.artistTravelRole ||
      currentUser?.travelRole ||
      ""
    ).toLowerCase();
    const calendarName = event.calendarName;
    
    // Collect other attendees info
    const otherAttendeesList = attendees
      .filter((a) => a.email !== user.email)
      .map(a => ({
        name: a.name || "Unbekannter Künstler",
        email: a.email,
        role: a.role || "Unbekannte Rolle",
        travelRole: a.artistTravelRole || a.travelRole || "Keine Reiserolle"
      }));
    
    setOtherAttendees(otherAttendeesList);

    // Puppentheater - fixed role
    if (calendarName === "Puppentheater") {
      const notes = "Für Puppentheater Veranstaltungen ist nur die Rolle 'Fahrer*in' verfügbar und kann nicht geändert werden.";
      setRoleNotes(notes);
      return [
        {
          value: currentRole || "none",
          label:
            currentRole === "driver"
              ? "Fahrer*in"
              : currentRole === "passenger"
              ? "Beifahrer*in"
              : "Keine Reiserolle",
          disabled: true,
          reason: "Puppentheater hat feste Reiserollen"
        },
      ];
    }

    const calendarConfig = CALENDAR_ROLES[calendarName];
    const requiredRoles = calendarConfig?.roles || [];

    const validArtists = attendees.filter((a) =>
      requiredRoles.includes(a.role)
    );

    const otherArtists = validArtists.filter((a) => a.email !== user.email);
    const otherArtist = otherArtists[0];

    // Case 1: No other valid artists (single artist event)
    if (!otherArtist) {
      const notes = "Sie sind der einzige Künstler in dieser Veranstaltung. Beide Rollen (Fahrer*in und Beifahrer*in) sind verfügbar.";
      setRoleNotes(notes);
      return [
        {
          value: "driver",
          label: "Fahrer*in",
          disabled: currentRole === "driver",
          reason: currentRole === "driver" 
            ? "Sie sind bereits Fahrer*in" 
            : "Verfügbar - kein anderer Künstler vorhanden"
        },
        {
          value: "passenger",
          label: "Beifahrer*in",
          disabled: currentRole === "passenger",
          reason: currentRole === "passenger"
            ? "Sie sind bereits Beifahrer*in"
            : "Verfügbar - kein anderer Künstler vorhanden"
        },
      ];
    }

    const otherRole = (
      otherArtist?.artistTravelRole ||
      otherArtist?.travelRole ||
      ""
    ).toLowerCase();

    // Case 2: Current user is driver, other is also driver
    if (currentRole === "driver" && otherRole === "driver") {
      const notes = "Sowohl Sie als auch der andere Künstler sind aktuell als Fahrer*in eingetragen. Beide können zwischen Fahrer*in und Beifahrer*in wechseln.";
      setRoleNotes(notes);
      return [
        { 
          value: "driver", 
          label: "Fahrer*in", 
          disabled: false,
          reason: "Verfügbar - beide Künstler sind aktuell Fahrer*in"
        },
        { 
          value: "passenger", 
          label: "Beifahrer*in", 
          disabled: false,
          reason: "Verfügbar - Sie können auf Beifahrer*in wechseln"
        },
      ];
    }

    // Case 3: Current user is driver, other is passenger
    if (currentRole === "driver" && otherRole === "passenger") {
      const notes = `Sie sind aktuell Fahrer*in und ${otherArtist.displayName || "der andere Künstler"} ist Beifahrer*in. Sie können nicht auf Beifahrer*in wechseln, da dann niemand mehr als Fahrer*in eingetragen wäre.`;
      setRoleNotes(notes);
      return [
        { 
          value: "driver", 
          label: "Fahrer*in", 
          disabled: false,
          reason: "Verfügbar - Sie bleiben Fahrer*in"
        },
        { 
          value: "passenger", 
          label: "Beifahrer*in", 
          disabled: true,
          reason: "Nicht verfügbar - es muss mindestens ein Fahrer*in vorhanden sein"
        },
      ];
    }

    // Case 4: Current user is passenger
    if (currentRole === "passenger") {
      const notes = `Sie sind aktuell Beifahrer*in. Sie können auf Fahrer*in wechseln, dann würde ${otherArtist.displayName || "der andere Künstler"} Beifahrer*in bleiben.`;
      setRoleNotes(notes);
      return [
        { 
          value: "driver", 
          label: "Fahrer*in", 
          disabled: false,
          reason: "Verfügbar - Sie können auf Fahrer*in wechseln"
        },
        { 
          value: "passenger", 
          label: "Beifahrer*in", 
          disabled: false,
          reason: "Verfügbar - Sie bleiben Beifahrer*in"
        },
      ];
    }

    // Case 5: Current user has no role, other has a role
    if (!currentRole && otherRole) {
      const otherRoleText = otherRole === "driver" ? "Fahrer*in" : "Beifahrer*in";
      const availableRole = otherRole === "driver" ? "passenger" : "driver";
      const notes = `${otherArtist.displayName || "Der andere Künstler"} ist bereits als ${otherRoleText} eingetragen. Sie können als ${availableRole === "driver" ? "Fahrer*in" : "Beifahrer*in"} beitreten.`;
      setRoleNotes(notes);
      
      if (otherRole === "driver") {
        return [
          { 
            value: "driver", 
            label: "Fahrer*in", 
            disabled: false,
            reason: "Verfügbar - Sie können zusätzlicher Fahrer*in sein"
          },
          { 
            value: "passenger", 
            label: "Beifahrer*in", 
            disabled: false,
            reason: "Verfügbar - Sie können Beifahrer*in sein"
          },
        ];
      } else if (otherRole === "passenger") {
        return [
          { 
            value: "driver", 
            label: "Fahrer*in", 
            disabled: false,
            reason: "Verfügbar - Sie müssen Fahrer*in sein, da bereits ein Beifahrer*in existiert"
          },
          { 
            value: "passenger", 
            label: "Beifahrer*in", 
            disabled: true,
            reason: "Nicht verfügbar - es kann nur einen Beifahrer*in pro Fahrer*in geben"
          },
        ];
      }
    }

    // Default case: No roles assigned yet
    const notes = "Keine Reiserollen wurden bisher zugewiesen. Sie können entweder als Fahrer*in oder Beifahrer*in eingetragen werden.";
    setRoleNotes(notes);
    return [
      { 
        value: "driver", 
        label: "Fahrer*in", 
        disabled: false,
        reason: "Verfügbar - noch keine Reiserollen vergeben"
      },
      { 
        value: "passenger", 
        label: "Beifahrer*in", 
        disabled: false,
        reason: "Verfügbar - noch keine Reiserollen vergeben"
      },
    ];
  };

  const handleTooltipShow = (key, target) => {
    setTooltipShow((prev) => ({ ...prev, [key]: true }));
    setTooltipTargets((prev) => ({ ...prev, [key]: target }));
  };

  const handleTooltipHide = (key) => {
    setTooltipShow((prev) => ({ ...prev, [key]: false }));
  };

  const clearMessages = () => {
    setError(null);
    setWarning(null);
    setSuccess(null);
  };

  // Data Fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Benutzerdaten werden geladen...");
      clearMessages();

      const res = await authApi.getMe();
      const currentUser = res.data.user;
      const userData = await axios.get(`${USER_API_URL}/?id=${currentUser._id}`);
      setUser(userData.data);

      const joinedCalendars = userData.data.joinedCalendars || [];
      const calendarNames = joinedCalendars.map((c) => c.Calendar);

      setLoadingMessage("Veranstaltungen werden geladen...");
      const eventsRes = await axios.get(`${API_URL}/assigned`, {
        params: {
          email: userData.data["E-Mail"],
          calendars: calendarNames.join(","),
          categorize: true,
        },
      });

      const responseData = eventsRes.data;

      const sortedCategorizedEvents = {};
      Object.keys(responseData.categorizedEvents || {}).forEach((calendar) => {
        sortedCategorizedEvents[calendar] = sortEventsByDate(
          responseData.categorizedEvents[calendar]
        );
      });

      setEvents(sortedCategorizedEvents);

      setLoadingMessage("Abgeschlossene Veranstaltungen werden geladen...");
      const completedRes = await axios.get(`${API_URL}/completed`, {
        params: {
          email: userData.data["E-Mail"],
          calendars: calendarNames.join(","),
          categorize: true,
        },
      });

      const sortedCompletedEvents = {};
      Object.keys(completedRes.data.categorizedEvents || {}).forEach(
        (calendar) => {
          sortedCompletedEvents[calendar] = sortEventsByDate(
            completedRes.data.categorizedEvents[calendar]
          );
        }
      );

      setCompletedEvents(sortedCompletedEvents);
      setPaidEvents(generateDummyEvents(sortedCategorizedEvents, "paid"));

      const initialExpandState = {};
      Object.keys(sortedCategorizedEvents || {}).forEach((cal) => {
        initialExpandState[cal] = true;
      });
      setExpandedCalendars(initialExpandState);

      setLoading(false);
    } catch (err) {
      setError("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Event Handlers
  const toggleCalendarExpand = useCallback((calendar) => {
    setExpandedCalendars((prev) => ({
      ...prev,
      [calendar]: !prev[calendar],
    }));
  }, []);

  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  const handleLeaveClick = useCallback((event) => {
    setEventToLeave(event);
    setShowLeaveConfirmModal(true);
  }, []);

  const handleLeaveConfirm = useCallback(async () => {
    if (!eventToLeave || isLeaving) return;

    setIsLeaving(true);
    setLoadingMessage("Artist wird von der Veranstaltung entfernt...");
    clearMessages();

    try {
      const calendarName = eventToLeave.calendarName?.trim().toLowerCase();
      let calendarId = null;

      for (const [name, id] of Object.entries(CALENDAR_MAPPING)) {
        if (name.trim().toLowerCase() === calendarName) {
          calendarId = id;
          break;
        }
      }

      if (!calendarId) {
        setWarning("Kalender-ID konnte nicht gefunden werden");
        setIsLeaving(false);
        return;
      }

      const requestData = {
        calendarId,
        eventId: eventToLeave.id,
        artistEmail: user["E-Mail"],
      };

      const response = await axios.post(
        `${API_URL}/remove-artist`,
        requestData
      );

      if (response.data.success) {
        await new Promise((resolve) => setTimeout(resolve, 20000));
        setSuccess("Artist erfolgreich von der Veranstaltung entfernt!");
        await fetchData();
        setShowLeaveConfirmModal(false);
        setEventToLeave(null);
      } else {
        setWarning(
          response.data.message || "Fehler beim Entfernen des Artists"
        );
      }
    } catch (error) {
      setError("Fehler beim Entfernen des Artists");
    } finally {
      setIsLeaving(false);
    }
  }, [eventToLeave, user]);

  const handleViewReceipt = useCallback((event) => {
    setSelectedReceipt({
      eventName: event.summary,
      receiptId:
        event.receiptId ||
        `RCPT-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      amount: event.totalCost,
      date: event.paymentDate || new Date().toLocaleDateString("de-DE"),
      status: "Paid",
    });
    setShowReceiptModal(true);
  }, []);

  const handleOpenTravelRoleModal = (event, user) => {
    setEditingEvent(event);
    setEditingUser(user);
    setRoleNotes("");
    setOtherAttendees([]);

    const roles = determineAvailableRoles(event, user);
    setAvailableRoles(roles);

    const currentRole = user?.artistTravelRole || user?.travelRole || "";
    const defaultRole =
      currentRole && roles.some((r) => r.value === currentRole)
        ? currentRole
        : roles[0]?.value || "";
    setSelectedRole(defaultRole);

    setShowTravelRoleModal(true);
  };

  const handleSaveTravelRole = async () => {
    if (!editingEvent || !editingUser || !selectedRole) return;

    const currentRole =
      editingUser?.artistTravelRole || editingUser?.travelRole || "";

    if (selectedRole === currentRole) {
      setSuccess("Keine Änderung erforderlich.");
      setTimeout(() => {
        setSuccess(null);
        setShowTravelRoleModal(false);
      }, 2000);
      return;
    }

    if (editingEvent.calendarName === "Puppentheater") {
      setWarning(
        "Für Puppentheater Veranstaltungen kann die Reiserolle nicht geändert werden."
      );
      return;
    }

    const roleMeta = availableRoles.find((r) => r.value === selectedRole);
    if (roleMeta?.disabled) {
      setWarning(
        "Diese Reiserolle kann nicht ausgewählt werden, da bereits ein anderer Teilnehmer diese Rolle hat oder die Rolle nicht verfügbar ist."
      );
      return;
    }

    setIsUpdatingTravelRole(true);
    setLoadingMessage("Reiserolle wird aktualisiert...");
    clearMessages();

    try {
      const calendarName = editingEvent.calendarName?.trim().toLowerCase();
      let calendarId = null;
      for (const [name, id] of Object.entries(CALENDAR_MAPPING)) {
        if (name.trim().toLowerCase() === calendarName) {
          calendarId = id;
          break;
        }
      }

      if (!calendarId) {
        setWarning("Kalender-ID nicht gefunden.");
        setIsUpdatingTravelRole(false);
        setLoadingMessage(null);
        return;
      }

      const requestData = {
        calendarId,
        eventId: editingEvent.id,
        artistEmail: editingUser.email,
        travelRole: selectedRole,
      };

      const response = await axios.post(
        `${API_URL}/update-travel-role`,
        requestData
      );

      if (response?.data?.success) {
        await new Promise((res) => setTimeout(res, 20000));
        setSuccess("Reiserolle erfolgreich aktualisiert!");

        setTimeout(async () => {
          setShowTravelRoleModal(false);
          await fetchData();
          setSuccess(null);
        }, 1000);
      } else {
        setWarning(
          response.data.message || "Fehler beim Aktualisieren der Reiserolle"
        );
      }
    } catch (err) {
      setError("Fehler beim Aktualisieren der Reiserolle");
    } finally {
      setIsUpdatingTravelRole(false);
      setLoadingMessage(null);
    }
  };

  const handleRefresh = useCallback(() => {
    setEvents({});
    clearMessages();
    fetchData();
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoized Computations
  const filterEvents = useCallback(
    (eventsObj) => {
      const filtered = {};

      Object.keys(eventsObj).forEach((calendar) => {
        filtered[calendar] = (eventsObj[calendar] || []).filter(
          (event) =>
            (event.summary || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (event.calendar || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (event.role || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (event.location || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
      });

      return filtered;
    },
    [searchTerm]
  );

  const filteredEventsByCalendar = useMemo(
    () => filterEvents(events),
    [events, filterEvents]
  );
  const filteredCompletedEvents = useMemo(
    () => filterEvents(completedEvents),
    [completedEvents, filterEvents]
  );
  const filteredPaidEvents = useMemo(
    () => filterEvents(paidEvents),
    [paidEvents, filterEvents]
  );

  const getEventsForActiveTab = useCallback(() => {
    switch (activeTab) {
      case "completedEvents":
        return filteredCompletedEvents;
      case "paidEvents":
        return filteredPaidEvents;
      default:
        return filteredEventsByCalendar;
    }
  }, [activeTab, filteredEventsByCalendar, filteredCompletedEvents, filteredPaidEvents]);

  const calendars = useMemo(
    () => Object.keys(getEventsForActiveTab()).sort(),
    [getEventsForActiveTab]
  );

  const totalFilteredEvents = useMemo(
    () => Object.values(getEventsForActiveTab()).flat().length,
    [getEventsForActiveTab]
  );

  const calendarHasMatch = useCallback(
    (calendar) => {
      const currentEvents = getEventsForActiveTab();
      return currentEvents[calendar] && currentEvents[calendar].length > 0;
    },
    [getEventsForActiveTab]
  );

  // Render Helper Functions
  const renderTravelRole = (event) => {
    const currentUser = event.attendees?.find(
      (a) => a.email === user["E-Mail"]
    );
    const travelRole =
      currentUser?.artistTravelRole || currentUser?.travelRole;

    if (!travelRole) return "Keine Reiserolle";

    return (
      <div className="travelRole-display d-flex align-items-center">
        <span className="me-2">
          {travelRole === "driver"
            ? "Fahrer*in"
            : travelRole === "passenger"
            ? "Beifahrer*in"
            : travelRole}
        </span>
        {event.calendarName !== "Puppentheater" && (
          <Button
            variant="link"
            size="sm"
            className="p-0 travelRole-edit-btn"
            onClick={() => handleOpenTravelRoleModal(event, currentUser)}
          >
            <Pencil className="text-primary" size={16} />
          </Button>
        )}
      </div>
    );
  };

  const renderMobileTravelRole = (event) => {
    const currentUser = event.attendees?.find(
      (a) => a.email === user["E-Mail"]
    );
    const travelRole =
      currentUser?.artistTravelRole || currentUser?.travelRole;

    if (!travelRole) return <span>Keine Reiserolle</span>;

    const translatedRole =
      travelRole === "driver"
        ? "Fahrer*in"
        : travelRole === "passenger"
        ? "Beifahrer*in"
        : travelRole;

    return (
      <div className="d-flex align-items-center">
        <CarFront className="text-primary me-2" />
        <span>{translatedRole}</span>
        {event.calendarName !== "Puppentheater" && (
          <Button
            variant="link"
            size="sm"
            className="travelRole-edit-btn ms-2 d-flex align-items-center"
            onClick={() => handleOpenTravelRoleModal(event, currentUser)}
          >
            <Pencil className="text-primary me-1" />
            Bearbeiten
          </Button>
        )}
      </div>
    );
  };

  const renderEventRow = (event, calendar, index) => {
    const detailKey = `detail-${calendar}-${index}`;
    const leaveKey = `leave-${calendar}-${index}`;
    const receiptKey = `receipt-${calendar}-${index}`;

    return (
      <tr key={index} className="event-row">
        <td className="event-details">
          <div className="event-title">{event.summary}</div>
          <div className="event-location">{event.location || "Nicht angegeben"}</div>
        </td>
        <td className="event-time date-time-column">
          {event?.start?.dateTime ? (
            <div className="date-time">
              <div className="date">
                {new Date(event.start.dateTime).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  timeZone: event.start.timeZone,
                })}
              </div>
              <div className="time">
                {new Date(event.start.dateTime).toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: event.start.timeZone,
                })}
              </div>
            </div>
          ) : (
            <span>Datum unbekannt</span>
          )}
        </td>
        {activeTab === "myEvents" && (
          <td className="event-travelRole">
            {renderTravelRole(event)}
          </td>
        )}
        <td className="event-status">
          {activeTab === "myEvents" && <Badge bg="primary">bevorstehend</Badge>}
          {activeTab === "completedEvents" && <Badge bg="success">Abgeschlossen</Badge>}
          {activeTab === "paidEvents" && <Badge bg="info">Bezahlt</Badge>}
        </td>
        <td className="event-cost">
          {event?.eventExpense?.eventPay || "0"} €
        </td>
        <td className="event-actions actions-column">
          <Button
            ref={(el) => {
              if (el && !tooltipTargets[detailKey]) {
                setTooltipTargets((prev) => ({ ...prev, [detailKey]: el }));
              }
            }}
            variant="outline-primary"
            size="sm"
            onClick={() => handleEventClick(event)}
            onMouseEnter={(e) => handleTooltipShow(detailKey, e.currentTarget)}
            onMouseLeave={() => handleTooltipHide(detailKey)}
            className="open-calendar-button me-1"
          >
            <InfoCircle className="button-icon" />
          </Button>
          <CustomTooltip
            show={tooltipShow[detailKey]}
            target={tooltipTargets[detailKey]}
            variant="primary"
          >
            Details
          </CustomTooltip>
        </td>
        <td className="leave-event-column leave-column">
          {activeTab === "myEvents" && (
            <>
              <Button
                ref={(el) => {
                  if (el && !tooltipTargets[leaveKey]) {
                    setTooltipTargets((prev) => ({ ...prev, [leaveKey]: el }));
                  }
                }}
                variant="danger"
                size="sm"
                onClick={() => handleLeaveClick(event)}
                onMouseEnter={(e) => handleTooltipShow(leaveKey, e.currentTarget)}
                onMouseLeave={() => handleTooltipHide(leaveKey)}
                className="leave-event-button"
              >
                <DashCircle className="button-icon" />
              </Button>
              <CustomTooltip
                show={tooltipShow[leaveKey]}
                target={tooltipTargets[leaveKey]}
                variant="danger"
              >
                Job verlassen
              </CustomTooltip>
            </>
          )}
          {activeTab === "paidEvents" && (
            <>
              <Button
                ref={(el) => {
                  if (el && !tooltipTargets[receiptKey]) {
                    setTooltipTargets((prev) => ({ ...prev, [receiptKey]: el }));
                  }
                }}
                variant="outline-info"
                size="sm"
                onClick={() => handleViewReceipt(event)}
                onMouseEnter={(e) => handleTooltipShow(receiptKey, e.currentTarget)}
                onMouseLeave={() => handleTooltipHide(receiptKey)}
                className="view-receipt-button"
              >
                <Receipt className="button-icon" />
              </Button>
              <CustomTooltip
                show={tooltipShow[receiptKey]}
                target={tooltipTargets[receiptKey]}
                variant="info"
              >
                Beleg anzeigen
              </CustomTooltip>
            </>
          )}
        </td>
      </tr>
    );
  };

  const renderMobileEventCard = (event, calendar, index) => {
    const detailKey = `mobile-detail-${calendar}-${index}`;
    const leaveKey = `mobile-leave-${calendar}-${index}`;
    const receiptKey = `mobile-receipt-${calendar}-${index}`;

    return (
      <div key={index} className="event-mobile-card">
        <div className="event-mobile-header">
          <div className="event-mobile-title">{event.summary}</div>
          <div className="event-mobile-status">
            {activeTab === "myEvents" && <Badge bg="primary">bevorstehend</Badge>}
            {activeTab === "completedEvents" && <Badge bg="success">Abgeschlossen</Badge>}
            {activeTab === "paidEvents" && <Badge bg="info">Bezahlt</Badge>}
          </div>
        </div>
        <div className="event-mobile-content">
          <div className="event-mobile-details">
            {event.location && (
              <div className="event-mobile-location">
                <i className="bi bi-geo-alt"></i> {event.location}
              </div>
            )}
            {event.start?.dateTime && (
              <div className="event-mobile-datetime">
                <i className="bi bi-calendar-event"></i>{" "}
                {new Date(event.start.dateTime).toLocaleDateString("de-DE")}
                <span className="mobile-time">
                  {" "}
                  {new Date(event.start.dateTime).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {event?.eventExpense?.eventPay && (
              <div className="event-mobile-cost">
                <i className="bi bi-currency-euro"></i> Event Bezahlung{" "}
                {event.eventExpense.eventPay} €
              </div>
            )}
            {event.attendees && activeTab === "myEvents" && (
              <div className="event-mobile-travelRole d-flex align-items-center">
                {renderMobileTravelRole(event)}
              </div>
            )}
          </div>
          <div className="event-mobile-actions">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleEventClick(event)}
              className="me-2"
            >
              <InfoCircle className="me-1" />
              Details
            </Button>
            {activeTab === "paidEvents" && (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => handleViewReceipt(event)}
                className="me-2"
              >
                <Receipt className="me-1" />
                Beleg
              </Button>
            )}
            {activeTab === "myEvents" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleLeaveClick(event)}
                className="leave-event-button"
              >
                <DashCircle className="me-1" />
                Verlassen
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEventsTable = (eventsData) => {
    return (
      <>
        {calendars.map((calendar) => {
          const hasEvents = eventsData[calendar]?.length > 0;
          const isFilteredOut = searchTerm && !calendarHasMatch(calendar);

          return (
            <div
              key={calendar}
              className={`event-calendar-card ${isFilteredOut ? "filtered-out" : ""}`}
            >
              <div
                className="calendar-header"
                onClick={() => toggleCalendarExpand(calendar)}
              >
                <div className="header-content">
                  <div className="title-with-icon">
                    <h5 className="calendar-title">{calendar}</h5>
                    <div className="dropdown-toggle-icon">
                      {expandedCalendars[calendar] ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </div>
                  </div>
                  <span className="events-count">
                    <span className="count-number">
                      {hasEvents ? eventsData[calendar].length : 0}
                    </span>
                    <span className="count-label">
                      {hasEvents
                        ? eventsData[calendar].length === 1
                          ? " Veranstaltung"
                          : " Veranstaltungen"
                        : " Veranstaltungen"}
                    </span>
                  </span>
                </div>
              </div>

              {expandedCalendars[calendar] && (
                <div className="calendar-content">
                  {hasEvents ? (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table className={`events-table ${activeTab === "myEvents" ? "six-columns" : "five-columns"}`}>
                          <thead>
                            <tr>
                              <th>Veranstaltung</th>
                              <th>Datum/Uhrzeit</th>
                              {activeTab === "myEvents" && <th>Reiserolle</th>}
                              <th>Status</th>
                              <th>Gesamtkosten</th>
                              <th>Aktion</th>
                              <th>{activeTab === "myEvents" ? "Aktion" : "Beleg"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventsData[calendar].map((event, index) =>
                              renderEventRow(event, calendar, index)
                            )}
                          </tbody>
                        </Table>
                      </div>
                      <div className="event-cards-container d-md-none">
                        {eventsData[calendar].map((event, index) =>
                          renderMobileEventCard(event, calendar, index)
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="no-events-message">
                      Keine zugewiesenen Veranstaltungen in diesem Kalender.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  };

  const renderRoleSelectionModal = () => {
    const calendarName = editingEvent?.calendarName;
    const currentUser = editingEvent?.attendees?.find(
      (a) => a.email === user?.["E-Mail"]
    );
    const currentRole = currentUser?.artistTravelRole || currentUser?.travelRole || "Keine";

    return (
      <div>
        <div className="mb-4 p-3 bg-light border rounded">
          <h6>Zusammenfassung der Reiserollenlogik:</h6>
          <p className="mb-0 small">{roleNotes}</p>
        </div>

        <div className="mb-4">
          <h6>Aktuelle Teilnehmer und ihre Rollen:</h6>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Künstler-Rolle</th>
                  <th>Reiserolle</th>
                </tr>
              </thead>
              <tbody>
                {/* Current user */}
                <tr className="table-primary">
                  <td>
                    <strong>{user?.Name || "Sie"}</strong>
                    <Badge bg="info" className="ms-2">Aktueller Benutzer</Badge>
                  </td>
                  <td>{user?.["E-Mail"]}</td>
                  <td>{currentUser?.role || "Unbekannt"}</td>
                  <td>
                    <Badge bg={currentRole === "driver" ? "primary" : currentRole === "passenger" ? "secondary" : "light"}>
                      {currentRole === "driver" ? "Fahrer*in" : 
                       currentRole === "passenger" ? "Beifahrer*in" : "Keine"}
                    </Badge>
                  </td>
                </tr>
                {/* Other attendees */}
                {otherAttendees.map((attendee, index) => (
                  <tr key={index}>
                    <td>{attendee.name}</td>
                    <td>{attendee.email}</td>
                    <td>{attendee.role}</td>
                    <td>
                      <Badge bg={attendee.travelRole === "driver" ? "primary" : 
                                 attendee.travelRole === "passenger" ? "secondary" : "light"}>
                        {attendee.travelRole === "driver" ? "Fahrer*in" : 
                         attendee.travelRole === "passenger" ? "Beifahrer*in" : attendee.travelRole}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {otherAttendees.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      Keine anderen Teilnehmer in dieser Veranstaltung
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Form>
          <Form.Group>
            <Form.Label>
              {calendarName === "Puppentheater"
                ? "Aktuelle Reiserolle (fest zugewiesen)"
                : "Neue Reiserolle auswählen"}
            </Form.Label>

            <Form.Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={
                isUpdatingTravelRole ||
                calendarName === "Puppentheater"
              }
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value} disabled={r.disabled}>
                  {r.label}
                  {r.disabled ? " (nicht auswählbar)" : ""}
                </option>
              ))}
            </Form.Select>

            {/* Detailed role information */}
            <div className="mt-3">
              <h6>Rollen-Verfügbarkeit:</h6>
              <div className="row">
                {availableRoles.map((role) => (
                  <div key={role.value} className="col-12 mb-2">
                    <div className="d-flex align-items-center">
                      <Badge 
                        bg={role.disabled ? "danger" : "success"} 
                        className="me-2"
                      >
                        {role.disabled ? "Nicht verfügbar" : "Verfügbar"}
                      </Badge>
                      <span className="fw-bold me-2">
                        {role.label}:
                      </span>
                      <span className="text-muted small">
                        {role.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {calendarName === "Puppentheater" && (
              <Form.Text className="text-muted d-block mt-2">
                <strong>Hinweis:</strong> Für Puppentheater Veranstaltungen kann die Reiserolle nicht geändert werden. Diese werden automatisch zugewiesen.
              </Form.Text>
            )}

            {availableRoles.some(
              (r) => r.disabled && r.value === "passenger"
            ) && (
              <Form.Text className="text-warning d-block mt-2">
                <strong>Wichtiger Hinweis:</strong> Die Rolle "Beifahrer*in" ist nicht auswählbar, da bereits ein anderer Teilnehmer diese Rolle hat oder es keinen Fahrer*in gäbe, wenn Sie diese Rolle wählen würden.
              </Form.Text>
            )}

            {availableRoles.filter(r => !r.disabled).length === 0 && (
              <Alert variant="warning" className="mt-3">
                <strong>Keine Rollen verfügbar:</strong> Alle möglichen Reiserollen sind bereits besetzt oder nicht verfügbar.
              </Alert>
            )}
          </Form.Group>
        </Form>
      </div>
    );
  };

  // Main Render
  if (loading) {
    return (
      <DashboardLayout handleLogout={handleLogout} setAuth={setAuth}>
        <DashboardLoader message={loadingMessage} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      handleLogout={handleLogout}
      setAuth={setAuth}
      onRefresh={handleRefresh}
    >
      <div className="user-assigned-dashboard">
        {/* Header */}
        {!loading && (
          <div className="transparent-header-container">
            <div className="header-welcome-content">
              <h1 className="dashboard-main-title">
                Willkommen, {user?.Name || "Benutzer"}!
              </h1>
              {user?.joinedCalendars?.length > 0 && (
                <div style={{ margin: "15px 0px" }} className="joined-calendars-badges">
                  Deine beigetretenen Kalender:
                  {user.joinedCalendars.map((calendar, index) => (
                    <Badge
                      key={index}
                      bg="primary"
                      style={{ margin: "0px 2px" }}
                      className="calendar-badge"
                    >
                      {calendar.Calendar}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="header-search-box">
              <SearchBox
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Veranstaltungen suchen..."
              />
            </div>
          </div>
        )}

        {/* Messages */}
        {warning && (
          <Alert variant="warning" className="dashboard-alert" onClose={() => setWarning(null)} dismissible>
            {warning}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="dashboard-alert" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="dashboard-alert" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {/* Events Container with Tabs */}
        <div className="events-container">
          <div className="chrome-tabs-container">
            <div className="chrome-tabs">
              <button
                className={`chrome-tab ${activeTab === "myEvents" ? "active" : ""}`}
                onClick={() => setActiveTab("myEvents")}
              >
                Zukünftige Events
              </button>
              <button
                className={`chrome-tab ${activeTab === "completedEvents" ? "active" : ""}`}
                onClick={() => setActiveTab("completedEvents")}
              >
                Abgeschlossene Events
              </button>
              <button
                className={`chrome-tab ${activeTab === "paidEvents" ? "active" : ""}`}
                onClick={() => setActiveTab("paidEvents")}
              >
                Bezahlte Events
              </button>
            </div>
          </div>

          <div className="tab-content">
            <div className="summary-box mb-4">
              <h4>
                {activeTab === "myEvents" && "Meine Events"}
                {activeTab === "completedEvents" && "Abgeschlossene Events"}
                {activeTab === "paidEvents" && "Bezahlte Events"}
              </h4>
              <p>
                {activeTab === "myEvents" &&
                  "Hier finden Sie alle Ihre aktuellen und bevorstehenden Veranstaltungen."}
                {activeTab === "completedEvents" &&
                  "Diese Veranstaltungen wurden bereits abgeschlossen."}
                {activeTab === "paidEvents" &&
                  "Diese Veranstaltungen wurden bereits abgerechnet und bezahlt."}
              </p>
            </div>

            <h2 className="assigned-events-heading">
              {activeTab === "myEvents" && "Meine kommenden Events"}
              {activeTab === "completedEvents" && "Abgeschlossene Events"}
              {activeTab === "paidEvents" && "Bezahlte Events"}
            </h2>

            {totalFilteredEvents === 0 && !searchTerm ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Calendar3 size={48} />
                </div>
                <p className="empty-state-message">
                  {activeTab === "myEvents" &&
                    "Keine zugewiesenen Veranstaltungen gefunden."}
                  {activeTab === "completedEvents" &&
                    "Keine abgeschlossenen Veranstaltungen gefunden."}
                  {activeTab === "paidEvents" &&
                    "Keine bezahlten Veranstaltungen gefunden."}
                </p>
              </div>
            ) : (
              renderEventsTable(getEventsForActiveTab())
            )}
          </div>
        </div>

        {/* Modals */}
        {showEventModal && (
          <EventModal
            mode="assigned"
            user={user}
            modalFor="assigned"
            event={selectedEvent}
            onClose={() => setShowEventModal(false)}
          />
        )}

        {/* Receipt Modal */}
        <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Zahlungsbeleg</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedReceipt && (
              <div className="receipt-details">
                <div className="receipt-field">
                  <strong>Belegnummer:</strong> {selectedReceipt.receiptId}
                </div>
                <div className="receipt-field">
                  <strong>Veranstaltung:</strong> {selectedReceipt.eventName}
                </div>
                <div className="receipt-field">
                  <strong>Betrag:</strong> {selectedReceipt.amount}
                </div>
                <div className="receipt-field">
                  <strong>Datum:</strong> {selectedReceipt.date}
                </div>
                <div className="receipt-field">
                  <strong>Status: </strong>
                  <Badge bg="success">{selectedReceipt.status}</Badge>
                </div>
                <hr />
                <p className="receipt-note">
                  Dies ist ein Beispiel-Beleg für Demonstrationszwecke.
                </p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReceiptModal(false)}>
              Schließen
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              Beleg drucken
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Travel Role Modal */}
        <Modal
          show={showTravelRoleModal}
          onHide={() => !isUpdatingTravelRole && setShowTravelRoleModal(false)}
          backdrop={isUpdatingTravelRole ? "static" : true}
          keyboard={!isUpdatingTravelRole}
          size="lg"
        >
          <Modal.Header closeButton={!isUpdatingTravelRole}>
            <Modal.Title>
              {editingEvent?.calendarName === "Puppentheater"
                ? "Reiserolle anzeigen"
                : "Reiserolle ändern"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {renderRoleSelectionModal()}
            {warning && (
              <Alert variant="warning" className="mt-3" onClose={() => setWarning(null)} dismissible>
                {warning}
              </Alert>
            )}
            {error && (
              <Alert variant="danger" className="mt-3" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mt-3" onClose={() => setSuccess(null)} dismissible>
                {success}
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowTravelRoleModal(false)}
              disabled={isUpdatingTravelRole}
            >
              Schließen
            </Button>
            {editingEvent?.calendarName !== "Puppentheater" && (
              <Button
                variant="primary"
                onClick={handleSaveTravelRole}
                disabled={isUpdatingTravelRole || availableRoles.filter(r => !r.disabled).length === 0}
              >
                {isUpdatingTravelRole ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" aria-hidden="true" />
                    <span className="ms-2">Wird aktualisiert...</span>
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Leave Event Confirmation Modal */}
        <Modal
          show={showLeaveConfirmModal}
          onHide={() => !isLeaving && setShowLeaveConfirmModal(false)}
          backdrop={isLeaving ? "static" : true}
          keyboard={!isLeaving}
        >
          <Modal.Header closeButton={!isLeaving}>
            <Modal.Title>Verlassen bestätigen</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Sind Sie sicher, dass Sie die Veranstaltung "{eventToLeave?.summary}"
            verlassen möchten?
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowLeaveConfirmModal(false)}
              disabled={isLeaving}
            >
              Abbrechen
            </Button>
            <Button
              variant="danger"
              onClick={handleLeaveConfirm}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Wird entfernt...</span>
                </>
              ) : (
                "Verlassen"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default UserAssignedDashboard;