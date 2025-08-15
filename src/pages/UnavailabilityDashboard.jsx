import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Table,
  Button,
  Modal,
  Badge,
  Spinner,
  Alert,
  Form,
} from "react-bootstrap";
import {
  ChevronDown,
  ChevronUp,
  X,
  CalendarEvent,
  ExclamationCircle,
  Plus,
  Check,
  Clock,
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
  const [showBusyArtistModal, setShowBusyArtistModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedUnavailability, setSelectedUnavailability] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinedCalendars, setJoinedCalendars] = useState([]);

  // Busy artist state
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [isBusySubmitting, setIsBusySubmitting] = useState(false);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const USER_API_URL =
    "https://artist-crud-function-754826373806.europe-west10.run.app";
  const UNAVAILABLE_API_URL =
    "https://unavailable-events-754826373806.europe-west1.run.app";

  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ][currentMonthIndex];

  const monthsFromCurrent = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ].slice(currentMonthIndex);

  const daysOfWeek = [
    { id: "monday", label: "Montag" },
    { id: "tuesday", label: "Dienstag" },
    { id: "wednesday", label: "Mittwoch" },
    { id: "thursday", label: "Donnerstag" },
    { id: "friday", label: "Freitag" },
    { id: "saturday", label: "Samstag" },
    { id: "sunday", label: "Sonntag" },
  ];

  const toBerlinTime = (date) => {
    return new Date(
      date.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
    );
  };

