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
  ArrowClockwise,
  Calendar3,
  ChevronDown,
  ChevronUp,
  PersonCircle,
  InfoCircle,
  PlusCircle,
} from "react-bootstrap-icons";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import DashboardLoader from "../components/DashboardLoader";
import { authApi } from "../utils/api";
import axios from "axios";
import EventModal from "../components/EventModal";
import ReactDOM from "react-dom";

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

function UserUnassignedDashboard({ setAuth, handleLogout }) {
  const [user, setUser] = useState(null);
  const [categorizedEvents, setCategorizedEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Daten werden geladen..."
  );
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [joiningEventId, setJoiningEventId] = useState(null);
  const [isProcessingJoin, setIsProcessingJoin] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showJoinConfirmModal, setShowJoinConfirmModal] = useState(false);
  const [eventToJoin, setEventToJoin] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  const [roleSelection, setRoleSelection] = useState("driver");
  // Tooltip state
  const [tooltipShow, setTooltipShow] = useState({});
  const [tooltipTargets, setTooltipTargets] = useState({});

  const API_URL =
    "https://user-dashboard-data-754826373806.europe-west1.run.app";
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
    "Puppentheater":
      "3798c15a6afb9d16f832d4da08afdf46c59fb95ded9a26911b0df49a7613d6fc@group.calendar.google.com",
  };

  // Sort events by date (most recent first)
  const sortEventsByDate = (eventsArray) => {
    return [...eventsArray].sort((a, b) => {
      const dateA = a.start?.dateTime
        ? new Date(a.start.dateTime).getTime()
        : 0;
      const dateB = b.start?.dateTime
        ? new Date(b.start.dateTime).getTime()
        : 0;
      return dateA - dateB; // For ascending order (oldest first)
      // Use return dateB - dateA; for descending order (newest first)
    });
  };

  // Tooltip handlers
  const handleTooltipShow = (key, target) => {
    setTooltipShow((prev) => ({ ...prev, [key]: true }));
    setTooltipTargets((prev) => ({ ...prev, [key]: target }));
  };

  const handleTooltipHide = (key) => {
    setTooltipShow((prev) => ({ ...prev, [key]: false }));
  };

  // Fetch user data and events
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Benutzerdaten werden geladen...");

      const res = await authApi.getMe();
      const currentUser = res.data.user;
      const userData = await axios.get(
        `${USER_API_URL}/?id=${currentUser._id}`
      );
      console.log("Benutzerdaten:", userData.data);
      setUser(userData.data);

      const joinedCalendars = userData.data.joinedCalendars || [];
      const joinedCalendarsEncoded = encodeURIComponent(
        JSON.stringify(joinedCalendars)
      );

      setLoadingMessage("Nicht zugewiesene Veranstaltungen werden geladen...");
      const unassignedRes = await axios.get(
        `${API_URL}/unassigned?joinedCalendars=${joinedCalendarsEncoded}`
      );
      const responseData = unassignedRes.data;

      // Sort events for each calendar by date
      const sortedCategorizedEvents = {};
      Object.keys(responseData.categorizedEvents || {}).forEach((calendar) => {
        sortedCategorizedEvents[calendar] = sortEventsByDate(
          responseData.categorizedEvents[calendar]
        );
      });

      setCategorizedEvents(sortedCategorizedEvents);

      const initialExpandState = {};
      Object.keys(sortedCategorizedEvents || {}).forEach((cal) => {
        initialExpandState[cal] = true;
      });
      setExpandedCalendars(initialExpandState);

      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden der Daten:", err);
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

  // Handle join event button click
  const handleJoinClick = useCallback((event) => {
    setEventToJoin(event);
    setShowJoinConfirmModal(true);
  }, []);

  const handleJoinConfirm = useCallback(async () => {
    if (!eventToJoin || isJoining) return;

    console.log("🔵 [Join Confirm] Starting process for event:", {
      eventId: eventToJoin?.id,
      calendarName: eventToJoin?.calendarName,
    });

    if (eventToJoin?.eventExpense?.travelExpense && !roleSelection) {
      console.log("🔴 [Join Confirm] Missing travel role selection.");
      setWarning("Bitte wählen Sie Fahrer oder Passagier aus.");
      return;
    }

    setIsJoining(true);
    setLoadingMessage("Artist wird zur Veranstaltung hinzugefügt...");
    setSuccess(null);
    setWarning(null);

    try {
      const calendarName = eventToJoin.calendarName?.trim();
      const calendarId = CALENDAR_MAPPING[calendarName];

      if (!calendarId) {
        console.log(
          "🔴 [Join Confirm] Could not find calendar ID for:",
          calendarName
        );
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

      console.log("🟡 [Join Confirm] Sending request to backend:", requestData);

      const response = await axios.post(`${API_URL}/add-artist`, requestData);

      console.log("🟢 [Join Confirm] Backend response:", response.data);

      if (response.data.success) {
        await new Promise((resolve) => setTimeout(resolve, 20000));
        setSuccess("Artist erfolgreich zur Veranstaltung hinzugefügt!");
        setTimeout(() => setSuccess(null), 5000);
        await fetchData();
        setShowJoinConfirmModal(false);
        setRoleSelection("");
      } else {
        console.log(
          "🔴 [Join Confirm] Backend returned error:",
          response.data.message
        );
        setWarning(
          response.data.message || "Fehler beim Hinzufügen des Artists"
        );
      }
    } catch (error) {
      console.error("🔴 [Join Confirm] Request failed:", error);
      setError("Fehler beim Hinzufügen des Artists");
    } finally {
      setIsJoining(false);
    }
  }, [eventToJoin, user, fetchData, roleSelection]);

  // Filter events based on search term
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
    (calendar) => {
      return (
        filteredEventsByCalendar[calendar] &&
        filteredEventsByCalendar[calendar].length > 0
      );
    },
    [filteredEventsByCalendar]
  );

  // Force refresh button handler
  const handleRefresh = useCallback(() => {
    setCategorizedEvents({});
    setError(null);
    setWarning(null);
    fetchData();
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

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
        {/* Add this with the other alerts */}
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
                          {/* Regular table for desktop */}
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
                                  <th style={{ minWidth: "150px" }}>Ort</th>
                                  <th style={{ minWidth: "100px" }}>Betrag</th>
                                  <th className="actions-column">Aktion</th>
                                  <th className="join-column">Beitreten</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredEventsByCalendar[calendar].map(
                                  (event, index) => {
                                    const detailKey = `detail-${calendar}-${index}`;
                                    const joinKey = `join-${calendar}-${index}`;

                                    return (
                                      <tr key={index} className="event-row">
                                        {/* Event Details */}
                                        <td className="event-details">
                                          <div className="event-title">
                                            {event.summary}
                                          </div>
                                          <div className="event-location">
                                            {event.location ||
                                              "Nicht angegeben"}
                                          </div>
                                        </td>

                                        {/* Date / Time */}
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
                                                  timeZone:
                                                    event.start.timeZone,
                                                })}
                                              </div>
                                              <div className="time">
                                                {new Date(
                                                  event.start.dateTime
                                                ).toLocaleTimeString("de-DE", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  timeZone:
                                                    event.start.timeZone,
                                                })}
                                              </div>
                                            </div>
                                          ) : (
                                            <span>Datum unbekannt</span>
                                          )}
                                        </td>

                                        {/* Location column removed since moved below title */}

                                        {/* Amount Column */}
                                        <td className="event-cost">
                                          {event?.eventExpense.eventPay}
                                          <i className="bi bi-currency-euro"></i>
                                        </td>

                                        {/* Actions column */}
                                        <td className="event-actions actions-column">
                                          <Button
                                            ref={(el) => {
                                              if (
                                                el &&
                                                !tooltipTargets[detailKey]
                                              ) {
                                                setTooltipTargets((prev) => ({
                                                  ...prev,
                                                  [detailKey]: el,
                                                }));
                                              }
                                            }}
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() =>
                                              handleEventClick(event)
                                            }
                                            onMouseEnter={(e) =>
                                              handleTooltipShow(
                                                detailKey,
                                                e.currentTarget
                                              )
                                            }
                                            onMouseLeave={() =>
                                              handleTooltipHide(detailKey)
                                            }
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

                                        {/* Join column */}
                                        <td className="join-event-column join-column">
                                          <Button
                                            ref={(el) => {
                                              if (
                                                el &&
                                                !tooltipTargets[joinKey]
                                              ) {
                                                setTooltipTargets((prev) => ({
                                                  ...prev,
                                                  [joinKey]: el,
                                                }));
                                              }
                                            }}
                                            variant="success"
                                            size="sm"
                                            onClick={() =>
                                              handleJoinClick(event)
                                            }
                                            onMouseEnter={(e) =>
                                              handleTooltipShow(
                                                joinKey,
                                                e.currentTarget
                                              )
                                            }
                                            onMouseLeave={() =>
                                              handleTooltipHide(joinKey)
                                            }
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
                                  }
                                )}
                              </tbody>
                            </Table>
                          </div>

                          {/* Mobile-friendly cards for small screens */}
                          <div className="event-cards-container d-md-none">
                            {filteredEventsByCalendar[calendar].map(
                              (event, index) => {
                                const detailKey = `mobile-detail-${calendar}-${index}`;
                                const joinKey = `mobile-join-${calendar}-${index}`;

                                return (
                                  <div
                                    key={index}
                                    className="event-mobile-card"
                                  >
                                    <div className="event-mobile-header">
                                      <div className="event-mobile-title">
                                        {event.summary}
                                      </div>
                                    </div>

                                    <div className="event-mobile-content">
                                      <div className="event-mobile-details">
                                        {event.location && (
                                          <div className="event-mobile-location">
                                            <i className="bi bi-geo-alt"></i>{" "}
                                            {event.location}
                                          </div>
                                        )}

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
                                      </div>

                                      <div className="event-mobile-actions">
                                        <Button
                                          ref={(el) => {
                                            if (
                                              el &&
                                              !tooltipTargets[detailKey]
                                            ) {
                                              setTooltipTargets((prev) => ({
                                                ...prev,
                                                [detailKey]: el,
                                              }));
                                            }
                                          }}
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() =>
                                            handleEventClick(event)
                                          }
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

                                        <Button
                                          ref={(el) => {
                                            if (
                                              el &&
                                              !tooltipTargets[joinKey]
                                            ) {
                                              setTooltipTargets((prev) => ({
                                                ...prev,
                                                [joinKey]: el,
                                              }));
                                            }
                                          }}
                                          variant="success"
                                          size="sm"
                                          onClick={() => handleJoinClick(event)}
                                          onMouseEnter={(e) =>
                                            handleTooltipShow(
                                              joinKey,
                                              e.currentTarget
                                            )
                                          }
                                          onMouseLeave={() =>
                                            handleTooltipHide(joinKey)
                                          }
                                        >
                                          <PlusCircle className="me-1" />
                                          Beitreten
                                        </Button>
                                        <CustomTooltip
                                          show={tooltipShow[joinKey]}
                                          target={tooltipTargets[joinKey]}
                                          variant="success"
                                        >
                                          Veranstaltung beitreten
                                        </CustomTooltip>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
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

        {/* Event Modal */}
        {showEventModal && (
          <EventModal
            mode="unassigned"
            user={user}
            modalFor={"unassigned"}
            event={selectedEvent}
            onClose={() => setShowEventModal(false)}
          />
        )}
      </div>
      {/* Join Event Confirmation Modal */}
      {/* Join Event Confirmation Modal */}
      <Modal
        show={showJoinConfirmModal}
        onHide={() => !isJoining && setShowJoinConfirmModal(false)}
        backdrop={isJoining ? "static" : true}
        keyboard={!isJoining}
      >
        <Modal.Header closeButton={!isJoining}>
          <Modal.Title>Beitreten bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bitte wähle deine Rolle, damit die Fahrtkosten korrekt
          aufgeteilt werden können.
          {/* Conditionally render dropdown if travelExpense exists */}
          {eventToJoin?.eventExpense?.travelExpense && (
            <div className="mt-3">
              <Form.Group controlId="roleSelection">
                <Form.Label>Bitte wählen Sie eine Rolle:</Form.Label>

                {(() => {
                  const attendees = eventToJoin.attendees || [];

                  const existingDriver = attendees.some(
                    (a) => a.travelRole === "driver"
                  );
                  const existingPassenger = attendees.some(
                    (a) => a.travelRole === "passenger"
                  );

                  const calendarWithTheRequiredRoles = [
                    {
                      calendar: "Geigen Mitmachkonzert",
                      requiredRoles: ["Geiger*in", "Moderator*in"],
                    },
                    {
                      calendar: "Klavier Mitmachkonzert",
                      requiredRoles: ["Pianist*in", "Moderator*in"],
                    },
                    {
                      calendar: "Laternenumzug mit Musik",
                      requiredRoles: ["Instrumentalist*in", "Sängerin*in"],
                    },
                    {
                      calendar: "Nikolaus Besuch",
                      requiredRoles: ["Nikolaus", "Sängerin*in"],
                    },
                    {
                      calendar: "Puppentheater",
                      requiredRoles: ["Puppenspieler*in"],
                    },
                    {
                      calendar: "Weihnachts Mitmachkonzert",
                      requiredRoles: ["Detlef", "Sängerin*in"],
                    },
                  ];

                  const calendarConfig = calendarWithTheRequiredRoles.find(
                    (c) => c.calendar === eventToJoin.calendarName
                  );

                  const onlyOneRoleRequired =
                    calendarConfig && calendarConfig.requiredRoles.length === 1;

                  return (
                    <Form.Select
                      value={roleSelection || "driver"} // ✅ ensure driver is default
                      onChange={(e) => setRoleSelection(e.target.value)}
                      required
                    >
                      {/* Fahrer always selectable */}
                      <option value="driver">Fahrer*in</option>

                      {/* Beifahrer only if not single-role calendar */}
                      {!onlyOneRoleRequired && (
                        <option value="passenger" disabled={existingPassenger}>
                          Beifahrer*in
                        </option>
                      )}
                    </Form.Select>
                  );
                })()}
              </Form.Group>
            </div>
          )}
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
            disabled={isJoining}
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
    </DashboardLayout>
  );
}

export default UserUnassignedDashboard;
