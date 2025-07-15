import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Table, Alert, Badge, Card } from "react-bootstrap";
import {
  ArrowClockwise,
  Calendar3,
  ChevronDown,
  ChevronUp,
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import { authApi } from "../utils/api";
import DashboardLoader from "../components/DashboardLoader";
import axios from "axios";

function UserUnassignedDashboard({ setAuth }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Daten werden geladen...");
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);

  const API_URL = "https://user-dashboard-data-754826373806.europe-west1.run.app";
  const USER_API_URL = "https://artist-crud-function-754826373806.europe-west10.run.app";

 const fetchData = async () => {
  setLoading(true);
  setLoadingMessage("Daten werden geladen...");

  try {
    // 1. First fetch the authenticated user
    const res = await authApi.getMe();
    const currentUser = res.data.user;
    
    // 2. Get user details including joined calendars
    const userData = await axios.get(`${USER_API_URL}/?id=${currentUser._id}`);
    console.log("User data:", userData.data);
    setUser(userData.data);
    
    // Extract joined calendars
    const joinedCalendars = userData.data.joinedCalendars || [];
    const calendarNames = joinedCalendars.map(c => c.Calendar);
    console.log("Joined calendars:", calendarNames);
    // 3. Fetch unassigned events only for these calendars
    const eventsRes = await axios.get(`${API_URL}/unassigned`, {
      params: {
        email: userData.data["E-Mail"],
        calendars: calendarNames.join(','), // Send joined calendars to filter
        categorize: true
      }
    });
    
    const responseData = eventsRes.data;
    console.log("API response data:", responseData);
    
    // Set the categorized events
    setEvents(responseData.categorizedEvents || {});
    
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
    if (Object.keys(events).length > 0) {
      const initialExpandState = {};
      Object.keys(events).forEach(calendar => {
        initialExpandState[calendar] = true; // Default to expanded
      });
      setExpandedCalendars(initialExpandState);
    }
  }, [events]);

  const toggleCalendarExpand = useCallback((calendar) => {
    setExpandedCalendars((prev) => ({
      ...prev,
      [calendar]: !prev[calendar],
    }));
  }, []);

  const filteredEventsByCalendar = useMemo(() => {
    const filtered = {};
    
    Object.keys(events).forEach(calendar => {
      filtered[calendar] = (events[calendar] || []).filter(
        (event) =>
          (event.summary || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.calendarName || "")
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
      <DashboardLayout setAuth={setAuth} pageTitle="Meine unzugewiesenen Veranstaltungen">
        <DashboardLoader message={loadingMessage} />
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
            <p className="text-muted">Hier sind deine unzugewiesenen Veranstaltungen</p>
          </div>
        )}

        {/* Header section with search bar */}
        <div className="transparent-header-container">
          <h1 className="dashboard-main-title">
            Unzugewiesene Veranstaltungen
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
                Keine unzugewiesenen Veranstaltungen gefunden.
              </p>
            </div>
          ) : (
            Object.keys(filteredEventsByCalendar).map((calendarName) => {
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
                          {hasEvents ? filteredEventsByCalendar[calendarName].length : 0}
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
                          {/* Desktop table view */}
                          <div className="table-responsive d-none d-md-block">
                            <Table className="events-table">
                              <thead>
                                <tr>
                                  <th>Veranstaltung</th>
                                  <th>Fehlende Rolle(n)</th>
                                  <th>Datum/Uhrzeit</th>
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
                                        <div className="event-location">
                                          {event.location}
                                        </div>
                                      </td>
                                      <td className="event-roles">
                                        {event.role
                                          ?.split(", ")
                                          .map((role, i) => (
                                            <Badge key={i} className="role-badge">
                                              {role.trim()}
                                            </Badge>
                                          ))}
                                      </td>
                                      <td className="event-time">
                                        {event.start?.dateTime ? (
                                          <div className="date-time">
                                            <div className="date">
                                              {new Date(event.start.dateTime).toLocaleDateString("de-DE", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric"
                                              })}
                                            </div>
                                            <div className="time">
                                              {new Date(event.start.dateTime).toLocaleTimeString("de-DE", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                              })}
                                            </div>
                                          </div>
                                        ) : (
                                          <span>Datum unbekannt</span>
                                        )}
                                      </td>
                                      <td className="event-actions">
                                        {event.htmlLink ? (
                                          <Button
                                            variant="outline-primary"
                                            size="sm"
                                            href={event.htmlLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Calendar3 />
                                            <span className="ms-1 d-none d-md-inline">Öffnen</span>
                                          </Button>
                                        ) : (
                                          <Button variant="outline-secondary" size="sm" disabled>
                                            N/A
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </Table>
                          </div>

                          {/* Mobile cards view */}
                          <div className="event-cards-container d-md-none">
                            {filteredEventsByCalendar[calendarName].map((event, index) => (
                              <Card key={index} className="mb-3">
                                <Card.Body>
                                  <Card.Title>{event.summary}</Card.Title>
                                  <div className="mb-2">
                                    {event.role?.split(", ").map((role, i) => (
                                      <Badge key={i} className="me-1">
                                        {role.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                  {event.location && (
                                    <div className="mb-1">
                                      <small className="text-muted">
                                        <i className="bi bi-geo-alt"></i> {event.location}
                                      </small>
                                    </div>
                                  )}
                                  {event.start?.dateTime && (
                                    <div className="mb-2">
                                      <small>
                                        <i className="bi bi-calendar-event"></i>{" "}
                                        {new Date(event.start.dateTime).toLocaleDateString("de-DE")}{" "}
                                        {new Date(event.start.dateTime).toLocaleTimeString("de-DE", {
                                          hour: "2-digit",
                                          minute: "2-digit"
                                        })}
                                      </small>
                                    </div>
                                  )}
                                  {event.htmlLink && (
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      href={event.htmlLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Calendar3 className="me-1" />
                                      Öffnen
                                    </Button>
                                  )}
                                </Card.Body>
                              </Card>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="no-events-message text-center py-4 text-muted">
                          Keine unzugewiesenen Veranstaltungen in diesem Kalender.
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