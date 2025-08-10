import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { Table, Button, Modal, Badge, Spinner, Alert } from "react-bootstrap";
import {
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Plus,
  CalendarEvent,
  ExclamationCircle,
  Check,
} from "react-bootstrap-icons";
import DashboardLayout from "../components/DashboardLayout";
import SearchBox from "../components/SearchBox";
import { useMediaQuery } from "react-responsive";
import DashboardLoader from "../components/DashboardLoader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { authApi } from "../utils/api";

const UnavailabilityDashboard = ({ setAuth, handleLogout }) => {
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTimeInput, setStartTimeInput] = useState(null);
  const [endTimeInput, setEndTimeInput] = useState(null);
  const [selectedUnavailability, setSelectedUnavailability] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinedCalendars, setJoinedCalendars] = useState([]);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const USER_API_URL = "https://artist-crud-function-754826373806.europe-west10.run.app";
  const UNAVAILABLE_API_URL = "https://unavailable-events-754826373806.europe-west1.run.app";

  // Convert a date to Berlin timezone
  const toBerlinTime = (date) => {
    return new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  };

  const fetchUnavailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userRes = await authApi.getMe();
      setCurrentUser(userRes.data.user);

      const userDataRes = await axios.get(`${USER_API_URL}/?id=${userRes.data.user._id}`);
      const userFromApi = userDataRes.data;
      const calendars = userFromApi.joinedCalendars || [];
      setJoinedCalendars(calendars);

      const calendarNames = calendars.map((c) => c.Calendar);
      const payload = {
        user: {
          name: userFromApi.Name,
          email: userFromApi["E-Mail"],
          calendars: calendarNames,
        },
      };

      const unavailabilityRes = await axios.post(
        `${UNAVAILABLE_API_URL}/getUnavailabilities`,
        payload
      );
      console.log("Fetched unavailabilities:", unavailabilityRes.data);
      const fetched = (unavailabilityRes.data || []).map((event) => {
        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);

        // Convert to Berlin time for display
        const berlinStart = toBerlinTime(startDate);
        const berlinEnd = toBerlinTime(endDate);

        return {
          id: event.id || event.iCalUID || event.uid || `${startDate.getTime()}-${Math.random()}`,
          date: berlinStart.toISOString().split('T')[0],
          startTime: berlinStart.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: 'Europe/Berlin'
          }),
          endTime: berlinEnd.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: 'Europe/Berlin'
          }),
          details: "Nicht verfügbar", // Default reason in German
          uid: event.extendedProperties?.private?.uid || event.id || "",
        };
      });

      setUnavailabilities(fetched);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.");
      toast.error("Fehler beim Laden der Sperrtermine");
      setUnavailabilities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnavailabilities();
  }, [fetchUnavailabilities]);

  const roundToNext15Minutes = (date) => {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 15;

    if (remainder !== 0) {
      rounded.setMinutes(minutes + (15 - remainder));
      rounded.setSeconds(0);
      rounded.setMilliseconds(0);
    }

    if (rounded.getMinutes() % 15 === 0 && remainder === 0) {
      rounded.setMinutes(rounded.getMinutes() + 15);
    }

    return rounded;
  };

  const getMinStartTime = useCallback(() => {
    if (!selectedDate) return null;

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (isToday) {
      return roundToNext15Minutes(today);
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(8, 0, 0, 0);
    return startOfDay;
  }, [selectedDate]);

  const getMaxEndTime = useCallback(() => {
    if (!selectedDate) return null;

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 45, 0, 0);
    return endOfDay;
  }, [selectedDate]);

  const getMinEndTime = useCallback(() => {
    if (!startTimeInput) return null;

    const minEndTime = new Date(startTimeInput);
    minEndTime.setMinutes(minEndTime.getMinutes() + 15);
    return minEndTime;
  }, [startTimeInput]);

  useEffect(() => {
    if (selectedDate) {
      const newMinStartTime = getMinStartTime();
      setStartTimeInput(null);
      setEndTimeInput(null);

      if (newMinStartTime && newMinStartTime <= getMaxEndTime()) {
        // Don't auto-set, let user choose
      }
    }
  }, [selectedDate, getMinStartTime, getMaxEndTime]);

  useEffect(() => {
    if (startTimeInput) {
      setEndTimeInput(null);
    }
  }, [startTimeInput]);

  const filteredUnavailabilities = useMemo(() => {
    if (!searchTerm.trim()) return unavailabilities;

    const searchLower = searchTerm.toLowerCase();
    return unavailabilities.filter((unavailability) => {
      const dateText = new Date(unavailability.date)
        .toLocaleDateString("de-DE", { timeZone: 'Europe/Berlin' })
        .toLowerCase();
      const timeText = `${unavailability.startTime}-${unavailability.endTime}`.toLowerCase();

      return dateText.includes(searchLower) || timeText.includes(searchLower);
    });
  }, [unavailabilities, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!startTimeInput || !endTimeInput || startTimeInput >= endTimeInput) {
      toast.error("Bitte wählen Sie einen gültigen Zeitraum.");
      setIsSubmitting(false);
      return;
    }

    try {
      const calendarNames = joinedCalendars.map((c) => c.Calendar);
      
      // Convert times to Berlin time strings in 24-hour format
      const berlinTimeOptions = { 
        timeZone: 'Europe/Berlin', 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      };
      
      const startTime = startTimeInput.toLocaleTimeString('de-DE', berlinTimeOptions);
      const endTime = endTimeInput.toLocaleTimeString('de-DE', berlinTimeOptions);

      // Format date in Berlin time
      const berlinDate = toBerlinTime(selectedDate);
      const formattedDate = [
        berlinDate.getFullYear(),
        String(berlinDate.getMonth() + 1).padStart(2, '0'),
        String(berlinDate.getDate()).padStart(2, '0')
      ].join('-');

      const unavailabilityData = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: calendarNames,
        },
        unavailability: {
          date: formattedDate,
          startTime,
          endTime,
          reason: "unavailable", // Default reason
          details: "Nicht verfügbar", // Default reason in German
        },
      };

      await axios.post(
        `${UNAVAILABLE_API_URL}/unavailabilities`,
        unavailabilityData
      );

      setSubmitSuccess(true);
      toast.success("Sperrtermin erfolgreich hinzugefügt");

      setTimeout(() => {
        setShowFormModal(false);
        resetForm();
        fetchUnavailabilities();
      }, 1000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Fehler beim Speichern des Sperrtermins");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStartTimeInput(null);
    setEndTimeInput(null);
    setSelectedDate(new Date());
    setSubmitSuccess(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUnavailability || !selectedUnavailability.uid) {
      toast.error("Ungültiger Sperrtermin ausgewählt");
      return;
    }

    setIsDeleting(true);
    try {
      const calendarNames = joinedCalendars.map((c) => c.Calendar);

      const deletePayload = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: calendarNames,
        },
        uid: selectedUnavailability.uid,
      };

      await axios.delete(`${UNAVAILABLE_API_URL}/unavailabilities`, {
        data: deletePayload,
      });

      toast.success("Sperrtermin erfolgreich gelöscht");
      setShowDeleteModal(false);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Fehler beim Löschen des Sperrtermins");
    } finally {
      setIsDeleting(false);
    }
  };

  const getReasonIcon = () => {
    return <ExclamationCircle className="reason-icon" />;
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: 'Europe/Berlin'
    });
  };

  return (
    <DashboardLayout
      setAuth={setAuth}
      onRefresh={fetchUnavailabilities}
      handleLogout={handleLogout}
    >
      <div className="unavailability-dashboard">
        {!loading && (
          <div className="transparent-header-container">
            <h1 className="dashboard-main-title">Sperrtermine</h1>
            <div className="header-search-box">
              <SearchBox
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nach Datum oder Zeit suchen..."
              />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="dashboard-alert">
            {error}
          </Alert>
        )}

        <div className="d-flex justify-content-end mb-3">
          <Button
            variant="primary"
            onClick={() => setShowFormModal(true)}
            className="add-unavailability-btn"
          >
            <Plus className="me-2" />
            Sperrtermin hinzufügen
          </Button>
        </div>

        <div className="events-container">
          {loading ? (
            <DashboardLoader message="Lade Sperrtermine..." />
          ) : (
            <div className="event-calendar-card">
              <div className="calendar-header" onClick={toggleExpand}>
                <div className="header-content">
                  <div className="title-with-icon">
                    <h5 className="calendar-title">Meine Sperrtermine</h5>
                    <div className="dropdown-toggle-icon">
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    <Badge bg="primary" className="enhanced-badge capsule-badge">
                      Gesamt <span className="badge-count">{filteredUnavailabilities.length}</span>
                    </Badge>
                  </div>
                  <span className="events-count">
                    <span className="count-number">{filteredUnavailabilities.length}</span>
                    <span className="count-label">
                      {filteredUnavailabilities.length === 1 ? " Eintrag" : " Einträge"}
                    </span>
                  </span>
                </div>
              </div>

              {expanded && (
                <div className="calendar-content">
                  {filteredUnavailabilities.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CalendarEvent size={48} />
                      </div>
                      <h4>
                        {searchTerm ? "Keine passenden Sperrtermine gefunden" : "Keine Sperrtermine eingetragen"}
                      </h4>
                      <p>
                        {searchTerm ? "Versuchen Sie einen anderen Suchbegriff" : "Klicken Sie oben auf den Button, um einen Sperrtermin hinzuzufügen"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table className="events-table">
                          <thead>
                            <tr>
                              <th>Datum (Berliner Zeit)</th>
                              <th>Zeit (Berliner Zeit)</th>
                              <th>Grund</th>
                              <th>Aktionen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUnavailabilities.map((unavailability, index) => (
                              <tr key={index} className="event-row">
                                <td className="event-time">
                                  <div className="date">
                                    {formatDate(unavailability.date)}
                                  </div>
                                </td>
                                <td className="event-time">
                                  <div className="time">
                                    <Clock className="me-2" />
                                    {unavailability.startTime} - {unavailability.endTime}
                                  </div>
                                </td>
                                <td className="event-actions">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUnavailability(unavailability);
                                      setShowDeleteModal(true);
                                    }}
                                    className="delete-btn"
                                  >
                                    <X className="me-1" />
                                    <span className="d-none d-md-inline">Löschen</span>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>

                      <div className="event-cards-container d-md-none">
                        {filteredUnavailabilities.map((unavailability, index) => (
                          <div key={index} className="event-mobile-card">
                            <div className="event-mobile-header">
                              <div className="event-mobile-title">
                                {formatDate(unavailability.date)}
                              </div>
                            </div>
                            <div className="event-mobile-content">
                              <div className="event-mobile-details">
                                <div className="event-mobile-time">
                                  <Clock className="me-2" />
                                  {unavailability.startTime} - {unavailability.endTime}
                                </div>
                                <div className="event-mobile-reason">
                                  <Badge bg="light" text="dark" className="role-badge">
                                    {getReasonIcon()}
                                    <span className="ms-2">{unavailability.details}</span>
                                  </Badge>
                                </div>
                              </div>
                              <div className="event-mobile-actions">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUnavailability(unavailability);
                                    setShowDeleteModal(true);
                                  }}
                                  className="delete-btn"
                                >
                                  <X className="me-1" />
                                  Löschen
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        show={showFormModal}
        onHide={() => !isSubmitting && setShowFormModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Sperrtermin eintragen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submitSuccess ? (
            <div className="text-center p-4">
              <div className="text-success mb-3">
                <Check size={48} />
              </div>
              <h4>Sperrtermin erfolgreich gespeichert!</h4>
              <p>Die Liste wird automatisch aktualisiert...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">Datum auswählen</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <CalendarEvent />
                  </span>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    dateFormat="dd.MM.yyyy"
                    className="form-control"
                    placeholderText="Datum auswählen"
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Von</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Clock />
                      </span>
                      <DatePicker
                        selected={startTimeInput}
                        onChange={(time) => setStartTimeInput(time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Von"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        className="form-control"
                        placeholderText={selectedDate ? "Zeit wählen" : "Zuerst Datum auswählen"}
                        minTime={getMinStartTime()}
                        maxTime={getMaxEndTime()}
                        disabled={!selectedDate}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Bis</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Clock />
                      </span>
                      <DatePicker
                        selected={endTimeInput}
                        onChange={(time) => setEndTimeInput(time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Bis"
                        dateFormat="HH:mm"
                        timeFormat="HH:mm"
                        className="form-control"
                        placeholderText={startTimeInput ? "Zeit wählen" : "Zuerst Startzeit auswählen"}
                        minTime={getMinEndTime()}
                        maxTime={getMaxEndTime()}
                        disabled={!startTimeInput}
                        required
                      />
                    </div>
                    {startTimeInput && endTimeInput && endTimeInput <= startTimeInput && (
                      <div className="text-danger small mt-1">
                        Endzeit muss nach der Startzeit liegen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (endTimeInput && startTimeInput && endTimeInput <= startTimeInput)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Speichern...
                    </>
                  ) : (
                    "Speichern"
                  )}
                </Button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={() => !isDeleting && setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Möchten Sie den Sperrtermin am{" "}
          <strong>
            {selectedUnavailability && formatDate(selectedUnavailability.date)}
          </strong>{" "}
          von <strong>{selectedUnavailability?.startTime}</strong> bis{" "}
          <strong>{selectedUnavailability?.endTime}</strong> wirklich löschen?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Löschen...
              </>
            ) : (
              "Löschen"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default UnavailabilityDashboard;