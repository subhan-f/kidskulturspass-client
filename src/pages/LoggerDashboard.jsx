// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   Modal,
//   Button,
//   Table,
//   Alert,
//   Badge,
//   Spinner,
//   Form,
//   Tabs,
//   Tab,
// } from "react-bootstrap";
// import {
//   Calendar3,
//   ChevronDown,
//   ChevronUp,
//   InfoCircle,
//   Search,
//   FileCode,
//   List,
//   Clock,
//   ArrowRight,
//   PlayCircle,
//   StopCircle,
// } from "react-bootstrap-icons";
// import { DashboardLayout } from "../components/layout";
// import { SearchBox, DashboardLoader } from "../components/common";
// import { authApi } from "../utils/api";
// import axios from "axios";
// import CustomTooltip from "../components/common/CustomToolTip/CustomToolTip";
// import { API_URL, USER_API_URL } from "../constants/app.contants";

// // Log levels with colors
// const LOG_LEVELS = {
//   info: "primary",
//   warning: "warning",
//   error: "danger",
//   success: "success",
//   debug: "secondary",
// };

// // Event types for tabs (calendar events)
// const EVENT_TYPES = [
//   "All logs",
//   "Geigen Mitmachkonzert",
//   "Klavier Mitmachkonzert",
//   "Laternenumzug mit Musik",
//   "Nikolaus Besuch",
//   "Puppentheater",
//   "Weihnachts Mitmachkonzert",
// ];

// // Generate dummy logs based on the new structure
// const generateDummyLogs = () => {
//   const logs = [];
//   const repos = ["hubspot-deal-sync", "sync-google-calendar", "notifications-service", "invoicing-service"];
//   const eventTypes = EVENT_TYPES.slice(1); // Remove "All logs"
//   const triggerSources = ["hubspot", "google-calendar", "manual", "api-call"];
//   const initiatedByOptions = ["hubspot-webhook", "google-calendar-webhook", "admin-dashboard", null];
  
//   for (let i = 0; i < 30; i++) {
//     const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
//     const hasError = Math.random() > 0.85;
//     const hasDeal = Math.random() > 0.3;
//     const hasEvent = Math.random() > 0.4;
//     const stepCount = Math.floor(Math.random() * 4) + 1; // 1-4 steps
    
//     // Generate execution steps
//     const executionSteps = [];
//     let stepStartTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    
//     for (let j = 0; j < stepCount; j++) {
//       const stepDuration = Math.floor(Math.random() * 800) + 100; // 100-900ms
//       const stepEndTime = new Date(stepStartTime.getTime() + stepDuration);
//       const logCount = Math.floor(Math.random() * 3) + 2; // 2-4 logs per step
      
//       const stepLogs = [];
//       for (let k = 0; k < logCount; k++) {
//         const level = Math.random() > 0.9 ? "error" : 
//                      Math.random() > 0.8 ? "warning" : 
//                      Math.random() > 0.7 ? "debug" : 
//                      Math.random() > 0.6 ? "success" : "info";
        
//         const messages = {
//           info: [
//             "Processing input data",
//             "Validation completed successfully",
//             "Fetching external data",
//             "Transforming data format",
//           ],
//           error: [
//             "Failed to connect to external service",
//             "Validation error: Invalid input format",
//             "Timeout while waiting for response",
//             "Database connection failed",
//           ],
//           warning: [
//             "Retrying operation after failure",
//             "Performance degradation detected",
//             "Using deprecated API endpoint",
//           ],
//           success: [
//             "Operation completed successfully",
//             "Data persisted successfully",
//             "Webhook sent successfully",
//           ],
//           debug: [
//             "Memory usage: 124MB",
//             "Processing time: 245ms",
//             "Cache hit ratio: 0.78",
//           ],
//         };
        
//         const messageArray = messages[level] || messages.info;
//         const message = messageArray[Math.floor(Math.random() * messageArray.length)];
        
//         stepLogs.push({
//           sequence: k + 1,
//           level,
//           message,
//           functionName: Math.random() > 0.3 ? `function_${String.fromCharCode(65 + k)}` : null,
//           file: Math.random() > 0.4 ? `service/${repos[j % repos.length]}.js` : null,
//           timestamp: new Date(stepStartTime.getTime() + (k * (stepDuration / logCount))),
//         });
//       }
      
//       // Add error log if hasError and this is the last step
//       if (hasError && j === stepCount - 1) {
//         stepLogs.push({
//           sequence: stepLogs.length + 1,
//           level: "error",
//           message: "Critical error: Operation failed",
//           functionName: "handleError",
//           file: "errorHandler.js",
//           timestamp: stepEndTime,
//         });
//       }
      
//       executionSteps.push({
//         sequence: j + 1,
//         repo: repos[j % repos.length],
//         flow: Math.random() > 0.2 ? `flow-${j + 1}` : null,
//         input: { data: "sample-input", timestamp: stepStartTime.toISOString() },
//         startTime: stepStartTime,
//         endTime: stepEndTime,
//         duration: stepDuration,
//         logs: stepLogs,
//       });
      
//       stepStartTime = new Date(stepEndTime.getTime() + 50); // Small gap between steps
//     }
    
