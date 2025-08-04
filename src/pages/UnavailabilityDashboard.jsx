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
  MusicNoteBeamed,
  Briefcase,
  Heart,
  Globe,
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
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedUnavailability, setSelectedUnavailability] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinedCalendars, setJoinedCalendars] = useState([]);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const reasonOptions = [
    {
      value: "performance",
      label: "Other performance",
      icon: <MusicNoteBeamed className="reason-icon" />,
    },
    {
      value: "recording",
      label: "Recording session",
      icon: <MusicNoteBeamed className="reason-icon" />,
    },
    {
      value: "travel",
      label: "Business trip",
      icon: <Globe className="reason-icon" />,
    },
    {
      value: "personal",
      label: "Personal reasons",
      icon: <Heart className="reason-icon" />,
    },
    {
      value: "contract",
      label: "Contractual obligation",
      icon: <Briefcase className="reason-icon" />,
    },
    {
      value: "health",
      label: "Health reasons",
      icon: <Heart className="reason-icon" />,
    },
    {
      value: "other",
      label: "Other reason",
      icon: <ExclamationCircle className="reason-icon" />,
    },
  ];

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
          startTime: berlinStart.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: 'Europe/Berlin'
          }),
          endTime: berlinEnd.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: 'Europe/Berlin'
          }),
          reason: event.extendedProperties?.private?.type || "other",
          details: event.description?.replace("Reason: ", "") || "No reason provided",
          uid: event.extendedProperties?.private?.uid || event.id || "",
        };
      });

      setUnavailabilities(fetched);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error loading data. Please try again later.");
      toast.error("Error loading unavailabilities");
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
      const reasonText = unavailability.reason === "other"
        ? (unavailability.details || "").toLowerCase()
        : reasonOptions.find((r) => r.value === unavailability.reason)?.label.toLowerCase() || "";

      const dateText = new Date(unavailability.date)
        .toLocaleDateString("en-US", { timeZone: 'Europe/Berlin' })
        .toLowerCase();
      const timeText = `${unavailability.startTime}-${unavailability.endTime}`.toLowerCase();

      return reasonText.includes(searchLower) || dateText.includes(searchLower) || timeText.includes(searchLower);
    });
  }, [unavailabilities, searchTerm, reasonOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!startTimeInput || !endTimeInput || startTimeInput >= endTimeInput) {
      toast.error("Please select a valid time range.");
      setIsSubmitting(false);
      return;
    }

    try {
      const calendarNames = joinedCalendars.map((c) => c.Calendar);
      
      // Convert times to Berlin time strings
      const berlinTimeOptions = { 
        timeZone: 'Europe/Berlin', 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      };
      
      const startTime = startTimeInput.toLocaleTimeString('en-US', berlinTimeOptions);
      const endTime = endTimeInput.toLocaleTimeString('en-US', berlinTimeOptions);

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
          reason: reason,
          details: reason === "other" ? customReason : 
                  reasonOptions.find((r) => r.value === reason)?.label,
        },
      };

      await axios.post(
        `${UNAVAILABLE_API_URL}/unavailabilities`,
        unavailabilityData
      );

      setSubmitSuccess(true);
      toast.success("Unavailability added successfully");

      setTimeout(() => {
        setShowFormModal(false);
        resetForm();
        fetchUnavailabilities();
      }, 1000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Error saving unavailability");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReason("");
    setCustomReason("");
    setStartTimeInput(null);
    setEndTimeInput(null);
    setSelectedDate(new Date());
    setSubmitSuccess(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUnavailability || !selectedUnavailability.uid) {
      toast.error("Invalid unavailability selected");
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

      toast.success("Unavailability deleted successfully");
      setShowDeleteModal(false);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error deleting unavailability");
    } finally {
      setIsDeleting(false);
    }
  };

  const getReasonIcon = (reasonValue) => {
    const option = reasonOptions.find((opt) => opt.value === reasonValue);
    return option ? option.icon : <ExclamationCircle className="reason-icon" />;
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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
            <h1 className="dashboard-main-title">Unavailabilities</h1>
            <div className="header-search-box">
              <SearchBox
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by date, time or reason..."
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
            Add Unavailability
          </Button>
        </div>

        <div className="events-container">
          {loading ? (
            <DashboardLoader message="Loading unavailabilities..." />
          ) : (
            <div className="event-calendar-card">
              <div className="calendar-header" onClick={toggleExpand}>
                <div className="header-content">
                  <div className="title-with-icon">
                    <h5 className="calendar-title">My Unavailabilities</h5>
                    <div className="dropdown-toggle-icon">
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    <Badge bg="primary" className="enhanced-badge capsule-badge">
                      Total <span className="badge-count">{filteredUnavailabilities.length}</span>
                    </Badge>
                  </div>
                  <span className="events-count">
                    <span className="count-number">{filteredUnavailabilities.length}</span>
                    <span className="count-label">
                      {filteredUnavailabilities.length === 1 ? " entry" : " entries"}
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
                        {searchTerm ? "No matching unavailabilities found" : "No unavailabilities scheduled"}
                      </h4>
                      <p>
                        {searchTerm ? "Try a different search term" : "Click the button above to add an unavailability"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table className="events-table">
                          <thead>
                            <tr>
                              <th>Date (Berlin Time)</th>
                              <th>Time (Berlin Time)</th>
                              <th>Reason</th>
                              <th>Actions</th>
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
                                <td className="event-details">
                                  <Badge bg="light" text="dark" className="role-badge">
                                    {getReasonIcon(unavailability.reason)}
                                    <span className="ms-2">{unavailability.details}</span>
                                  </Badge>
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
                                    <span className="d-none d-md-inline">Delete</span>
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
                                    {getReasonIcon(unavailability.reason)}
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
                                  Delete
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
          <Modal.Title>Add Unavailability (Berlin Time)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submitSuccess ? (
            <div className="text-center p-4">
              <div className="text-success mb-3">
                <Check size={48} />
              </div>
              <h4>Unavailability successfully saved!</h4>
              <p>The list will refresh automatically...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="timezone-note mb-3">
                <small className="text-muted">
                  All times are in Europe/Berlin timezone (CET/CEST)
                </small>
              </div>
              
              <div className="form-group mb-3">
                <label className="form-label">Select Date</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <CalendarEvent />
                  </span>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    dateFormat="MM/dd/yyyy"
                    className="form-control"
                    placeholderText="Select date"
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">From</label>
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
                        timeCaption="From"
                        dateFormat="h:mm aa"
                        className="form-control"
                        placeholderText={selectedDate ? "Select start time" : "Select date first"}
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
                    <label className="form-label">To</label>
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
                        timeCaption="To"
                        dateFormat="h:mm aa"
                        className="form-control"
                        placeholderText={startTimeInput ? "Select end time" : "Select start time first"}
                        minTime={getMinEndTime()}
                        maxTime={getMaxEndTime()}
                        disabled={!startTimeInput}
                        required
                      />
                    </div>
                    {startTimeInput && endTimeInput && endTimeInput <= startTimeInput && (
                      <div className="text-danger small mt-1">
                        End time must be after start time
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Reason</label>
                <div className="d-flex flex-wrap gap-2">
                  {reasonOptions.map((option) => (
                    <div key={option.value} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="reason"
                        id={`reason-${option.value}`}
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        required
                      />
                      <label className="form-check-label d-flex align-items-center" htmlFor={`reason-${option.value}`}>
                        <span className="me-2">{option.icon}</span>
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {reason === "other" && (
                <div className="form-group mb-3">
                  <label className="form-label">Details</label>
                  <textarea
                    className="form-control"
                    placeholder="Specify reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    required
                    rows={3}
                  />
                </div>
              )}

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
                  Cancel
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
                      Saving...
                    </>
                  ) : (
                    "Save"
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
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the unavailability on{" "}
          <strong>
            {selectedUnavailability && formatDate(selectedUnavailability.date)}
          </strong>{" "}
          from <strong>{selectedUnavailability?.startTime}</strong> to{" "}
          <strong>{selectedUnavailability?.endTime}</strong>?
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
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
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