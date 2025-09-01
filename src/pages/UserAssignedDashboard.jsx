import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Button, Table, Alert, Badge, Spinner } from "react-bootstrap";
import {
  ArrowClockwise,
  Calendar3,
  ChevronDown,
  ChevronUp,
  PersonCircle,
  PersonDash,
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import DashboardLoader from "../components/DashboardLoader";
import { authApi } from "../utils/api";
import axios from "axios";
import EventModal from "../components/EventModal"; // Import the EventModal component

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
  const [selectedEvent, setSelectedEvent] = useState(null); // State for selected event
  const [showEventModal, setShowEventModal] = useState(false); // State for modal visibility
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [eventToLeave, setEventToLeave] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [success, setSuccess] = useState(null);

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
      return dateA - dateB; // For ascending order (oldest first)
      // Use return dateB - dateA; for descending order (newest first)
    });
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
          calendars: calendarNames.join(","), // Send joined calendars to filter
          categorize: true,
        },
      });

      const responseData = eventsRes.data;

      // Sort events for each calendar by date
      const sortedCategorizedEvents = {};
      Object.keys(responseData.categorizedEvents || {}).forEach((calendar) => {
        sortedCategorizedEvents[calendar] = sortEventsByDate(
          responseData.categorizedEvents[calendar]
        );
      });

      setEvents(sortedCategorizedEvents);

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
    setSuccess(null); // Reset success state

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

  // Filter events based on search term
  const filteredEventsByCalendar = useMemo(() => {
    const filtered = {};

    Object.keys(events).forEach((calendar) => {
      filtered[calendar] = (events[calendar] || []).filter(
        (event) =>
          (event.summary || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.calendar || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.role || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.location || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    });

    return filtered;
  }, [events, searchTerm]);

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
    setEvents({});
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
          <h2 className="assigned-events-heading">Meine kommenden Events</h2>

          {totalFilteredEvents === 0 && !searchTerm ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar3 size={48} />
              </div>
              <p className="empty-state-message">
                Keine zugewiesenen Veranstaltungen gefunden.
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
                            <Table className="events-table">
                              <thead>
                                <tr>
                                  <th style={{ minWidth: "200px" }}>
                                    Veranstaltung
                                  </th>
                                  <th style={{ minWidth: "150px" }}>
                                    Meine Rolle(n)
                                  </th>
                                  <th style={{ minWidth: "120px" }}>
                                    Datum/Uhrzeit
                                  </th>
                                  <th className="actions-column">Aktion</th>
                                  <th className="leave-column">Verlassen</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredEventsByCalendar[calendar].map(
                                  (event, index) => (
                                    <tr key={index} className="event-row">
                                      <td className="event-details">
                                        <div className="event-title">
                                          {event.summary}
                                        </div>
                                        <div className="event-location">
                                          {event.location}
                                        </div>
                                      </td>
                                      <td className="event-roles">
                                        {event.role
                                          ?.split(", ")
                                          .map((role, i) => (
                                            <Badge
                                              key={i}
                                              className="role-badge"
                                              bg="success"
                                            >
                                              {role.trim()}
                                            </Badge>
                                          ))}
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
                                      <td className="event-actions actions-column">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() =>
                                            handleEventClick(event)
                                          }
                                          className="open-calendar-button"
                                        >
                                          <i className="bi bi-info-circle me-1"></i>
                                          <span className="d-none d-md-inline">
                                            Details
                                          </span>
                                        </Button>
                                      </td>
                                      <td className="leave-event-column leave-column">
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={() =>
                                            handleLeaveClick(event)
                                          }
                                          className="leave-event-button"
                                        >
                                          <PersonDash className="button-icon" />
                                          <span className="button-text">
                                            Verlassen
                                          </span>
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </Table>
                          </div>

                          {/* Mobile-friendly cards for small screens */}
                          <div className="event-cards-container d-md-none">
                            {filteredEventsByCalendar[calendar].map(
                              (event, index) => (
                                <div key={index} className="event-mobile-card">
                                  <div className="event-mobile-header">
                                    <div className="event-mobile-title">
                                      {event.summary}
                                    </div>
                                  </div>

                                  <div className="event-mobile-content">
                                    <div className="event-mobile-roles">
                                      {event.role
                                        ?.split(", ")
                                        .map((role, i) => (
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
                                    </div>

                                    <div className="event-mobile-actions">
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleEventClick(event)}
                                        className="me-2"
                                      >
                                        <i className="bi bi-info-circle me-1"></i>
                                        Details
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleLeaveClick(event)}
                                        className="leave-event-button"
                                      >
                                        <PersonDash className="me-1" />
                                        Verlassen
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )
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
            })
          )}
        </div>

        {/* Event Modal */}
        {showEventModal && (
          <EventModal
            event={selectedEvent}
            onClose={() => setShowEventModal(false)}
          />
        )}
      </div>
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