//     // Calculate overall timing
//     const overallStartTime = executionSteps[0].startTime;
//     const overallEndTime = executionSteps[executionSteps.length - 1].endTime;
//     const totalDuration = overallEndTime - overallStartTime;
    
//     const log = {
//       _id: `log-${i + 1}`,
//       requestInitiatedBy: initiatedByOptions[Math.floor(Math.random() * initiatedByOptions.length)],
//       triggerEventsource: triggerSources[Math.floor(Math.random() * triggerSources.length)],
//       triggerEventtype: eventType,
//       triggerEventtimestamp: overallStartTime,
      
//       dealId: hasDeal ? `HS-${Math.floor(Math.random() * 90000) + 10000}` : null,
//       dealName: hasDeal ? `Deal ${["Enterprise", "Standard", "Premium"][Math.floor(Math.random() * 3)]} Package` : null,
//       eventId: hasEvent ? `EVENT-${Math.floor(Math.random() * 1000)}` : null,
//       eventSummary: hasEvent ? `${eventType} - ${["Scheduled", "Completed", "Cancelled"][Math.floor(Math.random() * 3)]}` : null,
      
//       executionSteps,
//       overallTiming: {
//         startTime: overallStartTime,
//         endTime: overallEndTime,
//         totalDuration,
//       },
      
//       createdAt: overallStartTime,
//       updatedAt: overallEndTime,
//     };
    
//     logs.push(log);
//   }
  
//   // Sort by creation time (newest first)
//   logs.sort((a, b) => b.createdAt - a.createdAt);
  
//   return logs;
// };

// // Format timestamp in German locale
// const formatTimestamp = (timestamp) => {
//   if (!timestamp) return "N/A";
//   const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
//   return date.toLocaleString("de-DE", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// };

// // Format duration in milliseconds to readable format
// const formatDuration = (ms) => {
//   if (ms < 1000) return `${ms}ms`;
//   return `${(ms / 1000).toFixed(2)}s`;
// };

// // Format log level badge
// const formatLogLevel = (level) => {
//   const variant = LOG_LEVELS[level] || "secondary";
//   const label = level.charAt(0).toUpperCase() + level.slice(1);
  
//   return <Badge bg={variant}>{label}</Badge>;
// };

// // Get overall status from logs
// const getOverallStatus = (log) => {
//   const hasError = log.executionSteps.some(step => 
//     step.logs.some(log => log.level === "error")
//   );
  
//   const hasWarning = log.executionSteps.some(step =>
//     step.logs.some(log => log.level === "warning")
//   );
  
//   if (hasError) return { level: "error", label: "Failed", variant: "danger" };
//   if (hasWarning) return { level: "warning", label: "Warning", variant: "warning" };
//   return { level: "success", label: "Success", variant: "success" };
// };

// function LoggerDashboard({ setAuth, handleLogout }) {
//   // State Management
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [loadingMessage, setLoadingMessage] = useState("Logs werden geladen...");
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeTab, setActiveTab] = useState("All logs");
//   const [logs, setLogs] = useState([]);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [showLogModal, setShowLogModal] = useState(false);
//   const [expandedSteps, setExpandedSteps] = useState({});
  
//   // Tooltip State
//   const [tooltipShow, setTooltipShow] = useState({});
//   const [tooltipTargets, setTooltipTargets] = useState({});

//   // Utility Functions
//   const handleTooltipShow = (key, target) => {
//     setTooltipShow((prev) => ({ ...prev, [key]: true }));
//     setTooltipTargets((prev) => ({ ...prev, [key]: target }));
//   };

//   const handleTooltipHide = (key) => {
//     setTooltipShow((prev) => ({ ...prev, [key]: false }));
//   };

//   const clearMessages = () => {
//     setError(null);
//     setSuccess(null);
//   };

//   // Toggle step expansion
//   const toggleStepExpansion = (logId, stepIndex) => {
//     setExpandedSteps(prev => ({
//       ...prev,
//       [`${logId}-${stepIndex}`]: !prev[`${logId}-${stepIndex}`]
//     }));
//   };

//   // Data Loading
//   const loadLogs = () => {
//     const generatedLogs = generateDummyLogs();
//     setLogs(generatedLogs);
//   };

//   // Data Fetching
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setLoadingMessage("Benutzerdaten werden geladen...");
//       clearMessages();

//       // Fetch user data
//       const res = await authApi.getMe();
//       const currentUser = res.data.user;
//       const userData = await axios.get(`${USER_API_URL}/?id=${currentUser._id}`);
//       setUser(userData.data);

//       // Load logs
//       setLoadingMessage("Logs werden generiert...");
//       loadLogs();

//       setLoading(false);
//     } catch (err) {
//       setError("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.");
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Event Handlers
//   const handleLogClick = useCallback((log) => {
//     setSelectedLog(log);
//     setShowLogModal(true);
//   }, []);

//   const handleRefresh = useCallback(() => {
//     clearMessages();
//     loadLogs();
//   }, []);

//   const handleSearchChange = useCallback((e) => {
//     setSearchTerm(e.target.value);
//   }, []);

//   // Filter logs based on search term and active tab
//   const filterLogs = useCallback(
//     (logs) => {
//       let filtered = logs;
      
//       // Apply tab filter
//       if (activeTab !== "All logs") {
//         filtered = filtered.filter(log => log.triggerEventtype === activeTab);
//       }
      
