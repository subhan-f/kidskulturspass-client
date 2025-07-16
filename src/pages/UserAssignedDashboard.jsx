

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

function UserAssignedDashboard({ setAuth }) {
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
  // Fetch user data and events
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Benutzerdaten werden geladen...");

      // Get authenticated user
      const res = await authApi.getMe();
      const currentUser = res.data.user;
      
      // Get complete user data including joined calendars
    const userData = await axios.get(`${USER_API_URL}/?id=${currentUser._id}`);
    console.log("User data:", userData.data);
    setUser(userData.data);
      
      const joinedCalendars = userData.data.joinedCalendars || [];
    const calendarNames = joinedCalendars.map(c => c.Calendar);
      
      // Fetch assigned events for these calendars
      setLoadingMessage("Veranstaltungen werden geladen...");
        
    console.log("Joined calendars:", calendarNames);
    // 3. Fetch unassigned events only for these calendars
    const eventsRes = await axios.get(`${API_URL}/assigned`, {
      params: {
        email: userData.data["E-Mail"],
        calendars: calendarNames.join(','), // Send joined calendars to filter
        categorize: true
      }
    });
    
      
      const responseData = eventsRes.data;
      console.log("Fetched events:", responseData);
      setEvents(responseData.categorizedEvents || {});
      
      // Initialize expanded state for calendars
      const initialExpandState = {};
      Object.keys(responseData.categorizedEvents || {}).forEach(cal => {
        initialExpandState[cal] = true;
      });
      setExpandedCalendars(initialExpandState);
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.");
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

  // Filter events based on search term
  const filteredEventsByCalendar = useMemo(() => {
    const filtered = {};
    
    Object.keys(events).forEach(calendar => {
      filtered[calendar] = (events[calendar] || []).filter(
        (event) =>
          (event.summary || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.calendar || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.role || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.location || "").toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <DashboardLayout setAuth={setAuth} onRefresh={handleRefresh}>
      <div className="user-assigned-dashboard">
        {/* Header section with welcome message and search box */}
        <div className="transparent-header-container">
          <div className="header-welcome-content">
            <h1 className="dashboard-main-title">
              Willkommen, {user?.Name || "Benutzer"}!
            </h1>
            {user?.joinedCalendars?.length > 0 && (
              <div style={{margin:"15px 0px"}} className="joined-calendars-badges">
                Deine beigetretenen Kalender:
                {user.joinedCalendars.map((calendar, index) => (
                  <Badge key={index} bg="primary" style={{margin:"0px 2px"}} className="calendar-badge">
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
                                  <th>Veranstaltung</th>
                                  <th>Meine Rolle(n)</th>
                                  <th>Datum/Uhrzeit</th>
                                  <th>Aktion</th>
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
                                          <Badge key={i} className="role-badge" bg="success">
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
      </div>
    </DashboardLayout>
  );
}

export default UserAssignedDashboard;