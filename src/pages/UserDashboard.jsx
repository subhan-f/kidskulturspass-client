import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Table, Alert, Badge, Card } from "react-bootstrap";
import {
  ArrowClockwise,
  Calendar3,
  ChevronDown,
  ChevronUp,
  PersonCheck,
  PersonPlus,
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import  { authApi } from "../utils/api";
import DashboardLoader from "../components/DashboardLoader";
import axios from "axios";

function UnassignedEventsDashboard({ setAuth }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Daten werden geladen...");
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [allCalendars, setAllCalendars] = useState([]);

  const API_URL = "https://user-dashboard-data-754826373806.europe-west1.run.app";

  const fetchData = async () => {
    setLoading(true);
    setLoadingMessage("Daten werden geladen...");

    try {
      // 1. First fetch the authenticated user
      const res = await authApi.getMe();
      const currentUser = res.data.user;
      setUser(currentUser);
      console.log("Authenticated user:", currentUser);
      
      // 2. Then fetch assigned events for this user
      const eventsRes = await axios.get(
        `${API_URL}/assigned?email=${currentUser["E-Mail"]}&categorize=true`
      );
      const responseData = eventsRes.data;
      
      console.log("API response data:", responseData.categorizedEvents.categorizedEvents);
      
      // Transform the API data into our events structure
      const categorizedEvents = responseData.categorizedEvents.categorizedEvents || {};
      setEvents(categorizedEvents);
      
      // Extract all available calendars from the categorized events
      const calendars = Object.keys(categorizedEvents).map(name => ({
        name,
        description: `${name} Kalender`
      }));
      console.log("Available calendars:", calendars);
      setAllCalendars(calendars);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Fehler beim Laden der Daten");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize expanded calendars state when events are loaded
  useEffect(() => {
    if (allCalendars.length > 0) {
      const initialExpandState = {};
      allCalendars.forEach(cal => {
        initialExpandState[cal.name] = true; // Default to expanded
      });
      setExpandedCalendars(initialExpandState);
    }
  }, [allCalendars]);

  const toggleCalendarExpand = useCallback((calendar) => {
    setExpandedCalendars((prev) => ({
      ...prev,
      [calendar]: !prev[calendar],
    }));
  }, []);

  const filteredEventsByCalendar = useMemo(() => {
    const filtered = {};
    
    Object.keys(events).forEach(calendar => {
      filtered[calendar] = events[calendar].filter(
        (event) =>
          (event.summary || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.calendar || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.role || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.location || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    
    return filtered;
  }, [events, searchTerm]);

  const totalFilteredEvents = useMemo(() => {
    return Object.values(filteredEventsByCalendar)
      .reduce((total, calendarEvents) => total + calendarEvents.length, 0);
  }, [filteredEventsByCalendar]);

  const calendarHasMatch = useCallback(
    (calendar) => {
      return filteredEventsByCalendar[calendar]?.length > 0;
    },
    [filteredEventsByCalendar]
  );

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
      <DashboardLayout
        setAuth={setAuth}
        pageTitle="Meine Veranstaltungen"
      >
        <DashboardLoader
          message={loadingMessage}
        />
      </DashboardLayout>
    );
  }
  
  if (!user) {
    return (
      <DashboardLayout setAuth={setAuth} pageTitle="Meine Kalender">
        <Alert variant="danger">Künstlerdaten konnten nicht geladen werden.</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout setAuth={setAuth} onRefresh={handleRefresh}>
      <div className="unassigned-events-dashboard">
        {/* Welcome section */}
        {user && (
          <div className="welcome-section mb-4">
            <h2>Willkommen, {user.Name}!</h2>
            <p className="text-muted">Hier sind deine zugewiesenen Veranstaltungen</p>
          </div>
        )}

        {/* Joined calendars section */}
        <div className="joined-calendars-section mb-5">
          <h4 className="section-title">Meine Kalender</h4>
          <div className="calendar-badges">
            {allCalendars.map(calendar => (
              <Badge key={calendar.name} bg="primary" className="me-2 mb-2 calendar-badge">
                {calendar.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Header section with search bar */}
        <div className="transparent-header-container">
          <h1 className="dashboard-main-title">
            Meine Veranstaltungen
          </h1>
          <div className="header-search-box">
            <SearchBox
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Name, Rolle oder Ort suchen..."
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
            allCalendars.map((calendar) => {
              const calendarName = calendar.name;
              const hasEvents = filteredEventsByCalendar[calendarName]?.length > 0;
              const isFilteredOut = searchTerm && !calendarHasMatch(calendarName);

              return (
                <div
                  key={calendarName}
                  className={`event-calendar-card ${
                    isFilteredOut ? "filtered-out" : ""
                  }`}
                >
                  <div
                    className="calendar-header"
                    onClick={() => toggleCalendarExpand(calendarName)}
                  >
                    <div className="header-content">
                      <div className="title-with-icon">
                        <h5 className="calendar-title">{calendarName}</h5>
                        <div className="dropdown-toggle-icon">
                          {expandedCalendars[calendarName] ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </div>
                      </div>
                      <span className="events-count">
                        <span className="count-number">
                          {hasEvents
                            ? filteredEventsByCalendar[calendarName].length
                            : 0}
                        </span>
                        <span className="count-label">
                          {hasEvents
                            ? filteredEventsByCalendar[calendarName].length === 1
                              ? " Veranstaltung"
                              : " Veranstaltungen"
                            : " Veranstaltungen"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {expandedCalendars[calendarName] && (
                    <div className="calendar-content">
                      {hasEvents ? (
                        <>
                          {/* Regular table for desktop */}
                          <div className="table-responsive d-none d-md-block">
                            <Table className="events-table">
                              <thead>
                                <tr>
                                  <th>Veranstaltung</th>
                                  <th>Rolle(n)</th>
                                  <th>Datum/Uhrzeit</th>
                                  <th>Ort</th>
                                  <th>Aktion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredEventsByCalendar[calendarName].map(
                                  (event, index) => (
                                    <tr key={index} className="event-row">
                                      <td className="event-details">
                                        <div className="event-title">
                                          {event.summary}
                                        </div>
                                      </td>
                                      <td className="event-roles">
                                        {event.role
                                          ?.split(", ")
                                          .map((role, i) => (
                                            <Badge
                                              key={i}
                                              className="role-badge"
                                            >
                                              {role.trim()}
                                            </Badge>
                                          ))}
                                      </td>
                                      <td className="event-time">
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
                                        {event.location || "-"}
                                      </td>
                                      <td className="event-actions">
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
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </Table>
                          </div>

                          {/* Mobile-friendly cards for small screens */}
                          <div className="event-cards-container d-md-none">
                            {filteredEventsByCalendar[calendarName].map(
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
                                          <Badge key={i} className="role-badge">
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
                                          <span className="button-text">
                                            Öffnen
                                          </span>
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          disabled
                                        >
                                          N/A
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </>
                      ) : (
                        <div
                          className="no-events-message"
                          style={{
                            textAlign: "center",
                            margin: "50px 0px",
                            color: "grey",
                          }}
                        >
                          Keine Veranstaltungen in diesem Kalender.
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

export default UnassignedEventsDashboard;