//       // Apply search filter
//       if (searchTerm.trim()) {
//         const searchLower = searchTerm.toLowerCase();
//         filtered = filtered.filter(
//           (log) =>
//             log.dealId?.toLowerCase().includes(searchLower) ||
//             log.dealName?.toLowerCase().includes(searchLower) ||
//             log.eventId?.toLowerCase().includes(searchLower) ||
//             log.eventSummary?.toLowerCase().includes(searchLower) ||
//             log.requestInitiatedBy?.toLowerCase().includes(searchLower) ||
//             log.triggerEventsource.toLowerCase().includes(searchLower) ||
//             log.triggerEventtype.toLowerCase().includes(searchLower)
//         );
//       }
      
//       return filtered;
//     },
//     [searchTerm, activeTab]
//   );

//   // Memoized Computations
//   const filteredLogs = useMemo(() => {
//     return filterLogs(logs);
//   }, [logs, filterLogs]);

//   const totalFilteredLogs = useMemo(() => {
//     return filteredLogs.length;
//   }, [filteredLogs]);

//   // Render Helper Functions
//   const renderLogRow = (log, index) => {
//     const detailKey = `detail-${log._id}-${index}`;
//     const status = getOverallStatus(log);
//     const totalLogs = log.executionSteps.reduce((sum, step) => sum + step.logs.length, 0);

//     return (
//       <tr key={log._id} className="log-row">
//         <td className="log-id">
//           <div className="trigger-info" title={`${log.triggerEventsource} → ${log.triggerEventtype}`}>
//             <div className="request-source">
//               {log.requestInitiatedBy || log.triggerEventsource}
//             </div>
//             <div className="event-type text-muted small">
//               {log.triggerEventtype}
//             </div>
//           </div>
//         </td>
//         <td className="log-deal">
//           {log.dealId ? (
//             <div>
//               <div className="deal-id">{log.dealId}</div>
//               {log.dealName && (
//                 <div className="deal-name text-muted small">{log.dealName}</div>
//               )}
//             </div>
//           ) : (
//             <span className="text-muted">N/A</span>
//           )}
//         </td>
//         <td className="log-event">
//           {log.eventId ? (
//             <div>
//               <div className="event-id">{log.eventId}</div>
//               {log.eventSummary && (
//                 <div className="event-summary text-muted small">{log.eventSummary}</div>
//               )}
//             </div>
//           ) : (
//             <span className="text-muted">N/A</span>
//           )}
//         </td>
//         <td className="log-timestamp date-time-column">
//           <div className="date-time">
//             <div>{formatTimestamp(log.createdAt)}</div>
//             <div className="duration small text-muted">
//               <Clock size={12} className="me-1" />
//               {formatDuration(log.overallTiming.totalDuration)}
//             </div>
//           </div>
//         </td>
//         <td className="log-steps">
//           <div className="steps-info">
//             <div className="steps-count">
//               {log.executionSteps.length} steps
//             </div>
//             <div className="logs-count small text-muted">
//               {totalLogs} logs
//             </div>
//           </div>
//         </td>
//         <td className="log-status">
//           <div className="status-indicator">
//             <Badge bg={status.variant}>
//               {status.label}
//             </Badge>
//           </div>
//         </td>
//         <td className="log-actions actions-column">
//           <Button
//             ref={(el) => {
//               if (el && !tooltipTargets[detailKey]) {
//                 setTooltipTargets((prev) => ({ ...prev, [detailKey]: el }));
//               }
//             }}
//             variant="outline-primary"
//             size="sm"
//             onClick={() => handleLogClick(log)}
//             onMouseEnter={(e) => handleTooltipShow(detailKey, e.currentTarget)}
//             onMouseLeave={() => handleTooltipHide(detailKey)}
//             className="open-log-button"
//           >
//             <InfoCircle className="button-icon" />
//           </Button>
//           <CustomTooltip
//             show={tooltipShow[detailKey]}
//             target={tooltipTargets[detailKey]}
//             variant="primary"
//           >
//             Log Details anzeigen
//           </CustomTooltip>
//         </td>
//       </tr>
//     );
//   };

//   const renderMobileLogCard = (log) => {
//     const status = getOverallStatus(log);
//     const totalLogs = log.executionSteps.reduce((sum, step) => sum + step.logs.length, 0);

