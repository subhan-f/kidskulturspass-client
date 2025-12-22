import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Button,
  Table,
  Alert,
  Badge,
  Spinner,
  Form,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  Calendar3,
  ChevronDown,
  ChevronUp,
  InfoCircle,
  Search,
  FileCode,
  List,
  Clock,
  ArrowRight,
  PlayCircle,
  StopCircle,
} from "react-bootstrap-icons";
import { DashboardLayout } from "../components/layout";
import { SearchBox, DashboardLoader } from "../components/common";
import { authApi } from "../utils/api";
import axios from "axios";
import CustomTooltip from "../components/common/CustomToolTip/CustomToolTip";
import { API_URL, USER_API_URL } from "../constants/app.contants";

// Log levels with colors
const LOG_LEVELS = {
  info: "primary",
  warning: "warning",
  error: "danger",
  success: "success",
  debug: "secondary",
};

// Event types for tabs (calendar events)
const EVENT_TYPES = [
  "All logs",
  "Geigen Mitmachkonzert",
  "Klavier Mitmachkonzert",
  "Laternenumzug mit Musik",
  "Nikolaus Besuch",
  "Puppentheater",
  "Weihnachts Mitmachkonzert",
];

// API base URL for logs
const LOGS_API_URL = "https://logger-saver-754826373806.europe-west1.run.app/logs";

