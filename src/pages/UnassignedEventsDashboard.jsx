import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Table, Alert, Badge } from "react-bootstrap";
import {
  ArrowClockwise,
  Calendar3,
  ChevronDown,
  ChevronUp,
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout"; // Added DashboardLayout import
import api from "../utils/api";
import DashboardLoader from "../components/DashboardLoader";

function UnassignedEventsDashboard({ setAuth,handleLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Veranstaltungen werden geladen..."
  );
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [searchFocused, setSearchFocused] = useState(false); // Added missing state
  const requiredCalendars = [
    "Geigen Mitmachkonzert",
    "Klavier Mitmachkonzert",
    "Laternenumzug mit Musik",
    "Nikolaus Besuch",
    "Puppentheater",
    "Weihnachts Mitmachkonzert",
  ];
  const fetchEvents = async (options = {}) => {
    const {
      showLoading = true,
      isPolling = false,
      forceRefresh = false,
    } = options;

    if (showLoading && !isPolling) {
      setLoading(true);
      setLoadingMessage("Veranstaltungen werden geladen...");
    }

    try {
      console.log("Fetching events with options:", options);

      // Using our mock API directly
      const response = await api.get("/api/unassignedEvents", {
        params: {
          loading: true,
          refresh: forceRefresh ? true : undefined,
          longTimeout: true,
        },
      });

      console.log("Response received:", response.data);

      // Check if data is still loading (simulating long-running API call)
      if (response.data.status === "loading") {
        // Start polling if not already
        if (!polling) {
          setPolling(true);
          setPollingAttempts(1);

          if (showLoading) {
            setLoading(true);
            setLoadingMessage(
              "Daten werden vom Kalender-Service geladen. Dies kann bis zu einer Minute dauern..."
            );
          }

          setTimeout(() => pollForEvents(), 2000); // Reduced delay for demo
        }
      } else {
        // We have data, stop polling
        setPolling(false);
        setEvents(response.data.events || []);
        setWarning(response.data.warning || null);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Fehler beim Laden der Veranstaltungen (DEMO-MODUS)");
      setPolling(false);
      setLoading(false);
    }
  };

  // Polling function for long-running requests
  const pollForEvents = async () => {
    // Increase polling attempts
    setPollingAttempts((prev) => prev + 1);
    console.log(`Polling attempt ${pollingAttempts}`);

    try {
      const response = await api.get("/api/unassignedEvents", {
        params: { background: true, longTimeout: true }, // Tell server this is a background request
      });

      console.log("Polling response:", response.data);

      // Check if we have real data or still loading
      if (!response.data.status || response.data.status !== "loading") {
        // Got real data, stop polling
        setEvents(response.data.events || []);
        setWarning(response.data.warning || null);
        setError(null);
        setPolling(false);
        setLoading(false);
      } else if (pollingAttempts < 24) {
        // Increased polling attempts for 10 minute timeout (24 attempts = 2 minutes)
        // Still loading, continue polling
        setTimeout(() => pollForEvents(), 5000);
      } else {
        // Give up after too many attempts
        setPolling(false);
        setLoading(false);
        setWarning(
          "Timeout beim Laden der Daten. Bitte aktualisieren Sie die Seite oder versuchen Sie es später erneut."
        );

        // Try fetching with longer timeout as last resort
        try {
          const longTimeoutResponse = await api.get("/api/unassignedEvents", {
            params: { longTimeout: true, refresh: true },
          });

          setEvents(longTimeoutResponse.data.events || []);
          setWarning(longTimeoutResponse.data.warning || null);
        } catch (finalErr) {
          console.error("Final attempt error:", finalErr);
        }
      }
    } catch (err) {
      console.error("Error during polling:", err);
      setPolling(false);
      setLoading(false);
      setError("Fehler beim Laden der Veranstaltungen");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Initialize expanded calendars state when events are loaded
  useEffect(() => {
    if (events.length > 0) {
      const calendars = [...new Set(events.map((event) => event.calendar))];
      const initialExpandState = {};
      calendars.forEach((cal) => {
        initialExpandState[cal] = true; // Default to expanded
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

  // Replace the unused getCalendarCounts with a usable version
  const calendarsWithCounts = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.calendar] = (acc[event.calendar] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const getRoleCounts = () => {
    return events.reduce((acc, event) => {
      if (!event.role) return acc;
      const roles = event.role.split(", ");
      roles.forEach((role) => {
        acc[role.trim()] = (acc[role.trim()] || 0) + 1;
      });
      return acc;
    }, {});
  };

  // Add a function to count roles per calendar - similar to getRoleCountsByCalendar in ArtistsDashboard
  const getRoleCountsByCalendar = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!event.calendar || !event.role) return acc;

      if (!acc[event.calendar]) {
        acc[event.calendar] = {};
      }

      // Split roles and count each one
      const roles = event.role.split(", ");
      roles.forEach((role) => {
        const trimmedRole = role.trim();
        acc[event.calendar][trimmedRole] =
          (acc[event.calendar][trimmedRole] || 0) + 1;
      });

      return acc;
    }, {});
  }, [events]);

  // Filter and group events by calendar
  const filteredEventsByCalendar = useMemo(() => {
    // First apply the search filter - improved to handle null values
    const filtered = events.filter(
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

    // Then group by calendar
    return filtered.reduce((acc, event) => {
      const calendar = event.calendar || "Unbekannt";
      if (!acc[calendar]) {
        acc[calendar] = [];
      }
      acc[calendar].push(event);
      return acc;
    }, {});
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
    setEvents([]);
    setError(null);
    setWarning(null);
    fetchEvents({ forceRefresh: true });
  }, []);

  // Enhanced clear search function
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Enhance LoadingSpinner display with progress indication
  if (loading) {
    return (
      <DashboardLayout
      handleLogout={handleLogout}
        setAuth={setAuth}
      >
        <DashboardLoader
          message={loadingMessage}
          progress={polling ? Math.min(pollingAttempts * 4, 100) : null}
          progressMessage={
            polling
              ? `Anfrage läuft... ${
                  pollingAttempts > 0 ? `(Versuch ${pollingAttempts})` : ""
                }`
              : null
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout handleLogout={handleLogout} setAuth={setAuth} onRefresh={handleRefresh}>
      <div className="unassigned-events-dashboard">
        {/* Header section with vertically centered heading and search bar */}
        {!loading && (
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
        )}
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
            requiredCalendars.map((calendar) => {
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

                        {getRoleCountsByCalendar[calendar] &&
                          Object.entries(getRoleCountsByCalendar[calendar])
                            .length > 0 && (
                            <div className="calendar-role-badges d-none d-md-flex">
                              {Object.entries(getRoleCountsByCalendar[calendar])
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([role, count]) => (
                                  <Badge
                                    key={role}
                                    bg={
                                      count > 5
                                        ? "primary"
                                        : count > 2
                                        ? "info"
                                        : "success"
                                    }
                                    className="enhanced-badge capsule-badge"
                                  >
                                    {role}{" "}
                                    <span className="badge-count">{count}</span>
                                  </Badge>
                                ))}
                              {Object.keys(getRoleCountsByCalendar[calendar])
                                .length > 3 && (
                                <Badge
                                  bg="secondary"
                                  className="enhanced-badge capsule-badge"
                                >
                                  +
                                  {Object.keys(
                                    getRoleCountsByCalendar[calendar]
                                  ).length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
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
                                  <th>Fehlende Rolle(n)</th>
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
                          Keine unzugewiesenen Veranstaltungen in diesem
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

export default UnassignedEventsDashboard;