//     return (
//       <div key={log._id} className="log-mobile-card">
//         <div className="log-mobile-header">
//           <div className="log-mobile-title d-flex justify-content-between">
//             <div>
//               <Badge bg={status.variant} className="me-2">
//                 {status.label}
//               </Badge>
//               <span className="event-type">{log.triggerEventtype}</span>
//             </div>
//             <div className="log-mobile-timestamp">
//               {formatTimestamp(log.createdAt)}
//             </div>
//           </div>
//         </div>
//         <div className="log-mobile-content">
//           {log.dealId && (
//             <div className="log-mobile-deal">
//               <strong>Deal:</strong> {log.dealId}
//             </div>
//           )}
//           {log.eventId && (
//             <div className="log-mobile-event">
//               <strong>Event:</strong> {log.eventId}
//             </div>
//           )}
//           <div className="log-mobile-steps">
//             <strong>Steps:</strong> {log.executionSteps.length} steps, {totalLogs} logs
//           </div>
//           <div className="log-mobile-duration">
//             <strong>Duration:</strong> {formatDuration(log.overallTiming.totalDuration)}
//           </div>
//           <div className="log-mobile-actions mt-2">
//             <Button
//               variant="outline-primary"
//               size="sm"
//               onClick={() => handleLogClick(log)}
//               className="me-2"
//             >
//               <InfoCircle className="me-1" />
//               Details
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderStepDetails = (step, logId, stepIndex) => {
//     const isExpanded = expandedSteps[`${logId}-${stepIndex}`];
    
//     return (
//       <div key={step.sequence} className="step-details mb-3">
//         <div 
//           className="step-header p-3 bg-light rounded d-flex justify-content-between align-items-center"
//           onClick={() => toggleStepExpansion(logId, stepIndex)}
//           style={{ cursor: 'pointer' }}
//         >
//           <div>
//             <strong>Step {step.sequence}: {step.repo}</strong>
//             {step.flow && <span className="text-muted ms-2">({step.flow})</span>}
//           </div>
//           <div className="d-flex align-items-center">
//             <span className="me-3">
//               <Clock size={14} className="me-1" />
//               {formatDuration(step.duration)}
//             </span>
//             {isExpanded ? <ChevronUp /> : <ChevronDown />}
//           </div>
//         </div>
        
//         {isExpanded && (
//           <div className="step-content p-3 border rounded mt-2">
//             <div className="row mb-3">
//               <div className="col-md-6">
//                 <div className="detail-field mb-2">
//                   <strong>Start:</strong> {formatTimestamp(step.startTime)}
//                 </div>
//                 <div className="detail-field mb-2">
//                   <strong>End:</strong> {formatTimestamp(step.endTime)}
//                 </div>
//               </div>
//               <div className="col-md-6">
//                 <div className="detail-field mb-2">
//                   <strong>Duration:</strong> {formatDuration(step.duration)}
//                 </div>
//                 <div className="detail-field mb-2">
//                   <strong>Logs:</strong> {step.logs.length} entries
//                 </div>
//               </div>
//             </div>
            
//             <div className="step-logs">
//               <h6>Log Entries:</h6>
//               <div className="table-responsive">
//                 <Table size="sm" className="mb-0">
//                   <thead>
//                     <tr>
//                       <th width="50">#</th>
//                       <th width="100">Level</th>
//                       <th width="150">Time</th>
//                       <th>Message</th>
//                       <th width="150">Function</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {step.logs.map((logEntry) => (
//                       <tr key={logEntry.sequence}>
//                         <td>{logEntry.sequence}</td>
//                         <td>{formatLogLevel(logEntry.level)}</td>
//                         <td className="small">
//                           {formatTimestamp(logEntry.timestamp).split(' ')[1]}
//                         </td>
//                         <td>{logEntry.message}</td>
//                         <td className="small text-muted">
//                           {logEntry.functionName || 'N/A'}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </Table>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Main Render
//   if (loading) {
//     return (
//       <DashboardLayout handleLogout={handleLogout} setAuth={setAuth}>
//         <DashboardLoader message={loadingMessage} />
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout
//       handleLogout={handleLogout}
//       setAuth={setAuth}
//       onRefresh={handleRefresh}
//     >
//       <div className="user-assigned-dashboard logger-dashboard">
//         {/* Header */}
//         {!loading && (
//           <div className="transparent-header-container">
//             <div className="header-welcome-content">
//               <h1 className="dashboard-main-title">
//                 Willkommen, {user?.Name || "Benutzer"}!
//               </h1>
//               <p className="dashboard-subtitle">
//                 Execution Logs Monitoring
//               </p>
//             </div>
//             <div className="header-search-box">
//               <SearchBox
//                 value={searchTerm}
//                 onChange={handleSearchChange}
//                 placeholder="Nach Deal ID, Event, Trigger suchen..."
//               />
//             </div>
//           </div>
//         )}

//         {/* Messages */}
//         {success && (
//           <Alert variant="success" className="dashboard-alert" onClose={() => setSuccess(null)} dismissible>
//             {success}
//           </Alert>
//         )}
//         {error && (
//           <Alert variant="danger" className="dashboard-alert" onClose={() => setError(null)} dismissible>
//             {error}
//           </Alert>
//         )}

//         {/* Logs Container with Tabs */}
//         <div className="events-container logs-container">
//           <div className="chrome-tabs-container">
//             <div className="chrome-tabs">
//               {EVENT_TYPES.map((eventType) => (
//                 <button
//                   key={eventType}
//                   className={`chrome-tab ${activeTab === eventType ? "active" : ""}`}
//                   onClick={() => setActiveTab(eventType)}
//                 >
//                   {eventType}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="tab-content">
//             <div className="summary-box mb-4">
//               <h4>
//                 {activeTab === "All logs" 
//                   ? "Alle Logs" 
//                   : `Logs für "${activeTab}"`}
//               </h4>
//               <p>
//                 {activeTab === "All logs"
//                   ? "Übersicht aller System-Logs und Ausführungen."
//                   : `Logs spezifisch für das Event "${activeTab}".`}
//               </p>
//             </div>

//             <h2 className="assigned-events-heading">
//               {activeTab === "All logs" ? "System Execution Logs" : `Logs - ${activeTab}`}
//             </h2>

//             {totalFilteredLogs === 0 && !searchTerm ? (
//               <div className="empty-state">
//                 <div className="empty-state-icon">
//                   <FileCode size={48} />
//                 </div>
//                 <p className="empty-state-message">
//                   {activeTab === "All logs"
//                     ? "Keine Logs gefunden."
//                     : `Keine Logs für "${activeTab}" gefunden.`}
//                 </p>
//               </div>
//             ) : totalFilteredLogs === 0 && searchTerm ? (
//               <div className="empty-state">
//                 <div className="empty-state-icon">
//                   <Search size={48} />
//                 </div>
//                 <p className="empty-state-message">
//                   Keine Logs entsprechen Ihrer Suche.
//                 </p>
//               </div>
//             ) : (
//               <div className="event-calendar-card">
//                 <div className="calendar-header">
//                   <div className="header-content">
//                     <div className="title-with-icon">
//                       <h5 className="calendar-title">
//                         {activeTab === "All logs" ? "Alle Logs" : activeTab}
//                       </h5>
//                     </div>
//                     <span className="logs-count">
//                       <span className="count-number">{totalFilteredLogs}</span>
//                       <span className="count-label">
//                         {totalFilteredLogs === 1 ? " Log" : " Logs"}
//                       </span>
//                     </span>
//                   </div>
//                 </div>
                
//                 <div className="calendar-content">
//                   {filteredLogs.length > 0 ? (
//                     <>
//                       <div className="table-responsive d-none d-md-block">
//                         <Table className="logs-table">
//                           <thead>
//                             <tr>
//                               <th>Trigger / Event</th>
//                               <th>Deal</th>
//                               <th>Calendar Event</th>
//                               <th>Timestamp / Duration</th>
//                               <th>Steps</th>
//                               <th>Status</th>
//                               <th>Aktion</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {filteredLogs.map((log, index) =>
//                               renderLogRow(log, index)
//                             )}
//                           </tbody>
//                         </Table>
//                       </div>
//                       <div className="log-cards-container d-md-none">
//                         {filteredLogs.map((log) =>
//                           renderMobileLogCard(log)
//                         )}
//                       </div>
//                     </>
//                   ) : (
//                     <div className="no-logs-message">
//                       Keine Logs gefunden.
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Log Details Modal */}
//         <Modal 
//           show={showLogModal} 
//           onHide={() => setShowLogModal(false)}
//           size="xl"
//           centered
//           scrollable
//         >
//           <Modal.Header closeButton className="bg-light">
//             <Modal.Title>
//               <div className="d-flex align-items-center">
//                 <InfoCircle className="me-2" />
//                 Execution Log Details
//               </div>
//             </Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             {selectedLog && (
//               <>
//                 {/* Overview Section */}
//                 <div className="overview-section mb-4 p-3 bg-light rounded">
//                   <h5 className="mb-3">Übersicht</h5>
//                   <div className="row">
//                     <div className="col-md-6">
//                       <div className="detail-field mb-2">
//                         <strong>Request ID:</strong> {selectedLog._id}
//                       </div>
//                       <div className="detail-field mb-2">
//                         <strong>Initiated By:</strong> {selectedLog.requestInitiatedBy || "N/A"}
//                       </div>
//                       <div className="detail-field mb-2">
//                         <strong>Trigger:</strong> 
//                         <Badge bg="secondary" className="ms-2">
//                           {selectedLog.triggerEventsource} → {selectedLog.triggerEventtype}
//                         </Badge>
//                       </div>
//                       <div className="detail-field mb-2">
//                         <strong>Trigger Time:</strong> {formatTimestamp(selectedLog.triggerEventtimestamp)}
//                       </div>
//                     </div>
//                     <div className="col-md-6">
//                       <div className="detail-field mb-2">
//                         <strong>Deal:</strong> 
//                         {selectedLog.dealId ? (
//                           <div className="mt-1">
//                             <Badge bg="info" className="me-2">{selectedLog.dealId}</Badge>
//                             {selectedLog.dealName && <span>{selectedLog.dealName}</span>}
//                           </div>
//                         ) : "N/A"}
//                       </div>
//                       <div className="detail-field mb-2">
//                         <strong>Calendar Event:</strong> 
//                         {selectedLog.eventId ? (
//                           <div className="mt-1">
//                             <Badge bg="success" className="me-2">{selectedLog.eventId}</Badge>
//                             {selectedLog.eventSummary && <span>{selectedLog.eventSummary}</span>}
//                           </div>
//                         ) : "N/A"}
//                       </div>
//                       <div className="detail-field mb-2">
//                         <strong>Duration:</strong> 
//                         <Badge bg="dark" className="ms-2">
//                           {formatDuration(selectedLog.overallTiming.totalDuration)}
//                         </Badge>
//                       </div>
//                       <div className="detail-field mb-2">
//                         <strong>Status:</strong> 
//                         <Badge bg={getOverallStatus(selectedLog).variant} className="ms-2">
//                           {getOverallStatus(selectedLog).label}
//                         </Badge>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Timeline Section */}
//                 <div className="timeline-section mb-4">
//                   <h5 className="mb-3">Execution Timeline</h5>
//                   <div className="timeline-visualization">
//                     {selectedLog.executionSteps.map((step, index) => (
//                       <div key={step.sequence} className="timeline-step mb-2">
//                         <div className="d-flex align-items-center">
//                           <div className="timeline-marker me-3">
//                             <div className="step-number">{step.sequence}</div>
//                           </div>
//                           <div className="flex-grow-1">
//                             <div className="d-flex justify-content-between align-items-center mb-1">
//                               <div>
//                                 <strong>{step.repo}</strong>
//                                 {step.flow && <span className="text-muted ms-2">({step.flow})</span>}
//                               </div>
//                               <div className="text-end">
//                                 <div className="duration">{formatDuration(step.duration)}</div>
//                                 <div className="timestamp small text-muted">
//                                   {formatTimestamp(step.startTime).split(' ')[1]}
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="progress" style={{ height: '8px' }}>
//                               <div 
//                                 className="progress-bar bg-primary" 
//                                 style={{ width: `${Math.min(step.duration / 1000 * 100, 100)}%` }}
//                               />
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Execution Steps Section */}
//                 <div className="execution-steps-section">
//                   <h5 className="mb-3">Execution Steps ({selectedLog.executionSteps.length})</h5>
//                   {selectedLog.executionSteps.map((step, index) => 
//                     renderStepDetails(step, selectedLog._id, index)
//                   )}
//                 </div>
//               </>
//             )}
//           </Modal.Body>
//           <Modal.Footer className="bg-light">
//             <div className="d-flex justify-content-between w-100">
//               <Button variant="secondary" onClick={() => setShowLogModal(false)}>
//                 Schließen
//               </Button>
//               <div>
//                 <Button 
//                   variant="outline-dark" 
//                   onClick={() => {
//                     const logText = `
// Event: ${selectedLog.triggerEventtype}
// Deal: ${selectedLog.dealId || 'N/A'}
// Status: ${getOverallStatus(selectedLog).label}
// Duration: ${formatDuration(selectedLog.overallTiming.totalDuration)}
// Steps: ${selectedLog.executionSteps.length}
//                     `.trim();
//                     navigator.clipboard.writeText(logText);
//                     setSuccess("Log-Zusammenfassung kopiert!");
//                     setTimeout(() => setSuccess(null), 3000);
//                   }}
//                   className="me-2"
//                 >
//                   Zusammenfassung kopieren
//                 </Button>
//                 <Button 
//                   variant="primary" 
//                   onClick={() => {
//                     navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
//                     setSuccess("Komplette Log-Daten kopiert!");
//                     setTimeout(() => setSuccess(null), 3000);
//                   }}
//                 >
//                   JSON kopieren
//                 </Button>
//               </div>
//             </div>
//           </Modal.Footer>
//         </Modal>
//       </div>
//     </DashboardLayout>
//   );
// }

