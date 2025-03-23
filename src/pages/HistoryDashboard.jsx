import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Badge, Table, Tabs, Tab, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Calendar2Check, ArrowClockwise, Save, ExclamationTriangle } from 'react-bootstrap-icons';
import DashboardLayout from '../components/DashboardLayout';
import DashboardLoader from '../components/DashboardLoader';
import MockDataDebugPanel from '../components/MockDataDebugPanel';
import api from '../utils/api';
import { mockHistoryData } from '../utils/mockData'; // Import the mock data directly

function HistoryDashboard({ setAuth }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalHistoryEvents, setTotalHistoryEvents] = useState(0);
  const [currentEvents, setCurrentEvents] = useState(0);
  const [eventFlowStats, setEventFlowStats] = useState([]);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [updatingRecord, setUpdatingRecord] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  // Use the mock data in development mode
  useEffect(() => {
    // Always fetch fresh data, don't use session storage
    fetchHistory();
    fetchCurrentEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentEvents = async () => {
    setLoadingCurrent(true);
    try {
      const response = await api.get('/api/unassignedEvents');
      const events = response.data.events || [];
      setCurrentEvents(events.length);
    } catch (err) {
      console.error('Error fetching current events:', err);
      // Set a default value from mock data for current events
      setCurrentEvents(mockHistoryData.history[0]?.count || 5);
    } finally {
      setLoadingCurrent(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      console.log("Fetching history data...");
      // Request analysis data too
      const res = await api.get('/api/unassignedEventsHistory?analysis=true');
      console.log("Response received:", res.data);
      
      if (res.data && Array.isArray(res.data.history)) {
        // Process API data as usual
        processHistoryData(res.data.history);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      // Use mock data instead when API fails
      console.log("Using mock data instead:", mockHistoryData);
      processHistoryData(mockHistoryData.history);
      // Set a small warning that we're in demo mode
      setError('Daten werden im Demo-Modus angezeigt');
    } finally {
      setLoading(false);
    }
  };

  // Process history data regardless of source (API or mock)
  const processHistoryData = (historyData) => {
    if (!Array.isArray(historyData)) {
      console.error("History data is not an array:", historyData);
      return;
    }

    // Ensure all numeric fields are properly cast as numbers
    const processedHistory = historyData.map(entry => ({
      date: entry.date,
      count: Number(entry.count) || 0,
      klavier_count: Number(entry.klavier_count) || 0,
      geigen_count: Number(entry.geigen_count) || 0,
      weihnachts_count: Number(entry.weihnachts_count) || 0,
      nikolaus_count: Number(entry.nikolaus_count) || 0,
      laternenumzug_count: Number(entry.laternenumzug_count) || 0,
      puppentheater_count: Number(entry.puppentheater_count) || 0
    }));
    
    // Sort history by date descending (newest first)
    processedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setHistory(processedHistory);
    
    // Calculate total events for the 7-day period
    const total = processedHistory.reduce((sum, entry) => sum + entry.count, 0);
    setTotalHistoryEvents(total);
    
    // Calculate event flow statistics
    calculateEventFlowStats(processedHistory);
  };

  // New function to create a history record with current data
  const createHistoryRecord = async () => {
    setUpdatingRecord(true);
    try {
      // Call a new endpoint to create a history record with current data
      const res = await api.post('/api/unassignedEventsHistory/record');
      
      if (res.data && res.data.success) {
        setUpdateSuccess(true);
        // Reset success message after 3 seconds
        setTimeout(() => setUpdateSuccess(false), 3000);
        
        // Refresh data
        fetchHistory();
        fetchCurrentEvents();
      } else {
        throw new Error('Failed to create history record');
      }
    } catch (err) {
      console.error('Error creating history record:', err);
      
      // In demo mode, simulate a successful record creation
      // Create a new record based on current events count
      const newRecord = {
        date: new Date().toISOString().split('T')[0],
        count: currentEvents,
        klavier_count: Math.floor(currentEvents / 4),
        geigen_count: Math.floor(currentEvents / 5),
        weihnachts_count: Math.floor(currentEvents / 6),
        nikolaus_count: Math.floor(currentEvents / 7),
        laternenumzug_count: Math.floor(currentEvents / 8),
        puppentheater_count: 0
      };
      
      // Add this new record to the beginning of the history
      const updatedHistory = [newRecord, ...history];
      processHistoryData(updatedHistory);
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      setError('Simulierte Aufzeichnung im Demo-Modus');
    } finally {
      setUpdatingRecord(false);
    }
  };

  // Calculate statistics about event flow (added/assigned events)
  const calculateEventFlowStats = (historyData) => {
    if (!historyData || historyData.length <= 1) {
      setEventFlowStats([]);
      return;
    }

    const stats = [];
    
    // Process each day except the last one in the array (can't calculate change for oldest day)
    for (let i = 0; i < historyData.length - 1; i++) {
      const currentDay = historyData[i];
      const prevDay = historyData[i + 1];
      const currentDate = new Date(currentDay.date);
      
      // Calculate changes
      const countDiff = currentDay.count - prevDay.count;
      const newlyAdded = countDiff > 0 ? countDiff : 0;
      const newlyAssigned = countDiff < 0 ? Math.abs(countDiff) : 0;
      
      stats.push({
        date: currentDay.date,
        weekday: currentDate.toLocaleDateString('de-DE', {weekday: 'long'}),
        totalCount: currentDay.count,
        newlyAdded,
        newlyAssigned,
        noChange: newlyAdded === 0 && newlyAssigned === 0,
        prevDayCount: prevDay.count
      });
    }
    
    // Add the oldest day with only count data
    const oldestDay = historyData[historyData.length - 1];
    const oldestDate = new Date(oldestDay.date);
    stats.push({
      date: oldestDay.date,
      weekday: oldestDate.toLocaleDateString('de-DE', {weekday: 'long'}),
      totalCount: oldestDay.count,
      newlyAdded: null, // Can't calculate for oldest day
      newlyAssigned: null,
      noChange: false,
      prevDayCount: null
    });
    
    setEventFlowStats(stats);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Check if we have detailed calendar breakdown data with valid values
  const hasCalendarBreakdown = useMemo(() => 
    history.length > 0 && 
    history.some(entry => 
      Number(entry.klavier_count) > 0 || 
      Number(entry.geigen_count) > 0 ||
      Number(entry.weihnachts_count) > 0 ||
      Number(entry.nikolaus_count) > 0 ||
      Number(entry.laternenumzug_count) > 0 ||
      Number(entry.puppentheater_count) > 0
    )
  , [history]);

  const mostRecentDate = useMemo(() => 
    history.length > 0 ? 
    new Date(history[0].date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : 'Unbekannt'
  , [history]);
  
  const handleRefresh = () => {
    fetchHistory();
    fetchCurrentEvents();
  };

  if (loading) {
    return (
      <DashboardLayout 
        setAuth={setAuth}
        pageTitle="Verlauf der unzugewiesenen Veranstaltungen"
      >
        <DashboardLoader message="Verlauf wird geladen..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      setAuth={setAuth} 
      onRefresh={handleRefresh}
      containerClass="container"
    >
      <div className="history-dashboard">
        {/* Header section with vertically centered heading */}
        <div className="transparent-header-container">
          <h1 className="dashboard-main-title">Verlauf der unzugewiesenen Veranstaltungen</h1>
        </div>
        
        {/* DEBUG: Display mock data when in development mode */}
        <MockDataDebugPanel dataType="history" />
        
        {/* Stats Cards */}
        <div className="stats-cards-container mb-4">
          <div className="row">
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="stats-card history-card">
                <div className="stats-card-icon current-events-icon">
                  <Calendar2Check size={24} />
                </div>
                <div className="stats-card-content">
                  <h6 className="stats-card-title">Aktuelle unzugewiesene Veranstaltungen</h6>
                  <div className="stats-card-value">
                    <Badge bg="danger" className="stats-card-badge">
                      {loadingCurrent ? '...' : currentEvents}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="stats-card history-card">
                <div className="stats-card-icon history-icon">
                  <Calendar2Check size={24} />
                </div>
                <div className="stats-card-content">
                  <h6 className="stats-card-title">7-Tage Historie</h6>
                  <div className="stats-card-value">
                    <Badge bg="primary" className="stats-card-badge">
                      {totalHistoryEvents}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="stats-card history-card">
                <div className="stats-card-content">
                  <h6 className="stats-card-title">Letzte Aufzeichnung</h6>
                  <p className="stats-card-value date-value">{mostRecentDate}</p>
                </div>
                <Button 
                  variant="success" 
                  className="record-button"
                  onClick={createHistoryRecord}
                  disabled={updatingRecord}
                >
                  <Save className="me-2" />
                  {updatingRecord ? 'Aufzeichne...' : 'Jetzt aufzeichnen'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* View Buttons */}
        <div className="d-flex mb-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/unassigned-events')}
            className="me-2"
          >
            Zurück zu unzugewiesenen Veranstaltungen
          </Button>
          
          <Button 
            variant="outline-primary" 
            onClick={handleRefresh}
            className="ms-auto"
          >
            <ArrowClockwise className="me-2" />
            Aktualisieren
          </Button>
        </div>

        {updateSuccess && (
          <Alert variant="success" className="dashboard-alert mb-4">
            <strong>Erfolg!</strong> Die aktuelle Anzahl unzugewiesener Veranstaltungen wurde erfolgreich aufgezeichnet.
          </Alert>
        )}

        {currentEvents > 0 && history.length > 0 && Math.abs(currentEvents - history[0].count) > 3 && (
          <Alert variant="warning" className="dashboard-alert mb-4">
            <div className="d-flex align-items-center">
              <ExclamationTriangle className="me-3 text-warning" size={24} />
              <div>
                <strong>Achtung!</strong> Die aktuelle Anzahl ({currentEvents}) weicht erheblich von der letzten historischen Aufzeichnung ({history[0].count}) ab. 
                <div className="text-danger fw-bold mt-1">Differenz: {Math.abs(currentEvents - history[0].count)} Ereignisse</div>
                <div className="mt-2">
                  <p className="mb-1">Mögliche Ursachen:</p>
                  <ul className="mb-2">
                    <li>Seit der letzten Aufzeichnung ({mostRecentDate}) wurden neue Veranstaltungen hinzugefügt</li>
                    <li>Künstler wurden zugewiesen und Veranstaltungen wurden gelöst</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="text-end mt-2">
              <Button variant="success" size="sm" onClick={createHistoryRecord} disabled={updatingRecord}>
                <Save className="me-1" />
                {updatingRecord ? 'Aufzeichne...' : 'Jetzt aktuellen Stand aufzeichnen'}
              </Button>
            </div>
          </Alert>
        )}

        {error ? (
          <Alert variant="info" className="dashboard-alert mb-4">
            <strong>Hinweis:</strong> {error}
          </Alert>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar2Check size={48} />
            </div>
            <h4>Keine Verlaufsdaten gefunden</h4>
            <p>Es sind noch keine historischen Daten verfügbar. Klicken Sie auf "Jetzt aufzeichnen", um den aktuellen Stand zu speichern.</p>
            <Button 
              variant="primary" 
              onClick={createHistoryRecord}
              disabled={updatingRecord}
            >
              <Save className="me-2" />
              {updatingRecord ? 'Aufzeichne...' : 'Jetzt aufzeichnen'}
            </Button>
          </div>
        ) : (
          <div className="history-card main-history-card">
            <Tabs 
              defaultActiveKey="eventFlow" 
              id="history-tabs"
              className="mb-0 history-tabs"
            >
              {/* Event Flow Tab */}
              <Tab eventKey="eventFlow" title="Ereignisfluss">
                <div className="tab-content-container">
                  <div className="table-responsive">
                    <Table className="history-table mb-0">
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th className="text-center">Wochentag</th>
                          <th className="text-center">Unzugewiesene Veranstaltungen</th>
                          <th className="text-center">Neu hinzugefügt</th>
                          <th className="text-center">Zugewiesen/Gelöst</th>
                          <th className="text-center">Änderung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventFlowStats.map((day, index) => (
                          <tr key={index}>
                            <td>{formatDate(day.date)}</td>
                            <td className="text-center">{day.weekday}</td>
                            <td className="text-center">
                              <Badge 
                                bg={day.totalCount > 5 ? "danger" : day.totalCount > 0 ? "warning" : "success"}
                                className="enhanced-badge capsule-badge"
                              >
                                {day.totalCount}
                              </Badge>
                            </td>
                            <td className="text-center">
                              {day.newlyAdded !== null ? (
                                <Badge 
                                  bg={day.newlyAdded > 0 ? "danger" : "secondary"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  +{day.newlyAdded}
                                </Badge>
                              ) : "—"}
                            </td>
                            <td className="text-center">
                              {day.newlyAssigned !== null ? (
                                <Badge 
                                  bg={day.newlyAssigned > 0 ? "success" : "secondary"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {day.newlyAssigned > 0 ? `-${day.newlyAssigned}` : '0'}
                                </Badge>
                              ) : "—"}
                            </td>
                            <td className="text-center">
                              {day.prevDayCount !== null ? (
                                <div className="d-flex justify-content-center align-items-center">
                                  {day.noChange ? (
                                    <Badge bg="secondary" className="enhanced-badge capsule-badge">Keine Änderung</Badge>
                                  ) : (
                                    <>
                                      <span className="me-2 trend-indicator">
                                        {day.totalCount > day.prevDayCount ? '↑' : day.totalCount < day.prevDayCount ? '↓' : '→'}
                                      </span>
                                      <span className={
                                        day.totalCount > day.prevDayCount ? 'text-danger' : 
                                        day.totalCount < day.prevDayCount ? 'text-success' : 'text-secondary'
                                      }>
                                        {Math.abs(day.totalCount - day.prevDayCount)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Tab>
              
              {/* Calendar breakdown tab */}
              {hasCalendarBreakdown && (
                <Tab eventKey="breakdown" title="Kalender-Details">
                  <div className="tab-content-container">
                    <div className="table-responsive">
                      <Table className="history-table mb-0">
                        <thead>
                          <tr>
                            <th>Datum</th>
                            <th className="text-center">Klavier</th>
                            <th className="text-center">Geigen</th>
                            <th className="text-center">Weihnachten</th>
                            <th className="text-center">Nikolaus</th>
                            <th className="text-center">Laternenumzug</th>
                            <th className="text-center">Puppentheater</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((entry, index) => (
                            <tr key={index}>
                              <td>{formatDate(entry.date)}</td>
                              <td className="text-center">
                                <Badge 
                                  bg={parseInt(entry.klavier_count) > 0 ? "warning" : "success"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {entry.klavier_count || 0}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge 
                                  bg={parseInt(entry.geigen_count) > 0 ? "warning" : "success"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {entry.geigen_count || 0}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge 
                                  bg={parseInt(entry.weihnachts_count) > 0 ? "warning" : "success"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {entry.weihnachts_count || 0}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge 
                                  bg={parseInt(entry.nikolaus_count) > 0 ? "warning" : "success"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {entry.nikolaus_count || 0}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge 
                                  bg={parseInt(entry.laternenumzug_count) > 0 ? "warning" : "success"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {entry.laternenumzug_count || 0}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <Badge 
                                  bg={parseInt(entry.puppentheater_count) > 0 ? "warning" : "success"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {entry.puppentheater_count || 0}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Tab>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default HistoryDashboard;