const fetchUnavailabilities = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const userRes = await authApi.getMe();
    setCurrentUser(userRes.data.user);

    const userDataRes = await axios.get(
      `${USER_API_URL}/?id=${userRes.data.user._id}`
    );
    const userFromApi = userDataRes.data;

    // ✅ Always use only "Sperrtermine" calendar as a string
    const calendarName = "Sperrtermine";
    setJoinedCalendars([{ Calendar: calendarName }]);

    const payload = {
      user: {
        name: userFromApi.Name,
        email: userFromApi["E-Mail"],
        calendars: calendarName, // ✅ now a string, not array
      },
    };
    console.log("Fetching unavailabilities with payload:", payload);

    const unavailabilityRes = await axios.post(
      `${UNAVAILABLE_API_URL}/getUnavailabilities`,
      payload
    );
    console.log("Unavailability data fetched:", unavailabilityRes.data);

    const fetched = (unavailabilityRes.data || []).map((event) => {
      const berlinStart = new Date(event.start.dateTime || event.start.date);
      const berlinEnd = new Date(event.end.dateTime || event.end.date);
      berlinEnd.setDate(berlinEnd.getDate() - 1);

      return {
        id:
          event.id ||
          event.iCalUID ||
          event.uid ||
          `${berlinStart.getTime()}-${Math.random()}`,
        startDate: berlinStart.toISOString().split("T")[0],
        endDate: berlinEnd.toISOString().split("T")[0],
        details: "Nicht verfügbar",
        uid: event.extendedProperties?.private?.uid || event.id || "",
        htmlLink: event.htmlLink || "",
      };
    });

    setUnavailabilities(fetched);
  } catch (err) {
    console.error("Error loading data:", err);
    setError(
      "Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut."
    );
    toast.error("Fehler beim Laden der Sperrtermine");
    setUnavailabilities([]);
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    fetchUnavailabilities();
  }, [fetchUnavailabilities]);

  const filteredUnavailabilities = useMemo(() => {
    if (!searchTerm.trim()) return unavailabilities;

    const searchLower = searchTerm.toLowerCase();
    return unavailabilities.filter((unavailability) => {
      const startDateText = new Date(unavailability.startDate)
        .toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })
        .toLowerCase();
      const endDateText = new Date(unavailability.endDate)
        .toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })
        .toLowerCase();
      return (
        startDateText.includes(searchLower) || endDateText.includes(searchLower)
      );
    });
  }, [unavailabilities, searchTerm]);

  const formatDateNoTZ = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!startDate || !endDate || startDate > endDate) {
      toast.error("Bitte wählen Sie einen gültigen Datumsbereich.");
      setIsSubmitting(false);
      return;
    }

    try {
      const calendarNames = "Sperrtermine"; // Only use Sperrtermine calendar

      const formattedStart = formatDateNoTZ(startDate);
      const formattedEnd = formatDateNoTZ(endDate);

      const unavailabilityData = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: calendarNames,
        },
        unavailability: {
          startDate: formattedStart,
          endDate: formattedEnd,
          veryBusy: false,
          reason: "Nicht verfügbar",
          details: "Nicht verfügbar",
        },
      };
      console.log("Unavailability data to submit:", unavailabilityData);

      await axios.post(
        `${UNAVAILABLE_API_URL}/unavailabilities`,
        unavailabilityData
      );

      // setSubmitSuccess(true);
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

  const handleBusyArtistSubmit = async (e) => {
    e.preventDefault();
    setIsBusySubmitting(true);

    if (!selectedMonth || selectedDays.length === 0) {
      toast.error(
        "Bitte wählen Sie einen Monat und mindestens einen Wochentag aus."
      );
      setIsBusySubmitting(false);
      return;
    }

    try {
      const calendarNames = "Sperrtermine"; // Only use Sperrtermine calendar

      // Get current year
      const currentYear = new Date().getFullYear();
      // Get month index (0-11)
      const monthIndex =
        monthsFromCurrent.indexOf(selectedMonth) + currentMonthIndex;

      // Get current date
      const today = new Date();

      // Create start date - if current month, use today's date, otherwise first of month
      const startDate =
        monthIndex === today.getMonth()
          ? new Date(today)
          : new Date(currentYear, monthIndex, 1);

      // Create end date (last day of month)
      const endDate = new Date(currentYear, monthIndex + 1, 0);

      // Format dates
      const formattedStart = formatDateNoTZ(startDate);
      const formattedEnd = formatDateNoTZ(endDate);

      const unavailabilityData = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: calendarNames,
        },
        unavailability: {
          startDate: formattedStart,
          endDate: formattedEnd,
          reason: "Ausgebucht",
          veryBusy: true,
          details: `Ausgebucht an folgenden Wochentagen: ${selectedDays.join(
            ", "
          )}`,
          daysOfWeek: selectedDays,
        },
      };
      console.log("Unavailability data to submit:", unavailabilityData);

      await axios.post(
       `${UNAVAILABLE_API_URL}/busy-unavailabilities`,
        unavailabilityData
      ); 

      toast.success("Ausbuchung erfolgreich hinzugefügt");
      setShowBusyArtistModal(false);
      setSelectedMonth("");
      setSelectedDays([]);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Fehler beim Speichern der Ausbuchung");
    } finally {
      setIsBusySubmitting(false);
    }
  };

  const toggleDaySelection = (dayId) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const resetForm = () => {
    setStartDate(null);
    setEndDate(null);
    setSubmitSuccess(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUnavailability || !selectedUnavailability.uid) {
      toast.error("Ungültiger Sperrtermin ausgewählt");
      return;
    }

    setIsDeleting(true);
    try {
      const calendarNames = "Sperrtermine"; // Only use Sperrtermine calendar

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
      timeZone: "Europe/Berlin",
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
                placeholder="Nach Datum suchen..."
              />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="dashboard-alert">
            {error}
          </Alert>
        )}

        <div className="d-flex justify-content-end mb-3 gap-2">
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="add-unavailability-btn"
          >
            <Plus className="me-2" />
            Sperrtermin hinzufügen
          </Button>

          <Button
            variant="warning"
            onClick={() => setShowBusyArtistModal(true)}
            className="add-busy-btn"
          >
            <Clock className="me-2" />
            Ausgebucht eintragen
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
                      {expanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </div>
                    <Badge
                      bg="primary"
                      className="enhanced-badge capsule-badge"
                    >
                      Gesamt{" "}
                      <span className="badge-count">
                        {filteredUnavailabilities.length}
                      </span>
                    </Badge>
                  </div>
                  <span className="events-count">
                    <span className="count-number">
                      {filteredUnavailabilities.length}
                    </span>
                    <span className="count-label">
                      {filteredUnavailabilities.length === 1
                        ? " Eintrag"
                        : " Einträge"}
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
                        {searchTerm
                          ? "Keine passenden Sperrtermine gefunden"
                          : "Keine Sperrtermine eingetragen"}
                      </h4>
                      <p>
                        {searchTerm
                          ? "Versuchen Sie einen anderen Suchbegriff"
                          : "Klicken Sie oben auf den Button, um einen Sperrtermin hinzuzufügen"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table className="events-table">
                          <thead>
                            <tr>
                              <th>Von (Berliner Zeit)</th>
                              <th>Bis (Berliner Zeit)</th>
                              <th>Grund</th>
                              <th>Aktionen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUnavailabilities.map(
                              (unavailability, index) => (
                                <tr key={index} className="event-row">
                                  <td className="event-time"></td>
                                  <td className="event-time">
                                    {formatDate(unavailability.startDate)}-
                                    {formatDate(unavailability.endDate)}
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => {
                                        if (unavailability.htmlLink) {
                                          window.open(
                                            `${unavailability.htmlLink}`,
                                            "_blank"
                                          );
                                        } else {
                                          toast.error(
                                            "Kein Kalenderlink für dieses Ereignis verfügbar"
                                          );
                                        }
                                      }}
                                    >
                                      Details
                                    </Button>

                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUnavailability(
                                          unavailability
                                        );
                                        setShowDeleteModal(true);
                                      }}
                                      className="delete-btn"
                                    >
                                      <X className="me-1" />
                                      <span className="d-none d-md-inline">
                                        Löschen
                                      </span>
                                    </Button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </Table>
                      </div>

                      <div className="event-cards-container d-md-none">
                        {filteredUnavailabilities.map(
                          (unavailability, index) => (
                            <div key={index} className="event-mobile-card">
                              <div className="event-mobile-header">
                                <div className="event-mobile-title">
                                  {formatDate(unavailability.startDate)} -{" "}
                                  {formatDate(unavailability.endDate)}
                                </div>
                              </div>
                              <div className="event-mobile-content">
                                <div className="event-mobile-reason">
                                  <Badge
                                    bg="light"
                                    text="dark"
                                    className="role-badge"
                                  >
                                    {getReasonIcon()}
                                    <span className="ms-2">
                                      {unavailability.details}
                                    </span>
                                  </Badge>
                                </div>
                                <div className="event-mobile-actions">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => {
                                      console.log(unavailability.htmlLink);
                                      if (unavailability.htmlLink) {
                                        window.open(
                                          `${unavailability.htmlLink}`,
                                          "_blank"
                                        );
                                      } else {
                                        toast.error(
                                          "Kein Kalenderlink für dieses Ereignis verfügbar"
                                        );
                                      }
                                    }}
                                  >
                                    Details
                                  </Button>

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
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        show={showFormModal}
        onHide={() => {
          if (!isSubmitting) {
            setShowFormModal(false);
            resetForm();
          }
        }}
        size="lg"
        centered
        backdrop={isSubmitting ? "static" : true}
        keyboard={!isSubmitting}
      >
        <Modal.Header closeButton={!isSubmitting}>
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
              {/* Start Date */}
              <div className="form-group mb-3">
                <label className="form-label">Von (Startdatum)</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <CalendarEvent />
                  </span>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      setEndDate(null);
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    dateFormat="dd.MM.yyyy"
                    className="form-control"
                    placeholderText="Startdatum auswählen"
                    required
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="form-group mb-3">
                <label className="form-label">Bis (Enddatum)</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <CalendarEvent />
                  </span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    disabled={!startDate}
                    dateFormat="dd.MM.yyyy"
                    className="form-control"
                    placeholderText={
                      startDate
                        ? "Enddatum auswählen"
                        : "Bitte zuerst Startdatum wählen"
                    }
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
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
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
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

      {/* Busy Artist Modal */}
      <Modal
        show={showBusyArtistModal}
        onHide={() => {
          if (!isBusySubmitting) {
            setShowBusyArtistModal(false);
            setSelectedMonth("");
            setSelectedDays([]);
          }
        }}
        size="lg"
        centered
        backdrop={isBusySubmitting ? "static" : true}
        keyboard={!isBusySubmitting}
      >
        <Modal.Header closeButton={!isBusySubmitting}>
          <Modal.Title>Ausgebucht eintragen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleBusyArtistSubmit}>
            {/* Month Selection */}
            <div className="form-group mb-3">
              <label className="form-label">Monat auswählen</label>
              {selectedMonth === currentMonthName && (
                <div className="alert alert-info small mb-2">
                  Für den aktuellen Monat ({currentMonthName}) beginnt die
                  Sperrung ab heute.
                </div>
              )}
              <Form.Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                required
              >
                <option value="">-- Monat auswählen --</option>
                {monthsFromCurrent.map((month) => (
                  <option key={month} value={month}>
                    {month}{" "}
                    {month === currentMonthName ? "(Aktueller Monat)" : ""}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Days of Week Selection */}
            <div className="form-group mb-3">
              <label className="form-label">Wochentage auswählen</label>
              <div className="days-selection-container">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.id}
                    variant={
                      selectedDays.includes(day.id)
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => toggleDaySelection(day.id)}
                    className="day-button"
                    type="button"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  setShowBusyArtistModal(false);
                  setSelectedMonth("");
                  setSelectedDays([]);
                }}
                disabled={isBusySubmitting}
              >
                Abbrechen
              </Button>
              <Button
                variant="warning"
                type="submit"
                disabled={
                  isBusySubmitting ||
                  !selectedMonth ||
                  selectedDays.length === 0
                }
              >
                {isBusySubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Speichern...
                  </>
                ) : (
                  "Ausgebucht eintragen"
                )}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
          }
        }}
        centered
        backdrop={isDeleting ? "static" : true}
        keyboard={!isDeleting}
      >
        <Modal.Header closeButton={!isDeleting}>
          <Modal.Title>Delete Unavailability</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isDeleting ? (
            <div className="text-center py-3">
              <Spinner animation="border" role="status" className="me-2" />
              Deleting event...
            </div>
          ) : (
            <p>Are you sure you want to delete this unavailability?</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default UnavailabilityDashboard;