// export default LoggerDashboard;


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

// Generate dummy logs based on the new structure
const generateDummyLogs = () => {
  const logs = [];
  const repos = ["hubspot-deal-sync", "sync-google-calendar", "notifications-service", "invoicing-service"];
  const eventTypes = EVENT_TYPES.slice(1); // Remove "All logs"
  const triggerSources = ["hubspot", "google-calendar", "manual", "api-call"];
  const initiatedByOptions = ["hubspot-webhook", "google-calendar-webhook", "admin-dashboard", null];
  
  for (let i = 0; i < 30; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const hasError = Math.random() > 0.85;
    const hasDeal = Math.random() > 0.3;
    const hasEvent = Math.random() > 0.4;
    const stepCount = Math.floor(Math.random() * 4) + 1; // 1-4 steps
    
    // Generate execution steps
    const executionSteps = [];
    let stepStartTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    
    for (let j = 0; j < stepCount; j++) {
      const stepDuration = Math.floor(Math.random() * 800) + 100; // 100-900ms
      const stepEndTime = new Date(stepStartTime.getTime() + stepDuration);
      const logCount = Math.floor(Math.random() * 3) + 2; // 2-4 logs per step
      
      const stepLogs = [];
      for (let k = 0; k < logCount; k++) {
        const level = Math.random() > 0.9 ? "error" : 
                     Math.random() > 0.8 ? "warning" : 
                     Math.random() > 0.7 ? "debug" : 
                     Math.random() > 0.6 ? "success" : "info";
        
        const messages = {
          info: [
            "Processing input data",
            "Validation completed successfully",
            "Fetching external data",
            "Transforming data format",
          ],
          error: [
            "Failed to connect to external service",
            "Validation error: Invalid input format",
            "Timeout while waiting for response",
            "Database connection failed",
          ],
          warning: [
            "Retrying operation after failure",
            "Performance degradation detected",
            "Using deprecated API endpoint",
          ],
          success: [
            "Operation completed successfully",
            "Data persisted successfully",
            "Webhook sent successfully",
          ],
          debug: [
            "Memory usage: 124MB",
            "Processing time: 245ms",
            "Cache hit ratio: 0.78",
          ],
        };
        
        const messageArray = messages[level] || messages.info;
        const message = messageArray[Math.floor(Math.random() * messageArray.length)];
        
        stepLogs.push({
          sequence: k + 1,
          level,
          message,
          functionName: Math.random() > 0.3 ? `function_${String.fromCharCode(65 + k)}` : null,
          file: Math.random() > 0.4 ? `service/${repos[j % repos.length]}.js` : null,
          timestamp: new Date(stepStartTime.getTime() + (k * (stepDuration / logCount))),
        });
      }
      
      // Add error log if hasError and this is the last step
      if (hasError && j === stepCount - 1) {
        stepLogs.push({
          sequence: stepLogs.length + 1,
          level: "error",
          message: "Critical error: Operation failed",
          functionName: "handleError",
          file: "errorHandler.js",
          timestamp: stepEndTime,
        });
      }
      
      executionSteps.push({
        sequence: j + 1,
        repo: repos[j % repos.length],
        flow: Math.random() > 0.2 ? `flow-${j + 1}` : null,
        input: { data: "sample-input", timestamp: stepStartTime.toISOString() },
        startTime: stepStartTime,
        endTime: stepEndTime,
        duration: stepDuration,
        logs: stepLogs,
      });
      
      stepStartTime = new Date(stepEndTime.getTime() + 50); // Small gap between steps
    }
    
    // Calculate overall timing
    const overallStartTime = executionSteps[0].startTime;
    const overallEndTime = executionSteps[executionSteps.length - 1].endTime;
    const totalDuration = overallEndTime - overallStartTime;
    
    const log = {
      _id: `log-${i + 1}`,
      requestInitiatedBy: initiatedByOptions[Math.floor(Math.random() * initiatedByOptions.length)],
      triggerEventsource: triggerSources[Math.floor(Math.random() * triggerSources.length)],
      triggerEventtype: eventType,
      triggerEventtimestamp: overallStartTime,
      
      dealId: hasDeal ? `HS-${Math.floor(Math.random() * 90000) + 10000}` : null,
      dealName: hasDeal ? `Deal ${["Enterprise", "Standard", "Premium"][Math.floor(Math.random() * 3)]} Package` : null,
      eventId: hasEvent ? `EVENT-${Math.floor(Math.random() * 1000)}` : null,
      eventSummary: hasEvent ? `${eventType} - ${["Scheduled", "Completed", "Cancelled"][Math.floor(Math.random() * 3)]}` : null,
      
      executionSteps,
      overallTiming: {
        startTime: overallStartTime,
        endTime: overallEndTime,
        totalDuration,
      },
      
      createdAt: overallStartTime,
      updatedAt: overallEndTime,
    };
    
    logs.push(log);
  }
  
  // Sort by creation time (newest first)
  logs.sort((a, b) => b.createdAt - a.createdAt);
  
  return logs;
};

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
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Format log level badge
const formatLogLevel = (level) => {
  const variant = LOG_LEVELS[level] || "secondary";
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  
  return <Badge bg={variant}>{label}</Badge>;
};

