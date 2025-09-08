import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Button,
  Table,
  Alert,
  Badge,
  Spinner,
  Tooltip,
  Overlay,
  Form,
} from "react-bootstrap";
import {
  ArrowClockwise,
  Calendar3,
  ChevronDown,
  ChevronUp,
  PersonCircle,
  PersonDash,
  Receipt,
  Pencil,
  DashCircle,
  CarFront,
  InfoCircle,
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import DashboardLoader from "../components/DashboardLoader";
import { authApi } from "../utils/api";
import axios from "axios";
import EventModal from "../components/EventModal";
import ReactDOM from "react-dom";
import { jsx } from "react/jsx-runtime";

// Custom Tooltip Component that renders outside the main DOM tree
const CustomTooltip = ({
  show,
  target,
  children,
  placement = "top",
  variant = "dark",
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = React.useRef();

  useEffect(() => {
    if (show && target) {
      const rect = target.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current
        ? tooltipRef.current.offsetHeight
        : 0;

      let top = 0;
      let left = rect.left + rect.width / 2;

      if (placement === "top") {
        top = rect.top - tooltipHeight - 8;
      } else if (placement === "bottom") {
        top = rect.bottom + 8;
      }

      setPosition({ top, left });
    }
  }, [show, target, placement]);

  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      className={`custom-tooltip custom-tooltip-${variant}`}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      {children}
      <div className="custom-tooltip-arrow"></div>
    </div>,
    document.body
  );
};

function UserAssignedDashboard({ setAuth, handleLogout }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Daten werden geladen..."
  );
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [eventToLeave, setEventToLeave] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("myEvents");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Tooltip state
  const [tooltipShow, setTooltipShow] = useState({});
  const [tooltipTargets, setTooltipTargets] = useState({});

  const [showTravelRoleModal, setShowTravelRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  // Add this state near the other state declarations
  const [isUpdatingTravelRole, setIsUpdatingTravelRole] = useState(false);

  const CALENDAR_MAPPING = {
    "Klavier Mitmachkonzert": "info@kidskulturspass.de",
    "Geigen Mitmachkonzert":
      "7111s8p6jb3oau6t1ufjlloido@group.calendar.google.com",
    "Weihnachts Mitmachkonzert":
      "70fsor795u3sgq4qenes0akpds@group.calendar.google.com",
    "Nikolaus Besuch": "onogqrrdnif7emfdj84etq7nas@group.calendar.google.com",
    "Laternenumzug mit Musik":
      "81a15ca9db886aadd3db93e6121dee9c607aeb390d5e6e353e6ee6a3a2d87f7f@group.calendar.google.com",
    Puppentheater:
      "3798c15a6afb9d16f832d4da08afdf46c59fb95ded9a26911b0df49a7613d6fc@group.calendar.google.com",
  };

  const API_URL =
    "https://user-dashboard-data-754826373806.europe-west1.run.app";
  const USER_API_URL =
    "https://artist-crud-function-754826373806.europe-west10.run.app";

  // Sort events by date (most recent first)
  const sortEventsByDate = (eventsArray) => {
    return [...eventsArray].sort((a, b) => {
      const dateA = a.start?.dateTime
        ? new Date(a.start.dateTime).getTime()
        : 0;
      const dateB = b.start?.dateTime
        ? new Date(b.start.dateTime).getTime()
        : 0;
      return dateA - dateB;
    });
  };

  const handleOpenTravelRoleModal = (event, user) => {
    setEditingEvent(event);
    setEditingUser(user);

    // calculate roles according to rules
    const roles = determineAvailableRoles(event, user);
    setAvailableRoles(roles);

    // default to the user's current travelRole if present, otherwise first available
    const defaultRole =
      user?.travelRole && roles.some((r) => r.value === user.travelRole)
        ? user.travelRole
        : roles[0].value;
    setSelectedRole(defaultRole);

    setShowTravelRoleModal(true);
  };

  // ---------------------------
  // Updated: handleSaveTravelRole (with guard for disabled option)
  // ---------------------------
  const handleSaveTravelRole = async () => {
    if (!editingEvent || !editingUser || !selectedRole) {
      console.error("Missing data to save travel role", {
        editingEvent,
        editingUser,
        selectedRole,
      });
      return;
    }

    // find role meta (to check disabled status)
    const roleMeta = availableRoles.find((r) => r.value === selectedRole);

    // guard: if role is disabled *and* it's not the user's current role, prevent changing
    if (
      roleMeta?.disabled &&
      selectedRole !== (editingUser?.travelRole || "")
    ) {
      setWarning(
        "Diese Reiserolle kann nicht ausgewählt werden, weil ein anderer Teilnehmer bereits die Rolle 'Passenger' hat."
      );
      return;
    }

    setIsUpdatingTravelRole(true);
    setLoadingMessage("Reiserolle wird aktualisiert...");
    setSuccess(null);
    setWarning(null);

    try {
      // prepare payload - adjust to your API shape
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
      if (response.data.success) {
        setSuccess("Reiserolle erfolgreich aktualisiert!");
        setTimeout(() => setSuccess(null), 20000);
        // wait a bit for upstream calendar sync if you want (optional)
        await new Promise((res) => setTimeout(res, 2000));
        await fetchData();
        setShowTravelRoleModal(false);
      } else {
        setWarning(
          response.data.message || "Fehler beim Aktualisieren der Reiserolle"
        );
      }
    } catch (err) {
      console.error("Error updating travel role", err);
      setError("Fehler beim Aktualisieren der Reiserolle");
    } finally {
      setIsUpdatingTravelRole(false);
      setLoadingMessage(null);
    }
  };
  // Generate dummy data for completed and paid events
  const generateDummyEvents = useCallback((eventsData, type) => {
    const dummyEvents = JSON.parse(JSON.stringify(eventsData));

    Object.keys(dummyEvents).forEach((calendar) => {
      dummyEvents[calendar] = dummyEvents[calendar].map((event) => {
        // Add dummy data based on type
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

  const [completedEvents, setCompletedEvents] = useState({});
  const [paidEvents, setPaidEvents] = useState({});

  const determineAvailableRoles = (event, user) => {
    const attendees = event?.attendees || [];
    const currentRole = (user?.travelRole || "").toLowerCase();

    // helper to build object form
    const R = (value, disabled = false) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
      disabled,
    });

    // Only 1 artist (the user themself) => can choose either freely
    if (attendees.length === 1) {
      return [R("driver", false), R("passenger", false)];
    }

    // 2 artists -> apply the cases
    if (attendees.length === 2) {
      const other = attendees.find((a) => a.email !== user.email) || {};
      const otherRole = (other.travelRole || "").toLowerCase();

      // Case A: current user is passenger -> show passenger (default) then driver (both selectable)
      if (currentRole === "passenger") {
        return [R("passenger", false), R("driver", false)];
      }

      // Case B: current user is driver -> behavior depends on the other artist
      if (currentRole === "driver") {
        if (otherRole === "driver") {
          // the other is driver too -> both selectable
          return [R("driver", false), R("passenger", false)];
        }
        if (otherRole === "passenger") {
          // the other is passenger -> current must stay driver; passenger option shown but unselectable
          return [R("driver", false), R("passenger", true)];
        }
        // fallback: the other has no role info -> allow both
        return [R("driver", false), R("passenger", false)];
      }

      // fallback: currentRole unknown -> prefer current (if present) else driver first
      if (!currentRole) {
        return [R("driver", false), R("passenger", false)];
      }

      // ultimate fallback: both
      return [R("driver", false), R("passenger", false)];
    }

    // More than 2 attendees: fallback to both selectable (not covered by your rules)
    return [
      { value: "driver", label: "Driver", disabled: false },
      { value: "passenger", label: "Passenger", disabled: false },
    ];
  };
  // Fetch user data and events
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Benutzerdaten werden geladen...");

      // Get authenticated user
      const res = await authApi.getMe();
      const currentUser = res.data.user;
      // Get complete user data including joined calendars
      const userData = await axios.get(
        `${USER_API_URL}/?id=${currentUser._id}`
      );
      console.log("User Data:", userData.data);
      setUser(userData.data);

      const joinedCalendars = userData.data.joinedCalendars || [];
      const calendarNames = joinedCalendars.map((c) => c.Calendar);

      // Fetch assigned events for these calendars
      setLoadingMessage("Veranstaltungen werden geladen...");
      const eventsRes = await axios.get(`${API_URL}/assigned`, {
        params: {
          email: userData.data["E-Mail"],
          calendars: calendarNames.join(","),
          categorize: true,
        },
      });

      const responseData = eventsRes.data;
      console.log("response Data:", JSON.stringify(responseData, null, 2));

      // Sort events for each calendar by date
      const sortedCategorizedEvents = {};
      Object.keys(responseData.categorizedEvents || {}).forEach((calendar) => {
        sortedCategorizedEvents[calendar] = sortEventsByDate(
          responseData.categorizedEvents[calendar]
        );
      });

      setEvents(sortedCategorizedEvents);

      // Generate dummy data for completed and paid events
      setCompletedEvents(
        generateDummyEvents(sortedCategorizedEvents, "completed")
      );
      setPaidEvents(generateDummyEvents(sortedCategorizedEvents, "paid"));

      // Initialize expanded state for calendars
      const initialExpandState = {};
      Object.keys(sortedCategorizedEvents || {}).forEach((cal) => {
        initialExpandState[cal] = true;
      });
      setExpandedCalendars(initialExpandState);

      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(
        "Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut."
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCalendarExpand = useCallback((calendar) => {
    setExpandedCalendars((prev) => ({
      ...prev,
      [calendar]: !prev[calendar],
    }));
  }, []);

  // Handle event details click
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
    setSuccess(null);

    try {
      // Find the calendar ID by matching the calendar name
      const calendarName = eventToLeave.calendarName?.trim().toLowerCase();
      let calendarId = null;

      for (const [name, id] of Object.entries(CALENDAR_MAPPING)) {
        if (name.trim().toLowerCase() === calendarName) {
          calendarId = id;
          break;
        }
      }

      if (!calendarId) {
        console.error("Calendar ID not found for:", eventToLeave.calendarName);
        setWarning("Kalender-ID konnte nicht gefunden werden");
        setIsLeaving(false);
        return;
      }

      // Prepare request data
      const requestData = {
        calendarId,
        eventId: eventToLeave.id,
        artistEmail: user["E-Mail"],
      };

      // API call
      const response = await axios.post(
        `${API_URL}/remove-artist`,
        requestData
      );

      if (response.data.success) {
        // Wait before refreshing
        await new Promise((resolve) => setTimeout(resolve, 20000));

        setSuccess("Artist erfolgreich von der Veranstaltung entfernt!");
        setTimeout(() => {
          setSuccess(null);
        }, 5000);

        await fetchData();
        setShowLeaveConfirmModal(false);
        setEventToLeave(null);
      } else {
        setWarning(
          response.data.message || "Fehler beim Entfernen des Artists"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Fehler beim Entfernen des Artists");
    } finally {
      setIsLeaving(false);
    }
  }, [eventToLeave, user, fetchData]);

  // Handle receipt view
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

  // Filter events based on search term
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
  }, [
    activeTab,
    filteredEventsByCalendar,
    filteredCompletedEvents,
    filteredPaidEvents,
  ]);

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

  // Force refresh button handler
  const handleRefresh = useCallback(() => {
    setEvents({});
    setError(null);
    setWarning(null);
    fetchData();
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Tooltip handlers
  const handleTooltipShow = (key, target) => {
    setTooltipShow((prev) => ({ ...prev, [key]: true }));
    setTooltipTargets((prev) => ({ ...prev, [key]: target }));
  };

  const handleTooltipHide = (key) => {
    setTooltipShow((prev) => ({ ...prev, [key]: false }));
  };

  if (loading) {
    return (
      <DashboardLayout handleLogout={handleLogout} setAuth={setAuth}>
        <DashboardLoader message={loadingMessage} />
      </DashboardLayout>
    );
  }

  // Render events table for a specific tab
  const renderEventsTable = (eventsData) => {
    return (
      <>
        {calendars.map((calendar) => {
          const hasEvents = eventsData[calendar]?.length > 0;
          const isFilteredOut = searchTerm && !calendarHasMatch(calendar);

          return (
            <div
              key={calendar}
              className={`event-calendar-card ${
                isFilteredOut ? "filtered-out" : ""
              }`}
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
                      {/* Regular table for desktop */}
                      <div className="table-responsive d-none d-md-block">
                        <Table
                          className={`events-table ${
                            activeTab === "myEvents" || "paidEvents"
                              ? "six-columns"
                              : "five-columns"
                          }`}
                        >
                          {/* Table headers for My Events (6 columns) */}
                          <thead>
                            <tr>
                              <th>Veranstaltung</th>
                              <th>Meine Rolle(n)</th>
                              <th>Reiserolle</th>
                              <th>Datum/Uhrzeit</th>
                              <th>Status</th>
                              <th>Gesamtkosten</th>
                              {activeTab === "myEvents" && <th>Aktion</th>}
                            </tr>
                          </thead>

                          {/* Table headers for Completed/Paid Events (5 columns) */}
                          {(activeTab === "completedEvents" ||
                            activeTab === "paidEvents") && (
                            <thead>
                              <tr>
                                <th>Veranstaltung</th>
                                <th>Meine Rolle(n)</th>
                                <th>Reiserolle</th> {/* NEW COLUMN */}
                                <th>Datum/Uhrzeit</th>
                                <th>Status</th>
                                <th>Gesamtkosten</th>
                                {/* Note: The "Aktion" column is in a separate column group */}
                              </tr>
                            </thead>
                          )}
                          <tbody>
                            {eventsData[calendar].map((event, index) => {
                              const detailKey = `detail-${calendar}-${index}`;
                              const leaveKey = `leave-${calendar}-${index}`;
                              const receiptKey = `receipt-${calendar}-${index}`;

                              return (
                                <tr key={index} className="event-row">
                                  <td className="event-details">
                                    <div className="event-title">
                                      {event.summary}
                                    </div>
                                    <div className="event-location">
                                      {event.location}
                                    </div>
                                  </td>
                                  <td className="event-time date-time-column">
                                    {event?.start?.dateTime ? (
                                      <div className="date-time">
                                        <div className="date">
                                          {new Date(
                                            event.start.dateTime
                                          ).toLocaleDateString("de-DE", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            timeZone: event.start.timeZone,
                                          })}
                                        </div>
                                        <div className="time">
                                          {new Date(
                                            event.start.dateTime
                                          ).toLocaleTimeString("de-DE", {
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
                                  <td className="event-travelRole">
                                    {(() => {
                                      const currentUser = event.attendees?.find(
                                        (a) => a.email === user["E-Mail"] // <-- replace with logged-in user email
                                      );
                                      if (!currentUser?.travelRole)
                                        return "Keine Reiserolle";

                                      return (
                                        <div className="travelRole-display d-flex align-items-center">
                                          <span className="me-2">
                                            {currentUser.travelRole
                                              .charAt(0)
                                              .toUpperCase() +
                                              currentUser.travelRole.slice(1)}
                                          </span>

                                          <Button
                                            variant="link"
                                            size="sm"
                                            className="p-0 travelRole-edit-btn"
                                            onClick={() =>
                                              handleOpenTravelRoleModal(
                                                event,
                                                currentUser
                                              )
                                            }
                                          >
                                            <Pencil
                                              className="text-primary"
                                              size={16}
                                            />
                                          </Button>
                                        </div>
                                      );
                                    })()}
                                  </td>

                                  <td className="event-status">
                                    {activeTab === "myEvents" && (
                                      <Badge bg="primary">bevorstehend</Badge>
                                    )}
                                    {activeTab === "completedEvents" && (
                                      <Badge bg="success">Abgeschlossen</Badge>
                                    )}
                                    {activeTab === "paidEvents" && (
                                      <Badge bg="info">Bezahlt</Badge>
                                    )}
                                  </td>
                                  <td className="event-cost">
                                    {event?.eventExpense?.totalExpense ? (
                                      <>
                                        {event.eventExpense.totalExpense}
                                        <i className="bi bi-currency-euro"></i>
                                      </>
                                    ) : (
                                      "N/A"
                                    )}
                                  </td>

                                  <td className="event-actions actions-column">
                                    <Button
                                      ref={(el) => {
                                        if (el && !tooltipTargets[detailKey]) {
                                          setTooltipTargets((prev) => ({
                                            ...prev,
                                            [detailKey]: el,
                                          }));
                                        }
                                      }}
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => handleEventClick(event)}
                                      onMouseEnter={(e) =>
                                        handleTooltipShow(
                                          detailKey,
                                          e.currentTarget
                                        )
                                      }
                                      onMouseLeave={() =>
                                        handleTooltipHide(detailKey)
                                      }
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
                                            if (
                                              el &&
                                              !tooltipTargets[leaveKey]
                                            ) {
                                              setTooltipTargets((prev) => ({
                                                ...prev,
                                                [leaveKey]: el,
                                              }));
                                            }
                                          }}
                                          variant="danger"
                                          size="sm"
                                          onClick={() =>
                                            handleLeaveClick(event)
                                          }
                                          onMouseEnter={(e) =>
                                            handleTooltipShow(
                                              leaveKey,
                                              e.currentTarget
                                            )
                                          }
                                          onMouseLeave={() =>
                                            handleTooltipHide(leaveKey)
                                          }
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
                                            if (
                                              el &&
                                              !tooltipTargets[receiptKey]
                                            ) {
                                              setTooltipTargets((prev) => ({
                                                ...prev,
                                                [receiptKey]: el,
                                              }));
                                            }
                                          }}
                                          variant="outline-info"
                                          size="sm"
                                          onClick={() =>
                                            handleViewReceipt(event)
                                          }
                                          onMouseEnter={(e) =>
                                            handleTooltipShow(
                                              receiptKey,
                                              e.currentTarget
                                            )
                                          }
                                          onMouseLeave={() =>
                                            handleTooltipHide(receiptKey)
                                          }
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
                            })}
                          </tbody>
                        </Table>
                      </div>

                      {/* Mobile-friendly cards for small screens */}
                      <div className="event-cards-container d-md-none">
                        {eventsData[calendar].map((event, index) => {
                          const detailKey = `mobile-detail-${calendar}-${index}`;
                          const leaveKey = `mobile-leave-${calendar}-${index}`;
                          const receiptKey = `mobile-receipt-${calendar}-${index}`;

                          return (
                            <div key={index} className="event-mobile-card">
                              <div className="event-mobile-header">
                                <div className="event-mobile-title">
                                  {event.summary}
                                </div>
                                <div className="event-mobile-status">
                                  {activeTab === "myEvents" && (
                                    <Badge bg="primary">bevorstehend</Badge>
                                  )}
                                  {activeTab === "completedEvents" && (
                                    <Badge bg="success">Abgeschlossen</Badge>
                                  )}
                                  {activeTab === "paidEvents" && (
                                    <Badge bg="info">Bezahlt</Badge>
                                  )}
                                </div>
                              </div>

                              <div className="event-mobile-content">
                                <div className="event-mobile-roles">
                                  {event.role?.split(", ").map((role, i) => (
                                    <Badge
                                      key={i}
                                      className="role-badge"
                                      bg="success"
                                    >
                                      {role.trim()}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="event-mobile-details">
                                  {event.location && (
                                    <div className="event-mobile-location">
                                      <i className="bi bi-geo-alt"></i>{" "}
                                      {event.location}
                                    </div>
                                  )}
                                  {/* Add this to event-mobile-details */}
                                  {event.start?.dateTime && (
                                    <div className="event-mobile-datetime">
                                      <i className="bi bi-calendar-event"></i>{" "}
                                      {new Date(
                                        event.start.dateTime
                                      ).toLocaleDateString("de-DE")}
                                      <span className="mobile-time">
                                        {" "}
                                        {new Date(
                                          event.start.dateTime
                                        ).toLocaleTimeString("de-DE", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  )}

                                  {event?.eventExpense?.totalExpense && (
                                    <div className="event-mobile-cost">
                                      <i className="bi bi-currency-euro"></i>{" "}
                                      Gesamtkosten:{" "}
                                      {event?.eventExpense?.totalExpense}
                                    </div>
                                  )}
                                  {event.attendees && (
                                    <div className="event-mobile-travelRole d-flex align-items-center">
                                      <CarFront className="text-primary me-2" />
                                      <span>
                                        {(() => {
                                          const currentUser =
                                            event.attendees.find(
                                              (a) => a.email === user["E-Mail"]
                                            );
                                          if (!currentUser?.travelRole)
                                            return "Keine Reiserolle";
                                          return (
                                            currentUser.travelRole
                                              .charAt(0)
                                              .toUpperCase() +
                                            currentUser.travelRole.slice(1)
                                          );
                                        })()}
                                      </span>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="travelRole-edit-btn ms-2 d-flex align-items-center"
                                        onClick={() =>
                                          handleOpenTravelRoleModal(
                                            event,
                                            event.attendees.find(
                                              (a) => a.email === user["E-Mail"]
                                            )
                                          )
                                        }
                                      >
                                        <Pencil className="text-primary me-1" />
                                        Bearbeiten
                                      </Button>
                                    </div>
                                  )}
                                </div>

                                <div className="event-mobile-actions">
                                  <Button
                                    ref={(el) => {
                                      if (el && !tooltipTargets[detailKey]) {
                                        setTooltipTargets((prev) => ({
                                          ...prev,
                                          [detailKey]: el,
                                        }));
                                      }
                                    }}
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEventClick(event)}
                                    onMouseEnter={(e) =>
                                      handleTooltipShow(
                                        detailKey,
                                        e.currentTarget
                                      )
                                    }
                                    onMouseLeave={() =>
                                      handleTooltipHide(detailKey)
                                    }
                                    className="me-2"
                                  >
                                    <InfoCircle className="me-1" />
                                    Details
                                  </Button>
                                  <CustomTooltip
                                    show={tooltipShow[detailKey]}
                                    target={tooltipTargets[detailKey]}
                                    variant="primary"
                                  >
                                    Details
                                  </CustomTooltip>

                                  {activeTab === "paidEvents" && (
                                    <>
                                      <Button
                                        ref={(el) => {
                                          if (
                                            el &&
                                            !tooltipTargets[receiptKey]
                                          ) {
                                            setTooltipTargets((prev) => ({
                                              ...prev,
                                              [receiptKey]: el,
                                            }));
                                          }
                                        }}
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => handleViewReceipt(event)}
                                        onMouseEnter={(e) =>
                                          handleTooltipShow(
                                            receiptKey,
                                            e.currentTarget
                                          )
                                        }
                                        onMouseLeave={() =>
                                          handleTooltipHide(receiptKey)
                                        }
                                        className="me-2"
                                      >
                                        <Receipt className="me-1" />
                                        Beleg
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
                                  {activeTab === "myEvents" && (
                                    <>
                                      <Button
                                        ref={(el) => {
                                          if (el && !tooltipTargets[leaveKey]) {
                                            setTooltipTargets((prev) => ({
                                              ...prev,
                                              [leaveKey]: el,
                                            }));
                                          }
                                        }}
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleLeaveClick(event)}
                                        onMouseEnter={(e) =>
                                          handleTooltipShow(
                                            leaveKey,
                                            e.currentTarget
                                          )
                                        }
                                        onMouseLeave={() =>
                                          handleTooltipHide(leaveKey)
                                        }
                                        className="leave-event-button"
                                      >
                                        <DashCircle className="me-1" />
                                        Verlassen
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
                                </div>
                              </div>
                            </div>
                          );
                        })}
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

  return (
    <DashboardLayout
      handleLogout={handleLogout}
      setAuth={setAuth}
      onRefresh={handleRefresh}
    >
      <div className="user-assigned-dashboard">
        {/* Header section with welcome message and search box */}
        {!loading && (
          <div className="transparent-header-container">
            <div className="header-welcome-content">
              <h1 className="dashboard-main-title">
                Willkommen, {user?.Name || "Benutzer"}!
              </h1>
              {user?.joinedCalendars?.length > 0 && (
                <div
                  style={{ margin: "15px 0px" }}
                  className="joined-calendars-badges"
                >
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
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>
        )}
        {warning && (
          <Alert variant="warning" className="dashboard-alert">
            {warning}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="dashboard-alert">
            {success}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" className="dashboard-alert">
            {error}
          </Alert>
        )}

        {/* Events Container with Tabs */}
        <div className="events-container">
          <div className="chrome-tabs-container">
            <div className="chrome-tabs">
              <button
                className={`chrome-tab ${
                  activeTab === "myEvents" ? "active" : ""
                }`}
                onClick={() => setActiveTab("myEvents")}
              >
                Upcoming Events
              </button>
              <button
                className={`chrome-tab ${
                  activeTab === "completedEvents" ? "active" : ""
                }`}
                onClick={() => setActiveTab("completedEvents")}
              >
                Abgeschlossene Events
              </button>
              <button
                className={`chrome-tab ${
                  activeTab === "paidEvents" ? "active" : ""
                }`}
                onClick={() => setActiveTab("paidEvents")}
              >
                Bezahlte Events
              </button>
            </div>
          </div>

          <div className="tab-content">
            {/* Summary Box */}
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

        {/* Event Modal */}
        {showEventModal && (
          <EventModal
            user={user}
            modalFor={"assigned"}
            event={selectedEvent}
            onClose={() => setShowEventModal(false)}
          />
        )}

        {/* Receipt Modal */}
        <Modal
          show={showReceiptModal}
          onHide={() => setShowReceiptModal(false)}
        >
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
            <Button
              variant="secondary"
              onClick={() => setShowReceiptModal(false)}
            >
              Schließen
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              Beleg drucken
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      {/* 🔹 Travel Role Modal */}
      <Modal
        show={showTravelRoleModal}
        onHide={() => !isUpdatingTravelRole && setShowTravelRoleModal(false)}
        backdrop={isUpdatingTravelRole ? "static" : true}
        keyboard={!isUpdatingTravelRole}
      >
        <Modal.Header closeButton={!isUpdatingTravelRole}>
          <Modal.Title>Reiserolle ändern</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Neue Rolle wählen</Form.Label>

              <Form.Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isUpdatingTravelRole}
              >
                {availableRoles.map((r) => (
                  // `disabled` on option will prevent the user from selecting it
                  <option key={r.value} value={r.value} disabled={r.disabled}>
                    {r.label === "Driver"
                      ? "Fahrer*in"
                      : r.label === "Passenger"
                      ? "Beifahrer*in"
                      : r.label === "None"
                      ? "Keine Reiserolle"
                      : r.label}
                    {r.disabled ? " (nicht auswählbar)" : ""}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {warning && (
              <Alert variant="warning" className="mt-3">
                {warning}
              </Alert>
            )}
            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mt-3">
                {success}
              </Alert>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTravelRoleModal(false)}
            disabled={isUpdatingTravelRole}
          >
            Abbrechen
          </Button>

          <Button
            variant="primary"
            onClick={handleSaveTravelRole}
            disabled={isUpdatingTravelRole}
          >
            {isUpdatingTravelRole ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  aria-hidden="true"
                />
                <span className="ms-2">Wird aktualisiert...</span>
              </>
            ) : (
              "Speichern"
            )}
          </Button>
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
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Wird entfernt...</span>
              </>
            ) : (
              "Verlassen"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
}

export default UserAssignedDashboard;
