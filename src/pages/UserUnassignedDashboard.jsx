import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Table, Alert, Badge } from "react-bootstrap";
import {
  ArrowClockwise,
  Calendar3,
  ChevronDown,
  ChevronUp,
  PersonCircle,
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import DashboardLoader from "../components/DashboardLoader";
import { authApi } from "../utils/api";
import axios from "axios";

function UserUnassignedDashboard({ setAuth }) {
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
    Puppentheater:
      "3798c15a6afb9d16f832d4da08afdf46c59fb95ded9a26911b0df49a7613d6fc@group.calendar.google.com",
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
      setCategorizedEvents(responseData.categorizedEvents || {});

      const initialExpandState = {};
      Object.keys(responseData.categorizedEvents || {}).forEach((cal) => {
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

  // Handle join event button click
 const handleJoinEvent = useCallback(
  async (event) => {
    if (isProcessingJoin) return; // prevent double click globally

    setIsProcessingJoin(true);
    setJoiningEventId(event.id);
    setLoadingMessage("Artist wird zur Veranstaltung hinzugefügt...");
    setLoading(true);

    try {
      const calendarName = event.calendarName?.trim().toLowerCase();
      let calendarId = null;

      for (const [name, id] of Object.entries(CALENDAR_MAPPING)) {
        if (name.trim().toLowerCase() === calendarName) {
          calendarId = id;
          break;
        }
      }

      if (!calendarId) {
        console.error("Calendar ID not found for:", event.calendarName);
        setWarning("Kalender-ID konnte nicht gefunden werden");
        setLoading(false);
        setIsProcessingJoin(false);
        setJoiningEventId(null);
        return;
      }

      const requestData = {
        calendarId,
        eventId: event.id,
        artistEmail: user["E-Mail"],
      };

      // API request
      const response = await axios.post(`${API_URL}/add-artist`, requestData);

      if (response.data.success) {
        setWarning("Artist erfolgreich hinzugefügt!");
      } else {
        setWarning(response.data.message || "Fehler beim Hinzufügen des Artists");
      }

      // Enforce additional 7-second delay after API response
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Refresh events after total delay
      await fetchData();

    } catch (error) {
      console.error("Error:", error);
      setError("Fehler beim Hinzufügen des Artists");
    } finally {
      setIsProcessingJoin(false);
      setJoiningEventId(null);
      setLoading(false);
    }
  },
  [user, fetchData, isProcessingJoin]
);

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
      <DashboardLayout
        setAuth={setAuth}
        pageTitle="Nicht zugewiesene Veranstaltungen"
      >
        <DashboardLoader message={loadingMessage} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout setAuth={setAuth} onRefresh={handleRefresh}>
      <div className="user-unassigned-dashboard">
        {/* Header section with welcome message and search box */}
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

        {warning && (
          <Alert variant="warning" className="dashboard-alert">
            {warning}
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
                            <Table className="events-table">
                              <thead>
                                <tr>
                                  <th style={{ minWidth: "200px" }}>
                                    Veranstaltung
                                  </th>
                                  <th style={{ minWidth: "120px" }}>
                                    Datum/Uhrzeit
                                  </th>
                                  <th style={{ minWidth: "150px" }}>Ort</th>
                                  <th className="actions-column">Aktion</th>
                                  <th className="join-column">Beitreten</th>
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
                                      <td className="event-location">
                                        {event.location || "Nicht angegeben"}
                                      </td>
                                      <td className="event-actions actions-column">
                                        {event.htmlLink ? (
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            href={event.htmlLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="open-calendar-button"
                                          >
                                            <Calendar3 className="button-icon" />
                                            <span className="d-none d-md-inline">
                                              Öffnen
                                            </span>
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            disabled
                                          >
                                            <span className="d-none d-md-inline">
                                              Nicht verfügbar
                                            </span>
                                            <span className="d-md-none">
                                              N/A
                                            </span>
                                          </Button>
                                        )}
                                      </td>
                                      <td className="join-event-column join-column">
                                        <Button
                                          variant="success"
                                          size="sm"
                                          onClick={() => handleJoinEvent(event)}
                                          className="join-event-button"
                                          disabled={
                                            isProcessingJoin &&
                                            joiningEventId === event.id
                                          }
                                        >
                                          {isProcessingJoin &&
                                          joiningEventId === event.id ? (
                                            <>
                                              <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                className="me-2"
                                              />
                                              <span className="d-none d-md-inline">
                                                Wird hinzugefügt...
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <PersonCircle className="button-icon" />
                                              <span className="d-none d-md-inline">
                                                Beitreten
                                              </span>
                                            </>
                                          )}
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
                                      {event.htmlLink ? (
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          href={event.htmlLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="open-calendar-button me-2" // Added margin-end
                                        >
                                          <Calendar3 className="button-icon" />
                                          <span className="button-text">
                                            Öffnen
                                          </span>
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          disabled
                                          className="me-2" // Added margin-end
                                        >
                                          N/A
                                        </Button>
                                      )}
                                      <Button
                                        variant="success"
                                        size="sm"
                                        onClick={() => handleJoinEvent(event)}
                                        className="join-event-button"
                                        disabled={
                                          isProcessingJoin &&
                                          joiningEventId === event.id
                                        }
                                      >
                                        {isProcessingJoin &&
                                        joiningEventId === event.id ? (
                                          <>
                                            <Spinner
                                              as="span"
                                              animation="border"
                                              size="sm"
                                              role="status"
                                              aria-hidden="true"
                                              className="me-2"
                                            />
                                            <span className="button-text">
                                              Wird hinzugefügt...
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <PersonCircle className="button-icon" />
                                            <span className="button-text">
                                              Beitreten
                                            </span>
                                          </>
                                        )}
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
      </div>
    </DashboardLayout>
  );
}

export default UserUnassignedDashboard;