// Get overall status from logs
const getOverallStatus = (log) => {
  const hasError = log.executionSteps.some(step => 
    step.logs.some(log => log.level === "error")
  );
  
  const hasWarning = log.executionSteps.some(step =>
    step.logs.some(log => log.level === "warning")
  );
  
  if (hasError) return { level: "error", label: "Failed", variant: "danger" };
  if (hasWarning) return { level: "warning", label: "Warning", variant: "warning" };
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

  // Data Loading
  const loadLogs = () => {
    const generatedLogs = generateDummyLogs();
    setLogs(generatedLogs);
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

      // Load logs
      setLoadingMessage("Logs werden generiert...");
      loadLogs();

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
    loadLogs();
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
        filtered = filtered.filter(log => log.triggerEventtype === activeTab);
      }
      
      // Apply search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.dealId?.toLowerCase().includes(searchLower) ||
            log.dealName?.toLowerCase().includes(searchLower) ||
            log.eventId?.toLowerCase().includes(searchLower) ||
            log.eventSummary?.toLowerCase().includes(searchLower) ||
            log.requestInitiatedBy?.toLowerCase().includes(searchLower) ||
            log.triggerEventsource.toLowerCase().includes(searchLower) ||
            log.triggerEventtype.toLowerCase().includes(searchLower)
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

  // Render Helper Functions
  const renderLogRow = (log, index) => {
    const detailKey = `detail-${log._id}-${index}`;
    const status = getOverallStatus(log);
    const totalLogs = log.executionSteps.reduce((sum, step) => sum + step.logs.length, 0);

    return (
      <tr key={log._id} className="log-row">
        <td className="log-id">
          <div className="trigger-info" title={`${log.triggerEventsource} → ${log.triggerEventtype}`}>
            <div className="request-source">
              {log.requestInitiatedBy || log.triggerEventsource}
            </div>
            <div className="event-type text-muted small">
              {log.triggerEventtype}
            </div>
          </div>
        </td>
        <td className="log-deal">
          {log.dealId ? (
            <div>
              <div className="deal-id">{log.dealId}</div>
              {log.dealName && (
                <div className="deal-name text-muted small">{log.dealName}</div>
              )}
            </div>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </td>
        <td className="log-event">
          {log.eventId ? (
            <div>
              <div className="event-id">{log.eventId}</div>
              {log.eventSummary && (
                <div className="event-summary text-muted small">{log.eventSummary}</div>
              )}
            </div>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </td>
        <td className="log-timestamp date-time-column">
          <div className="date-time">
            <div>{formatTimestamp(log.createdAt)}</div>
            <div className="duration small text-muted">
              <Clock size={12} className="me-1" />
              {formatDuration(log.overallTiming.totalDuration)}
            </div>
          </div>
        </td>
        <td className="log-steps">
          <div className="steps-info">
            <div className="steps-count">
              {log.executionSteps.length} steps
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
          >
            <InfoCircle className="button-icon" />
          </Button>
          <CustomTooltip
            show={tooltipShow[detailKey]}
            target={tooltipTargets[detailKey]}
            variant="primary"
          >
            Log Details anzeigen
          </CustomTooltip>
        </td>
      </tr>
    );
  };

  const renderMobileLogCard = (log) => {
    const status = getOverallStatus(log);
    const totalLogs = log.executionSteps.reduce((sum, step) => sum + step.logs.length, 0);

    return (
      <div key={log._id} className="log-mobile-card">
        <div className="log-mobile-header">
          <div className="log-mobile-title d-flex justify-content-between">
            <div>
              <Badge bg={status.variant} className="me-2">
                {status.label}
              </Badge>
              <span className="event-type">{log.triggerEventtype}</span>
            </div>
            <div className="log-mobile-timestamp">
              {formatTimestamp(log.createdAt)}
            </div>
          </div>
        </div>
        <div className="log-mobile-content">
          {log.dealId && (
            <div className="log-mobile-deal">
              <strong>Deal:</strong> {log.dealId}
            </div>
          )}
          {log.eventId && (
            <div className="log-mobile-event">
              <strong>Event:</strong> {log.eventId}
            </div>
          )}
          <div className="log-mobile-steps">
            <strong>Steps:</strong> {log.executionSteps.length} steps, {totalLogs} logs
          </div>
          <div className="log-mobile-duration">
            <strong>Duration:</strong> {formatDuration(log.overallTiming.totalDuration)}
          </div>
          <div className="log-mobile-actions mt-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleLogClick(log)}
              className="me-2"
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
    
    return (
      <div key={step.sequence} className="step-details mb-3">
        <div 
          className="step-header p-3 bg-light rounded d-flex justify-content-between align-items-center"
          onClick={() => toggleStepExpansion(logId, stepIndex)}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <strong>Step {step.sequence}: {step.repo}</strong>
            {step.flow && <span className="text-muted ms-2">({step.flow})</span>}
          </div>
          <div className="d-flex align-items-center">
            <span className="me-3">
              <Clock size={14} className="me-1" />
              {formatDuration(step.duration)}
            </span>
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
                <div className="detail-field mb-2">
                  <strong>Duration:</strong> {formatDuration(step.duration)}
                </div>
                <div className="detail-field mb-2">
                  <strong>Logs:</strong> {step.logs.length} entries
                </div>
              </div>
            </div>
            
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
                    {step.logs.map((logEntry) => (
                      <tr key={logEntry.sequence}>
                        <td>{logEntry.sequence}</td>
                        <td>{formatLogLevel(logEntry.level)}</td>
                        <td className="small">
                          {formatTimestamp(logEntry.timestamp).split(' ')[1]}
                        </td>
                        <td>{logEntry.message}</td>
                        <td className="small text-muted">
                          {logEntry.functionName || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
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
                    : `Keine Logs für "${activeTab}" gefunden.`}
                </p>
              </div>
            ) : totalFilteredLogs === 0 && searchTerm ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Search size={48} />
                </div>
                <p className="empty-state-message">
                  Keine Logs entsprechen Ihrer Suche.
                </p>
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
                  {filteredLogs.length > 0 ? (
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
                          {selectedLog.triggerEventsource} → {selectedLog.triggerEventtype}
                        </Badge>
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Trigger Time:</strong> {formatTimestamp(selectedLog.triggerEventtimestamp)}
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
                        <Badge bg="dark" className="ms-2">
                          {formatDuration(selectedLog.overallTiming.totalDuration)}
                        </Badge>
                      </div>
                      <div className="detail-field mb-2">
                        <strong>Status:</strong> 
                        <Badge bg={getOverallStatus(selectedLog).variant} className="ms-2">
                          {getOverallStatus(selectedLog).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="timeline-section mb-4">
                  <h5 className="mb-3">Execution Timeline</h5>
                  <div className="timeline-visualization">
                    {selectedLog.executionSteps.map((step, index) => (
                      <div key={step.sequence} className="timeline-step mb-2">
                        <div className="d-flex align-items-center">
                          <div className="timeline-marker me-3">
                            <div className="step-number">{step.sequence}</div>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div>
                                <strong>{step.repo}</strong>
                                {step.flow && <span className="text-muted ms-2">({step.flow})</span>}
                              </div>
                              <div className="text-end">
                                <div className="duration">{formatDuration(step.duration)}</div>
                                <div className="timestamp small text-muted">
                                  {formatTimestamp(step.startTime).split(' ')[1]}
                                </div>
                              </div>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                style={{ width: `${Math.min(step.duration / 1000 * 100, 100)}%` }}
                              />
                            </div>
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
                    const logText = `
Event: ${selectedLog.triggerEventtype}
Deal: ${selectedLog.dealId || 'N/A'}
Status: ${getOverallStatus(selectedLog).label}
Duration: ${formatDuration(selectedLog.overallTiming.totalDuration)}
Steps: ${selectedLog.executionSteps.length}
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