// Format timestamp in German locale
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Format duration in milliseconds to readable format
const formatDuration = (ms) => {
  if (!ms) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Format log level badge
const formatLogLevel = (level) => {
  const variant = LOG_LEVELS[level] || "secondary";
  const label = level ? level.charAt(0).toUpperCase() + level.slice(1) : "Unknown";
  
  return <Badge bg={variant}>{label}</Badge>;
};

// Get overall status from logs
const getOverallStatus = (log) => {
  if (!log || !log.executionSteps) return { level: "info", label: "Unknown", variant: "secondary" };
  
  const hasError = log.executionSteps.some(step => 
    step.logs && step.logs.some(logEntry => logEntry.level === "error")
  );
  
  const hasWarning = log.executionSteps.some(step =>
    step.logs && step.logs.some(logEntry => logEntry.level === "warning")
  );
  
  if (hasError) return { level: "error", label: "Failed", variant: "danger" };
  if (hasWarning) return { level: "warning", label: "Warning", variant: "warning" };
  
  // Check for status field in the log itself
  if (log.status === "success") return { level: "success", label: "Success", variant: "success" };
  if (log.status === "failed") return { level: "error", label: "Failed", variant: "danger" };
  
  return { level: "success", label: "Success", variant: "success" };
};

function LoggerDashboard({ setAuth, handleLogout }) {
  // State Management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Logs werden geladen...");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All logs");
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [apiLoading, setApiLoading] = useState(false);
  
  // Tooltip State
  const [tooltipShow, setTooltipShow] = useState({});
  const [tooltipTargets, setTooltipTargets] = useState({});

  // Utility Functions
  const handleTooltipShow = (key, target) => {
    setTooltipShow((prev) => ({ ...prev, [key]: true }));
    setTooltipTargets((prev) => ({ ...prev, [key]: target }));
  };

  const handleTooltipHide = (key) => {
    setTooltipShow((prev) => ({ ...prev, [key]: false }));
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Toggle step expansion
  const toggleStepExpansion = (logId, stepIndex) => {
    setExpandedSteps(prev => ({
      ...prev,
      [`${logId}-${stepIndex}`]: !prev[`${logId}-${stepIndex}`]
    }));
  };

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      setApiLoading(true);
      const response = await axios.get(LOGS_API_URL);
      console.log("Fetched logs:", response.data);
      
      // Extract logs from the new response structure
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // The new API returns {success, count, data: [...]}
        const logsData = response.data.data;
        // Sort logs by createdAt (newest first)
        const sortedLogs = logsData.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setLogs(sortedLogs);
      } else if (Array.isArray(response.data)) {
        // Fallback for old structure
        const sortedLogs = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setLogs(sortedLogs);
      } else {
        setLogs([]);
      }
      setApiLoading(false);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Fehler beim Laden der Logs. Bitte versuchen Sie es später erneut.");
      setLogs([]);
      setApiLoading(false);
    }
  };

  // Data Fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage("Benutzerdaten werden geladen...");
      clearMessages();

      // Fetch user data
      const res = await authApi.getMe();
      const currentUser = res.data.user;
      const userData = await axios.get(`${USER_API_URL}/?id=${currentUser._id}`);
      setUser(userData.data);

      // Load logs from API
      setLoadingMessage("Logs werden geladen...");
      await fetchLogs();

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
  const handleLogClick = useCallback((log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  }, []);

  const handleRefresh = useCallback(() => {
    clearMessages();
    fetchLogs();
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Filter logs based on search term and active tab
  const filterLogs = useCallback(
    (logs) => {
      let filtered = logs;
      
      // Apply tab filter
      if (activeTab !== "All logs") {
        filtered = filtered.filter(log => 
          log.calendarName === activeTab || 
          log.overallTiming?.calendarName === activeTab
        );
      }
      
      // Apply search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            (log.dealId && log.dealId.toString().toLowerCase().includes(searchLower)) ||
            (log.dealName && log.dealName.toLowerCase().includes(searchLower)) ||
            (log.eventId && log.eventId.toLowerCase().includes(searchLower)) ||
            (log.eventSummary && log.eventSummary.toLowerCase().includes(searchLower)) ||
            (log.requestInitiatedBy && log.requestInitiatedBy.toLowerCase().includes(searchLower)) ||
            (log.triggerEventsource && log.triggerEventsource.toLowerCase().includes(searchLower)) ||
            (log.triggerEventtype && log.triggerEventtype.toLowerCase().includes(searchLower)) ||
            (log._id && log._id.toLowerCase().includes(searchLower))
        );
      }
      
      return filtered;
    },
    [searchTerm, activeTab]
  );

  // Memoized Computations
  const filteredLogs = useMemo(() => {
    return filterLogs(logs);
  }, [logs, filterLogs]);

  const totalFilteredLogs = useMemo(() => {
    return filteredLogs.length;
  }, [filteredLogs]);

  // Helper function to get event details from log
  const getEventDetails = (log) => {
    return {
      id: log._id,
      triggerEvent: log.triggerEventtype || "N/A",
      triggerSource: log.triggerEventsource || "N/A",
      initiatedBy: log.requestInitiatedBy || "Unknown",
      dealId: log.dealId || "N/A",
      dealName: log.dealName || "",
      eventId: log.eventId || "N/A",
      eventSummary: log.eventSummary || "",
      calendarName: log.calendarName || "N/A",
      createdAt: log.createdAt || new Date().toISOString(),
      duration: log.overallTiming?.totalDuration || 0,
      startTime: log.overallTiming?.startTime,
      endTime: log.overallTiming?.endTime,
      status: log.status || "unknown",
      executionSteps: log.executionSteps || []
    };
  };

  // Render Helper Functions
  const renderLogRow = (log, index) => {
    const details = getEventDetails(log);
    const detailKey = `detail-${details.id}-${index}`;
    const status = getOverallStatus(log);
    const totalLogs = details.executionSteps ? 
      details.executionSteps.reduce((sum, step) => sum + (step.logs ? step.logs.length : 0), 0) : 0;

    return (
      <tr key={details.id} className="log-row">
        <td className="log-id">
          <div className="trigger-info" title={`${details.triggerSource} → ${details.triggerEvent}`}>
            <div className="request-source">
              {details.initiatedBy || details.triggerSource}
            </div>
            <div className="event-type text-muted small">
              {details.triggerEvent}
            </div>
          </div>
        </td>
        <td className="log-deal">
          {details.dealId !== "N/A" ? (
            <div>
              <div className="deal-id">{details.dealId}</div>
              {details.dealName && (
                <div className="deal-name text-muted small">{details.dealName}</div>
              )}
            </div>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </td>
        <td className="log-event">
          {details.eventId !== "N/A" ? (
            <div>
              <div className="event-id">{details.eventId}</div>
              {details.eventSummary && (
                <div className="event-summary text-muted small">{details.eventSummary}</div>
              )}
              {details.calendarName && (
                <div className="calendar-name text-muted small">{details.calendarName}</div>
              )}
            </div>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </td>
        <td className="log-timestamp date-time-column">
          <div className="date-time">
            <div>{formatTimestamp(details.createdAt)}</div>
            {details.duration > 0 && (
              <div className="duration small text-muted">
                <Clock size={12} className="me-1" />
                {formatDuration(details.duration)}
              </div>
            )}
          </div>
        </td>
        <td className="log-steps">
          <div className="steps-info">
            <div className="steps-count">
              {details.executionSteps.length} steps
            </div>
            <div className="logs-count small text-muted">
              {totalLogs} logs
            </div>
          </div>
        </td>
        <td className="log-status">
          <div className="status-indicator">
            <Badge bg={status.variant}>
              {status.label}
            </Badge>
          </div>
        </td>
        <td className="log-actions actions-column">
          <Button
            ref={(el) => {
              if (el && !tooltipTargets[detailKey]) {
                setTooltipTargets((prev) => ({ ...prev, [detailKey]: el }));
              }
            }}
            variant="outline-primary"
            size="sm"
            onClick={() => handleLogClick(log)}
            onMouseEnter={(e) => handleTooltipShow(detailKey, e.currentTarget)}
            onMouseLeave={() => handleTooltipHide(detailKey)}
            className="open-log-button"
            disabled={!details.executionSteps || details.executionSteps.length === 0}
          >
            <InfoCircle className="button-icon" />
          </Button>
          <CustomTooltip
            show={tooltipShow[detailKey]}
            target={tooltipTargets[detailKey]}
            variant="primary"
          >
            {details.executionSteps && details.executionSteps.length > 0 
              ? "Log Details anzeigen" 
              : "Keine Details verfügbar"}
          </CustomTooltip>
        </td>
      </tr>
    );
  };

  const renderMobileLogCard = (log) => {
    const details = getEventDetails(log);
    const status = getOverallStatus(log);
    const totalLogs = details.executionSteps ? 
      details.executionSteps.reduce((sum, step) => sum + (step.logs ? step.logs.length : 0), 0) : 0;

    return (
      <div key={details.id} className="log-mobile-card">
        <div className="log-mobile-header">
          <div className="log-mobile-title d-flex justify-content-between">
            <div>
              <Badge bg={status.variant} className="me-2">
                {status.label}
              </Badge>
              <span className="event-type">{details.triggerEvent}</span>
            </div>
            <div className="log-mobile-timestamp">
              {formatTimestamp(details.createdAt)}
            </div>
          </div>
        </div>
        <div className="log-mobile-content">
          {details.dealId !== "N/A" && (
            <div className="log-mobile-deal">
              <strong>Deal:</strong> {details.dealId}
              {details.dealName && ` (${details.dealName})`}
            </div>
          )}
          {details.eventId !== "N/A" && (
            <div className="log-mobile-event">
              <strong>Event:</strong> {details.eventId}
              {details.eventSummary && ` - ${details.eventSummary}`}
            </div>
          )}
          {details.calendarName && (
            <div className="log-mobile-calendar">
              <strong>Calendar:</strong> {details.calendarName}
            </div>
          )}
          <div className="log-mobile-steps">
            <strong>Steps:</strong> {details.executionSteps.length} steps, {totalLogs} logs
          </div>
          {details.duration > 0 && (
            <div className="log-mobile-duration">
              <strong>Duration:</strong> {formatDuration(details.duration)}
            </div>
          )}
          <div className="log-mobile-actions mt-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleLogClick(log)}
              className="me-2"
              disabled={!details.executionSteps || details.executionSteps.length === 0}
            >
              <InfoCircle className="me-1" />
              Details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderStepDetails = (step, logId, stepIndex) => {
    const isExpanded = expandedSteps[`${logId}-${stepIndex}`];
    if (!step) return null;
    
    return (
      <div key={step.sequence} className="step-details mb-3">
        <div 
          className="step-header p-3 bg-light rounded d-flex justify-content-between align-items-center"
          onClick={() => toggleStepExpansion(logId, stepIndex)}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <strong>Step {step.sequence || stepIndex + 1}: {step.repo || "Unknown"}</strong>
          </div>
          <div className="d-flex align-items-center">
            {step.duration && (
              <span className="me-3">
                <Clock size={14} className="me-1" />
                {formatDuration(step.duration)}
              </span>
            )}
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="step-content p-3 border rounded mt-2">
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="detail-field mb-2">
                  <strong>Start:</strong> {formatTimestamp(step.startTime)}
                </div>
                <div className="detail-field mb-2">
                  <strong>End:</strong> {formatTimestamp(step.endTime)}
                </div>
              </div>
              <div className="col-md-6">
                {step.duration && (
                  <div className="detail-field mb-2">
                    <strong>Duration:</strong> {formatDuration(step.duration)}
                  </div>
                )}
                <div className="detail-field mb-2">
                  <strong>Logs:</strong> {step.logs ? step.logs.length : 0} entries
                </div>
              </div>
            </div>
            
            {step.logs && step.logs.length > 0 ? (
              <div className="step-logs">
                <h6>Log Entries:</h6>
                <div className="table-responsive">
                  <Table size="sm" className="mb-0">
                    <thead>
                      <tr>
                        <th width="50">#</th>
                        <th width="100">Level</th>
                        <th width="150">Time</th>
                        <th>Message</th>
                        <th width="150">Function</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step.logs.map((logEntry, idx) => (
                        <tr key={logEntry._id || idx}>
                          <td>{logEntry.sequence || idx + 1}</td>
                          <td>{formatLogLevel(logEntry.level)}</td>
                          <td className="small">
                            {formatTimestamp(logEntry.timestamp).split(' ')[1]}
                          </td>
                          <td style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                            {logEntry.message}
                          </td>
                          <td className="small text-muted">
                            {logEntry.functionName || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="alert alert-info mb-0">
                Keine Log-Einträge für diesen Step verfügbar.
              </div>
            )}
          </div>
        )}
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
      refreshLoading={apiLoading}
    >
      <div className="user-assigned-dashboard logger-dashboard">
        {/* Header */}
        {!loading && (
          <div className="transparent-header-container">
            <div className="header-welcome-content">
              <h1 className="dashboard-main-title">
                Willkommen, {user?.Name || "Benutzer"}!
              </h1>
              <p className="dashboard-subtitle">
                Execution Logs Monitoring
              </p>
            </div>
            <div className="header-search-box">
              <SearchBox
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Nach Deal ID, Event, Trigger suchen..."
              />
            </div>
          </div>
        )}

        {/* Messages */}
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

        {/* Logs Container with Tabs */}
        <div className="events-container logs-container">
          <div className="chrome-tabs-container">
            <div className="chrome-tabs">
              {EVENT_TYPES.map((eventType) => (
                <button
                  key={eventType}
                  className={`chrome-tab ${activeTab === eventType ? "active" : ""}`}
                  onClick={() => setActiveTab(eventType)}
                >
                  {eventType}
                </button>
              ))}
            </div>
          </div>

          <div className="tab-content">
            <div className="summary-box mb-4">
              <h4>
                {activeTab === "All logs" 
                  ? "Alle Logs" 
                  : `Logs für "${activeTab}"`}
              </h4>
              <p>
                {activeTab === "All logs"
                  ? "Übersicht aller System-Logs und Ausführungen."
                  : `Logs spezifisch für das Event "${activeTab}".`}
              </p>
            </div>

            <h2 className="assigned-events-heading">
              {activeTab === "All logs" ? "System Execution Logs" : `Logs - ${activeTab}`}
            </h2>

            {totalFilteredLogs === 0 && !searchTerm ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileCode size={48} />
                </div>
                <p className="empty-state-message">
                  {activeTab === "All logs"
                    ? "Keine Logs gefunden."
                    : `Es gibt keine Einträge für diesen Kalender "${activeTab}".`}
                </p>
                <Button variant="primary" onClick={handleRefresh} disabled={apiLoading}>
                  {apiLoading ? <Spinner animation="border" size="sm" /> : "Aktualisieren"}
                </Button>
              </div>
            ) : totalFilteredLogs === 0 && searchTerm ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Search size={48} />
                </div>
                <p className="empty-state-message">
                  Keine Logs entsprechen Ihrer Suche.
                </p>
                <Button variant="outline-primary" onClick={() => setSearchTerm("")}>
                  Suche zurücksetzen
                </Button>
              </div>
            ) : (
              <div className="event-calendar-card">
                <div className="calendar-header">
                  <div className="header-content">
                    <div className="title-with-icon">
                      <h5 className="calendar-title">
                        {activeTab === "All logs" ? "Alle Logs" : activeTab}
                      </h5>
                    </div>
                    <span className="logs-count">
                      <span className="count-number">{totalFilteredLogs}</span>
                      <span className="count-label">
                        {totalFilteredLogs === 1 ? " Log" : " Logs"}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="calendar-content">
                  {apiLoading ? (
                    <div className="text-center p-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Logs werden geladen...</p>
                    </div>
                  ) : filteredLogs.length > 0 ? (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table className="logs-table">
                          <thead>
                            <tr>
                              <th>Trigger / Event</th>
                              <th>Deal</th>
                              <th>Calendar Event</th>
                              <th>Timestamp / Duration</th>
                              <th>Steps</th>
                              <th>Status</th>
                              <th>Aktion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLogs.map((log, index) =>
                              renderLogRow(log, index)
                            )}
                          </tbody>
                        </Table>
                      </div>
                      <div className="log-cards-container d-md-none">
                        {filteredLogs.map((log) =>
                          renderMobileLogCard(log)
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="no-logs-message">
                      Keine Logs gefunden.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Log Details Modal */}
        <Modal 
          show={showLogModal} 
          onHide={() => setShowLogModal(false)}
          size="xl"
          centered
          scrollable
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              <div className="d-flex align-items-center">
                <InfoCircle className="me-2" />
                Execution Log Details
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedLog && (
              <>
                {/* Overview Section */}
                <div className="overview-section mb-4 p-3 bg-light rounded">
                  <h5 className="mb-3">Übersicht</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="detail-field mb-2">
                        <strong>Request ID:</strong> {selectedLog._id}
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Initiated By:</strong> {selectedLog.requestInitiatedBy || "N/A"}
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Trigger:</strong> 
                        <Badge bg="secondary" className="ms-2">
                          {selectedLog.triggerEventsource || "Unknown"} → {selectedLog.triggerEventtype || "Unknown"}
                        </Badge>
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Trigger Time:</strong> {formatTimestamp(selectedLog.triggerEventtimestamp)}
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Calendar:</strong> {selectedLog.calendarName || "N/A"}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="detail-field mb-2">
                        <strong>Deal:</strong> 
                        {selectedLog.dealId ? (
                          <div className="mt-1">
                            <Badge bg="info" className="me-2">{selectedLog.dealId}</Badge>
                            {selectedLog.dealName && <span>{selectedLog.dealName}</span>}
                          </div>
                        ) : "N/A"}
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Calendar Event:</strong> 
                        {selectedLog.eventId ? (
                          <div className="mt-1">
                            <Badge bg="success" className="me-2">{selectedLog.eventId}</Badge>
                            {selectedLog.eventSummary && <span>{selectedLog.eventSummary}</span>}
                          </div>
                        ) : "N/A"}
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Duration:</strong> 
                        {selectedLog.overallTiming?.totalDuration ? (
                          <Badge bg="dark" className="ms-2">
                            {formatDuration(selectedLog.overallTiming.totalDuration)}
                          </Badge>
                        ) : "N/A"}
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Status:</strong> 
                        <Badge bg={getOverallStatus(selectedLog).variant} className="ms-2">
                          {getOverallStatus(selectedLog).label}
                        </Badge>
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Created:</strong> {formatTimestamp(selectedLog.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                {selectedLog.executionSteps && selectedLog.executionSteps.length > 0 && (
                  <>
                    <div className="timeline-section mb-4">
                      <h5 className="mb-3">Execution Timeline</h5>
                      <div className="timeline-visualization">
                        {selectedLog.executionSteps.map((step, index) => (
                          <div key={step.sequence || index} className="timeline-step mb-2">
                            <div className="d-flex align-items-center">
                              <div className="timeline-marker me-3">
                                <div className="step-number">{step.sequence || index + 1}</div>
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <div>
                                    <strong>{step.repo || "Unknown"}</strong>
                                  </div>
                                  <div className="text-end">
                                    {step.duration && (
                                      <div className="duration">{formatDuration(step.duration)}</div>
                                    )}
                                    {step.startTime && (
                                      <div className="timestamp small text-muted">
                                        {formatTimestamp(step.startTime).split(' ')[1]}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {step.duration && (
                                  <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar bg-primary" 
                                      style={{ width: `${Math.min((step.duration / 1000) * 100, 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Execution Steps Section */}
                    <div className="execution-steps-section">
                      <h5 className="mb-3">Execution Steps ({selectedLog.executionSteps.length})</h5>
                      {selectedLog.executionSteps.map((step, index) => 
                        renderStepDetails(step, selectedLog._id, index)
                      )}
                    </div>
                  </>
                )}
                
                {(!selectedLog.executionSteps || selectedLog.executionSteps.length === 0) && (
                  <div className="alert alert-info">
                    Keine Execution Steps für diesen Log verfügbar.
                  </div>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <div className="d-flex justify-content-between w-100">
              <Button variant="secondary" onClick={() => setShowLogModal(false)}>
                Schließen
              </Button>
              <div>
                <Button 
                  variant="outline-dark" 
                  onClick={() => {
                    const details = getEventDetails(selectedLog);
                    const logText = `
Event: ${details.triggerEvent}
Deal: ${details.dealId}
Calendar: ${details.calendarName}
Status: ${getOverallStatus(selectedLog).label}
Duration: ${details.duration > 0 ? formatDuration(details.duration) : 'N/A'}
Steps: ${details.executionSteps.length}
                    `.trim();
                    navigator.clipboard.writeText(logText);
                    setSuccess("Log-Zusammenfassung kopiert!");
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  className="me-2"
                >
                  Zusammenfassung kopieren
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                    setSuccess("Komplette Log-Daten kopiert!");
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                >
                  JSON kopieren
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default LoggerDashboard;