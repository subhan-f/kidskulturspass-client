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
  InfoCircle,
  PlusCircle,
} from "react-bootstrap-icons";
import { SearchBox, DashboardLoader } from "../components/common";
import { DashboardLayout } from "../components/layout";
import { authApi } from "../utils/api";
import axios from "axios";
import EventModal from "../components/EventModal";
import CustomTooltip from "../components/common/CustomToolTip/CustomToolTip";

const API_URL = "https://user-dashboard-data-754826373806.europe-west1.run.app";
const USER_API_URL =
  "https://artist-crud-function-754826373806.europe-west10.run.app";

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

const CALENDAR_ROLES = {
  "Geigen Mitmachkonzert": { roles: ["Geiger*in", "Moderator*in"] },
  "Klavier Mitmachkonzert": { roles: ["Pianist*in", "Moderator*in"] },
  "Laternenumzug mit Musik": { roles: ["Instrumentalist*in", "Sängerin*in"] },
  "Nikolaus Besuch": { roles: ["Nikolaus", "Sängerin*in"] },
  Puppentheater: { roles: ["Puppenspieler*in"], singleRole: true },
  "Weihnachts Mitmachkonzert": { roles: ["Detlef", "Sängerin*in"] },
};

function UserUnassignedDashboard({ setAuth, handleLogout }) {
  // State Management
  const [user, setUser] = useState(null);
  const [categorizedEvents, setCategorizedEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Daten werden geladen..."
  );
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [isJoining, setIsJoining] = useState(false);

  // Modal States
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToJoin, setEventToJoin] = useState(null);
  const [showJoinConfirmModal, setShowJoinConfirmModal] = useState(false);
  const [roleSelection, setRoleSelection] = useState("");
  const [roleAvailability, setRoleAvailability] = useState({
    driver: { available: false, reason: "" },
    passenger: { available: false, reason: "" },
  });

  // Tooltip State
  const [tooltipShow, setTooltipShow] = useState({});
  const [tooltipTargets, setTooltipTargets] = useState({});

  // Utility Functions
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

  // Calculate role availability based on attendees
  const calculateRoleAvailability = useCallback((event) => {
    if (!event?.attendees) {
      // No attendees yet - both roles available for non-Puppentheater events
      const isPuppentheater = event?.calendarName === "Puppentheater";
      return {
        driver: {
          available: !isPuppentheater,
          reason: isPuppentheater
            ? "Für Puppentheater ist nur die Rolle 'Fahrer*in' verfügbar und automatisch zugewiesen."
            : "Keine Künstler in dieser Veranstaltung. Beide Rollen verfügbar.",
        },
        passenger: {
          available: !isPuppentheater,
          reason: isPuppentheater
            ? "Für Puppentheater ist nur die Rolle 'Fahrer*in' verfügbar."
            : "Keine Künstler in dieser Veranstaltung. Beide Rollen verfügbar.",
        },
      };
    }

    const attendees = event.attendees || [];
    const existingDriver = attendees.find(
      (a) => a.artistTravelRole === "driver"
    );
    const existingPassenger = attendees.find(
      (a) => a.artistTravelRole === "passenger"
    );

    // For non-Puppentheater events
    if (event.calendarName !== "Puppentheater") {
      if (existingDriver && !existingPassenger) {
        // Driver exists, passenger available
        return {
          driver: {
            available: true,
            reason: existingDriver.displayName
              ? `Fahrer*in-Rolle verfügbar, da ${existingDriver.displayName} bereits als Fahrer*in angemeldet ist.`
              : "Fahrer*in-Rolle verfügbar.",
          },
          passenger: {
            available: true,
            reason: existingDriver.displayName
              ? `Beifahrer*in-Rolle verfügbar, da ${existingDriver.displayName} bereits als Fahrer*in fungiert.`
              : "Beifahrer*in-Rolle verfügbar.",
          },
        };
      } else if (existingPassenger && !existingDriver) {
        // Passenger exists, only driver available
        return {
          driver: {
            available: true,
            reason: existingPassenger.displayName
              ? `Fahrer*in-Rolle verfügbar, da ${existingPassenger.displayName} bereits als Beifahrer*in angemeldet ist.`
              : "Fahrer*in-Rolle verfügbar.",
          },
          passenger: {
            available: false,
            reason: existingPassenger.displayName
              ? `Beifahrer*in-Rolle nicht verfügbar, da ${existingPassenger.displayName} bereits als Beifahrer*in angemeldet ist.`
              : "Beifahrer*in-Rolle bereits besetzt.",
          },
        };
      } else if (existingDriver && existingPassenger) {
        // Both roles taken
        return {
          driver: {
            available: false,
            reason:
              existingDriver.displayName && existingPassenger.displayName
                ? `Fahrer*in-Rolle nicht verfügbar, da ${existingDriver.displayName} bereits als Fahrer*in und ${existingPassenger.displayName} als Beifahrer*in angemeldet sind.`
                : "Fahrer*in-Rolle bereits besetzt.",
          },
          passenger: {
            available: false,
            reason:
              existingDriver.displayName && existingPassenger.displayName
                ? `Beifahrer*in-Rolle nicht verfügbar, da ${existingDriver.displayName} bereits als Fahrer*in und ${existingPassenger.displayName} als Beifahrer*in angemeldet sind.`
                : "Beifahrer*in-Rolle bereits besetzt.",
          },
        };
      } else {
        // No travel roles assigned yet, but there might be attendees without travel roles
        const hasAttendeesWithoutTravelRole = attendees.some(
          (a) => !a.artistTravelRole
        );
        if (hasAttendeesWithoutTravelRole) {
          return {
            driver: {
              available: true,
              reason:
                "Fahrer*in-Rolle verfügbar, da vorhandene Künstler keine Reiserolle haben.",
            },
            passenger: {
              available: true,
              reason:
                "Beifahrer*in-Rolle verfügbar, da vorhandene Künstler keine Reiserolle haben.",
            },
          };
        }
        // No attendees with travel roles
        return {
          driver: {
            available: true,
            reason:
              "Keine Künstler mit Reiserollen in dieser Veranstaltung. Beide Rollen verfügbar.",
          },
          passenger: {
            available: true,
            reason:
              "Keine Künstler mit Reiserollen in dieser Veranstaltung. Beide Rollen verfügbar.",
          },
        };
      }
    } else {
      // Puppentheater - only driver available
      return {
        driver: {
          available: true,
          reason:
            "Für Puppentheater ist nur die Rolle 'Fahrer*in' verfügbar und automatisch zugewiesen.",
        },
        passenger: {
          available: false,
          reason: "Für Puppentheater ist nur die Rolle 'Fahrer*in' verfügbar.",
        },
      };
    }
  }, []);

  // Data Fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Benutzerdaten werden geladen...");
      clearMessages();

      const res = await authApi.getMe();
      const currentUser = res.data.user;
      const userData = await axios.get(
        `${USER_API_URL}/?id=${currentUser._id}`
      );
      setUser(userData.data);

      const joinedCalendars = userData.data.joinedCalendars || [];
      const joinedCalendarsEncoded = encodeURIComponent(
        JSON.stringify(joinedCalendars)
      );

      setLoadingMessage("Nicht zugewiesene Veranstaltungen werden geladen...");
      const unassignedRes = await axios.get(
        `${API_URL}/unassigned?joinedCalendars=${joinedCalendarsEncoded}`
      );

      // Sort events for each calendar by date
      const sortedCategorizedEvents = {};
      Object.keys(unassignedRes.data.categorizedEvents || {}).forEach(
        (calendar) => {
          sortedCategorizedEvents[calendar] = sortEventsByDate(
            unassignedRes.data.categorizedEvents[calendar]
          );
        }
      );

      setCategorizedEvents(sortedCategorizedEvents);

      // Initialize all calendars as expanded
      const initialExpandState = {};
      Object.keys(sortedCategorizedEvents || {}).forEach((cal) => {
        initialExpandState[cal] = true;
      });
      setExpandedCalendars(initialExpandState);

      setLoading(false);
    } catch (err) {
      setError(
        "Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut."
      );
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

  const handleJoinClick = useCallback(
    (event) => {
      setEventToJoin(event);

      // Calculate role availability for this event
      const availability = calculateRoleAvailability(event);
      setRoleAvailability(availability);

      // Set default role selection based on availability
      if (availability.driver.available) {
        setRoleSelection("driver");
      } else if (availability.passenger.available) {
        setRoleSelection("passenger");
      } else {
        setRoleSelection("");
      }

      setShowJoinConfirmModal(true);
    },
    [calculateRoleAvailability]
  );

  const handleJoinConfirm = useCallback(async () => {
    if (!eventToJoin || isJoining) return;

    // For ALL events, check if a role is selected when roles are available
    const hasAvailableRole =
      roleAvailability.driver.available || roleAvailability.passenger.available;

    if (hasAvailableRole && !roleSelection) {
      setWarning("Bitte wählen Sie eine Rolle aus.");
      return;
    }

    // Validate selected role is available if one was selected
    if (roleSelection) {
      const isRoleAvailable = roleAvailability[roleSelection]?.available;
      if (!isRoleAvailable) {
        setWarning(
          `Die ausgewählte Rolle (${
            roleSelection === "driver" ? "Fahrer*in" : "Beifahrer*in"
          }) ist nicht verfügbar.`
        );
        return;
      }
    }

    setIsJoining(true);
    setLoadingMessage("Artist wird zur Veranstaltung hinzugefügt...");
    clearMessages();

    try {
      const calendarName = eventToJoin.calendarName?.trim();
      const calendarId = CALENDAR_MAPPING[calendarName];

      if (!calendarId) {
        setWarning("Kalender-ID konnte nicht gefunden werden");
        setIsJoining(false);
        return;
      }

      const requestData = {
        calendarId,
        eventId: eventToJoin.id,
        user,
        travelRole: roleSelection || null,
      };

      const response = await axios.post(`${API_URL}/add-artist`, requestData);

      if (response.data.success) {
        await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait for processing
        setSuccess("Artist erfolgreich zur Veranstaltung hinzugefügt!");
        await fetchData();
        setShowJoinConfirmModal(false);
        setEventToJoin(null);
        setRoleSelection("");
      } else {
        setWarning(
          response.data.message || "Fehler beim Hinzufügen des Artists"
        );
      }
    } catch (error) {
      setError("Fehler beim Hinzufügen des Artists");
    } finally {
      setIsJoining(false);
    }
  }, [eventToJoin, user, roleSelection, roleAvailability]);

  const handleRefresh = useCallback(() => {
    setCategorizedEvents({});
    clearMessages();
    fetchData();
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoized Computations
  const filteredEventsByCalendar = useMemo(() => {
    const filtered = {};
    Object.keys(categorizedEvents).forEach((calendar) => {
      filtered[calendar] = (categorizedEvents[calendar] || []).filter(
        (event) =>
          (event.summary || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.calendar || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.location || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    });
    return filtered;
  }, [categorizedEvents, searchTerm]);

  const calendars = useMemo(
    () => Object.keys(filteredEventsByCalendar).sort(),
    [filteredEventsByCalendar]
  );

  const totalFilteredEvents = useMemo(
    () => Object.values(filteredEventsByCalendar).flat().length,
    [filteredEventsByCalendar]
  );

  const calendarHasMatch = useCallback(
    (calendar) => filteredEventsByCalendar[calendar]?.length > 0,
    [filteredEventsByCalendar]
  );

  // Render Helper Functions
  const renderRoleSelection = () => {
    // Always show role selection for ALL events
    const calendarName = eventToJoin?.calendarName;
    const hasTravelExpense = eventToJoin?.eventExpense?.travelExpense || false;

    // For Puppentheater, show fixed message
    if (calendarName === "Puppentheater") {
      return (
        <Form.Group>
          <Form.Label>Rollen-Verfügbarkeit für Puppentheater:</Form.Label>

          <div className="p-3 mb-3 bg-light border rounded">
            {!hasTravelExpense && (
              <Alert variant="info" className="mb-3">
                <strong>Hinweis:</strong> Für diese Veranstaltung sind keine
                Reisekosten vorgesehen. Die Rollenauswahl dient lediglich zur
                Organisation der Anreise.
              </Alert>
            )}
            <p className="mb-1">
              <strong>Fahrer*in:</strong> Verfügbar (automatisch zugewiesen)
            </p>
            <p className="mb-1">
              <strong>Beifahrer*in:</strong> Nicht verfügbar
            </p>
            <small className="text-muted">
              Für den Puppentheater-Kalender ist nur die Rolle "Fahrer*in"
              verfügbar und wird automatisch zugewiesen.
            </small>
          </div>
          <Form.Label>Ihre Rolle:</Form.Label>
          <Form.Select disabled value="driver">
            <option value="driver">Fahrer*in (automatisch)</option>
          </Form.Select>
        </Form.Group>
      );
    }

    // Get existing attendees with travel roles for display
    const attendees = eventToJoin?.attendees || [];
    const existingDriver = attendees.find(
      (a) => a.artistTravelRole === "driver"
    );
    const existingPassenger = attendees.find(
      (a) => a.artistTravelRole === "passenger"
    );

    // Generate options based on availability
    const options = [];
    if (roleAvailability.driver.available) {
      options.push({ value: "driver", label: "Fahrer*in" });
    }
    if (roleAvailability.passenger.available) {
      options.push({ value: "passenger", label: "Beifahrer*in" });
    }

    return (
      <Form.Group controlId="roleSelection">
        <Form.Label>Rollen-Verfügbarkeit:</Form.Label>
        <div className="p-3 mb-3 bg-light border rounded">
          {!hasTravelExpense && (
            <Alert variant="info" className="mb-3">
              <strong>Hinweis:</strong> Für diese Veranstaltung sind keine
              Reisekosten vorgesehen. Die Rollenauswahl dient lediglich zur
              Organisation der Anreise.
            </Alert>
          )}

          <div className="mb-2">
            <strong>Aktuelle Künstler mit Reiserollen:</strong>
            {attendees.length === 0 ? (
              <p className="mb-1">Keine Künstler in dieser Veranstaltung.</p>
            ) : (
              <ul className="mb-1 ps-3">
                {existingDriver && (
                  <li>
                    <strong>
                      {existingDriver.name || "Unbekannter Künstler"}
                    </strong>
                    - Rolle: <Badge bg="primary">Fahrer*in</Badge>
                  </li>
                )}
                {existingPassenger && (
                  <li>
                    <strong>
                      {existingPassenger.name || "Unbekannter Künstler"}
                    </strong>
                    - Rolle: <Badge bg="secondary">Beifahrer*in</Badge>
                  </li>
                )}
                {attendees
                  .filter((a) => !a.artistTravelRole)
                  .map((attendee, idx) => (
                    <li key={idx}>
                      <strong>
                        {attendee.displayName || "Unbekannter Künstler"}
                      </strong>
                      - Rolle:{" "}
                      <Badge bg="light" text="dark">
                        Keine Reiserolle
                      </Badge>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="mb-2">
            <strong>Verfügbare Rollen:</strong>
            <ul className="mb-1 ps-3">
              <li>
                <strong>Fahrer*in:</strong>
                <Badge
                  bg={roleAvailability.driver.available ? "success" : "danger"}
                  className="ms-2"
                >
                  {roleAvailability.driver.available
                    ? "Verfügbar"
                    : "Nicht verfügbar"}
                </Badge>
                <div className="small text-muted">
                  {roleAvailability.driver.reason}
                </div>
              </li>
              <li>
                <strong>Beifahrer*in:</strong>
                <Badge
                  bg={
                    roleAvailability.passenger.available ? "success" : "danger"
                  }
                  className="ms-2"
                >
                  {roleAvailability.passenger.available
                    ? "Verfügbar"
                    : "Nicht verfügbar"}
                </Badge>
                <div className="small text-muted">
                  {roleAvailability.passenger.reason}
                </div>
              </li>
            </ul>
          </div>

          {!roleAvailability.driver.available &&
            !roleAvailability.passenger.available && (
              <Alert variant="warning" className="mb-0">
                <strong>Hinweis:</strong> Alle Reiserollen sind bereits besetzt.
                Sie können dieser Veranstaltung nur ohne Reiserolle beitreten.
              </Alert>
            )}
        </div>

        {options.length > 0 ? (
          <>
            <Form.Label>Bitte wählen Sie eine Rolle:</Form.Label>
            <Form.Select
              value={roleSelection}
              onChange={(e) => setRoleSelection(e.target.value)}
              required
            >
              <option value="">-- Bitte auswählen --</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Ihre Auswahl bestimmt Ihre Reiserolle für diese Veranstaltung.
            </Form.Text>
          </>
        ) : (
          <Alert variant="info">
            <strong>Hinweis:</strong> Alle Reiserollen sind bereits besetzt. Sie
            werden dieser Veranstaltung ohne spezifische Reiserolle beitreten.
          </Alert>
        )}
      </Form.Group>
    );
  };

  const renderEventRow = (event, calendar, index) => {
    const detailKey = `detail-${calendar}-${index}`;
    const joinKey = `join-${calendar}-${index}`;

    return (
      <tr key={index} className="event-row">
        <td className="event-details">
          <div className="event-title">{event.summary}</div>
          <div className="event-location">
            {event.location || "Nicht angegeben"}
          </div>
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
        <td className="event-cost">{event?.eventExpense?.eventPay || "0"} €</td>
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
            className="open-calendar-button"
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
        <td className="join-event-column join-column">
          <Button
            ref={(el) => {
              if (el && !tooltipTargets[joinKey]) {
                setTooltipTargets((prev) => ({ ...prev, [joinKey]: el }));
              }
            }}
            variant="success"
            size="sm"
            onClick={() => handleJoinClick(event)}
            onMouseEnter={(e) => handleTooltipShow(joinKey, e.currentTarget)}
            onMouseLeave={() => handleTooltipHide(joinKey)}
            className="join-event-button"
          >
            <PlusCircle className="button-icon" />
          </Button>
          <CustomTooltip
            show={tooltipShow[joinKey]}
            target={tooltipTargets[joinKey]}
            variant="success"
          >
            Veranstaltung beitreten
          </CustomTooltip>
        </td>
      </tr>
    );
  };

  const renderMobileEventCard = (event, calendar, index) => {
    const detailKey = `mobile-detail-${calendar}-${index}`;
    const joinKey = `mobile-join-${calendar}-${index}`;

    return (
      <div key={index} className="event-mobile-card">
        <div className="event-mobile-header">
          <div className="event-mobile-title">{event.summary}</div>
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
            <Button
              variant="success"
              size="sm"
              onClick={() => handleJoinClick(event)}
            >
              <PlusCircle className="me-1" />
              Beitreten
            </Button>
          </div>
        </div>
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
      <div className="user-unassigned-dashboard">
        {/* Header */}
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
              />
            </div>
          </div>
        )}

        {/* Messages */}
        {warning && (
          <Alert
            variant="warning"
            className="dashboard-alert"
            onClose={() => setWarning(null)}
            dismissible
          >
            {warning}
          </Alert>
        )}
        {success && (
          <Alert
            variant="success"
            className="dashboard-alert"
            onClose={() => setSuccess(null)}
            dismissible
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert
            variant="danger"
            className="dashboard-alert"
            onClose={() => setError(null)}
            dismissible
          >
            {error}
          </Alert>
        )}

        {/* Events Container */}
        <div className="events-container">
          <h2 className="unassigned-events-heading">
            Nicht zugewiesene Veranstaltungen
          </h2>

          {totalFilteredEvents === 0 && !searchTerm ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar3 size={48} />
              </div>
              <p className="empty-state-message">
                Keine nicht zugewiesenen Veranstaltungen gefunden.
              </p>
            </div>
          ) : (
            calendars.map((calendar) => {
              const hasEvents = filteredEventsByCalendar[calendar]?.length > 0;
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
                          {hasEvents
                            ? filteredEventsByCalendar[calendar].length
                            : 0}
                        </span>
                        <span className="count-label">
                          {hasEvents
                            ? filteredEventsByCalendar[calendar].length === 1
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
                            <Table className="events-table six-columns">
                              <thead>
                                <tr>
                                  <th style={{ minWidth: "200px" }}>
                                    Veranstaltung
                                  </th>
                                  <th style={{ minWidth: "120px" }}>
                                    Datum/Uhrzeit
                                  </th>
                                  <th style={{ minWidth: "100px" }}>Betrag</th>
                                  <th className="actions-column">Aktion</th>
                                  <th className="join-column">Beitreten</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredEventsByCalendar[calendar].map(
                                  (event, index) =>
                                    renderEventRow(event, calendar, index)
                                )}
                              </tbody>
                            </Table>
                          </div>
                          <div className="event-cards-container d-md-none">
                            {filteredEventsByCalendar[calendar].map(
                              (event, index) =>
                                renderMobileEventCard(event, calendar, index)
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="no-events-message">
                          Keine nicht zugewiesenen Veranstaltungen in diesem
                          Kalender.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modals */}
        {showEventModal && (
          <EventModal
            mode="unassigned"
            user={user}
            modalFor="unassigned"
            event={selectedEvent}
            onClose={() => setShowEventModal(false)}
          />
        )}

        <Modal
          show={showJoinConfirmModal}
          onHide={() => !isJoining && setShowJoinConfirmModal(false)}
          backdrop={isJoining ? "static" : true}
          keyboard={!isJoining}
          size="lg"
        >
          <Modal.Header closeButton={!isJoining}>
            <Modal.Title>Beitreten bestätigen</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-4">
              Möchten Sie der Veranstaltung "
              <strong>{eventToJoin?.summary}</strong>" wirklich beitreten?
            </p>
            {renderRoleSelection()}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowJoinConfirmModal(false)}
              disabled={isJoining}
            >
              Abbrechen
            </Button>
            <Button
              variant="success"
              onClick={handleJoinConfirm}
              disabled={
                isJoining ||
                ((roleAvailability.driver.available ||
                  roleAvailability.passenger.available) &&
                  !roleSelection)
              }
            >
              {isJoining ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-2">Wird hinzugefügt...</span>
                </>
              ) : (
                "Beitreten"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default UserUnassignedDashboard;
