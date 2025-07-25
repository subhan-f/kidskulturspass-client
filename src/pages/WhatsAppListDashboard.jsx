import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Table, Alert, Badge } from "react-bootstrap";
import {
  Telephone,
  ArrowClockwise,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  ArrowRepeat,
  XCircle,
  Bell,
  CameraVideo,
  ArrowReturnRight,
  Whatsapp,
  ChatLeftText,
  CheckCircle,
  Clock,
  ExclamationTriangle
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import DashboardLoader from "../components/DashboardLoader";
import { Link } from "react-router-dom";

function WhatsAppListDashboard({ setAuth,handleLogout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Nachrichten werden geladen...");
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTypes, setExpandedTypes] = useState({});
  const [currentPages, setCurrentPages] = useState({});
  const [messagesPerPageConfig, setMessagesPerPageConfig] = useState({});

  // Mock data for WhatsApp messages
  const mockMessages = [
    {
      id: "1",
      artistName: "Max Mustermann",
      phoneNumber: "+491234567890",
      messageType: "Invitation",
      status: "Sent",
      sentOn: "2025-06-30T10:15:00Z",
      content: "Einladung zum Konzert am 15. Juli",
      calendar: "Geigen Mitmachkonzert"
    },
    {
      id: "2",
      artistName: "Anna Schmidt",
      phoneNumber: "+491234567891",
      messageType: "New Deal",
      status: "Delivered",
      sentOn: "2025-06-29T14:30:00Z",
      content: "Neuer Job: Klavierabend am 20. Juli",
      calendar: "Klavier Mitmachkonzert"
    },
    {
      id: "3",
      artistName: "Thomas Müller",
      phoneNumber: "+491234567892",
      messageType: "Follow Up",
      status: "Read",
      sentOn: "2025-06-28T15:00:00Z",
      content: "Erinnerung: Noch offene Jobs verfügbar",
      calendar: "Laternenumzug mit Musik"
    },
    {
      id: "4",
      artistName: "Lisa Weber",
      phoneNumber: "+491234567893",
      messageType: "Update Deal",
      status: "Sent",
      sentOn: "2025-06-27T11:45:00Z",
      content: "Update: Zeitänderung für Puppentheater",
      calendar: "Puppentheater"
    },
    {
      id: "5",
      artistName: "David Fischer",
      phoneNumber: "+491234567894",
      messageType: "Cancel Deal",
      status: "Failed",
      sentOn: "2025-06-26T09:20:00Z",
      content: "Absage: Nikolaus Besuch am 5. Dezember",
      calendar: "Nikolaus Besuch"
    },
    {
      id: "6",
      artistName: "Sarah Meyer",
      phoneNumber: "+491234567895",
      messageType: "Reminder",
      status: "Pending",
      sentOn: "2025-06-25T12:00:00Z",
      content: "Erinnerung: Konzert morgen um 19 Uhr",
      calendar: "Weihnachts Mitmachkonzert"
    },
    {
      id: "7",
      artistName: "Paul Wagner",
      phoneNumber: "+491234567896",
      messageType: "Reminder Photos Videos",
      status: "Sent",
      sentOn: "2025-06-24T16:30:00Z",
      content: "Bitte Fotos/Videos während des Auftritts machen",
      calendar: "Geigen Mitmachkonzert"
    },
    {
      id: "8",
      artistName: "Julia Becker",
      phoneNumber: "+491234567897",
      messageType: "Performance Email",
      status: "Delivered",
      sentOn: "2025-06-23T18:15:00Z",
      content: "Bitte melden Sie sich nach dem Event für Feedback",
      calendar: "Klavier Mitmachkonzert"
    },
    {
      id: "9",
      artistName: "Michael Schulz",
      phoneNumber: "+491234567898",
      messageType: "New Deal",
      status: "Read",
      sentOn: "2025-06-22T13:45:00Z",
      content: "Neuer Job: Weihnachtskonzert am 24. Dezember",
      calendar: "Weihnachts Mitmachkonzert"
    },
    {
      id: "10",
      artistName: "Elena Hoffmann",
      phoneNumber: "+491234567899",
      messageType: "Update Deal",
      status: "Sent",
      sentOn: "2025-06-21T10:10:00Z",
      content: "Update: Ortänderung für Laternenumzug",
      calendar: "Laternenumzug mit Musik"
    }
  ];

  const messageTypes = [
    {
      type: "Invitation",
      label: "Einladung",
      icon: <ChatLeftText size={14} />,
      class: "type-badge-invitation",
      tooltip: "Einladung zum Event – enthält alle wichtigen Informationen."
    },
    {
      type: "New Deal",
      label: "Neuer Job",
      icon: <PlusCircle size={14} />,
      class: "type-badge-new-deal",
      tooltip: "Information über einen neu verfügbaren Job."
    },
    {
      type: "Follow Up",
      label: "Job noch offen",
      icon: <ArrowReturnRight size={14} />,
      class: "type-badge-follow-up",
      tooltip: "Erinnerung an noch verfügbare Jobs."
    },
    {
      type: "Update Deal",
      label: "Update",
      icon: <ArrowRepeat size={14} />,
      class: "type-badge-update-deal",
      tooltip: "Aktualisierte Informationen zu einem bestehenden Job."
    },
    {
      type: "Cancel Deal",
      label: "Absage",
      icon: <XCircle size={14} />,
      class: "type-badge-cancel-deal",
      tooltip: "Benachrichtigung über die Absage eines Jobs."
    },
    {
      type: "Reminder",
      label: "Event-Erinnerung",
      icon: <Bell size={14} />,
      class: "type-badge-reminder",
      tooltip: "Erinnerung an einen bereits zugesagten Job."
    },
    {
      type: "Reminder Photos Videos",
      label: "Fotos/Videos Erinnerung",
      icon: <CameraVideo size={14} />,
      class: "type-badge-reminder-photos-videos",
      tooltip: "Erinnerung, Fotos und Videos während des Auftritts zu machen."
    },
    {
      type: "Performance Email",
      label: "Performance-Bericht",
      icon: <Telephone size={14} />,
      class: "type-badge-performance",
      tooltip: "Aufforderung, sich nach dem Event für Feedback zu melden."
    }
  ];

  const calendarTypes = [
    "Geigen Mitmachkonzert",
    "Klavier Mitmachkonzert",
    "Laternenumzug mit Musik",
    "Nikolaus Besuch",
    "Puppentheater",
    "Weihnachts Mitmachkonzert"
  ];

  const messagesPerPage = 7;

  const getMessagesPerPage = (type) => {
    return messagesPerPageConfig[type] || messagesPerPage;
  };

  const handleMessagesPerPageChange = (type, value) => {
    setMessagesPerPageConfig((prev) => ({
      ...prev,
      [type]: parseInt(value) || messagesPerPage,
    }));
    setCurrentPages((prev) => ({
      ...prev,
      [type]: 1,
    }));
  };

  const fetchMessages = async () => {
    setLoading(true);
    setLoadingMessage("Nachrichten werden geladen...");
    
    try {
      // In a real app, you would call your API here
      // const response = await getWhatsAppMessages();
      // setMessages(response.data);
      
      // Using mock data for demonstration
      setTimeout(() => {
        setMessages(mockMessages);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Fehler beim Laden der Nachrichten");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const initialExpandState = {};
      const initialPagesState = {};
      calendarTypes.forEach((type) => {
        initialExpandState[type] = true;
        initialPagesState[type] = 1;
      });
      setExpandedTypes(initialExpandState);
      setCurrentPages(initialPagesState);
    }
  }, [messages]);

  const paginate = (type, pageNumber) => {
    setCurrentPages((prev) => ({
      ...prev,
      [type]: pageNumber,
    }));
  };

  const renderPaginationButtons = (type, filteredMessages) => {
    const perPage = getMessagesPerPage(type);
    const totalPages = Math.ceil(filteredMessages.length / perPage);
    const currentPage = currentPages[type] || 1;

    if (totalPages <= 1) return null;

    const buttons = [];

    buttons.push(
      <button
        key="first"
        onClick={() => paginate(type, 1)}
        disabled={currentPage === 1}
        className="page-nav"
        title="Erste Seite"
      >
        &lt;&lt;
      </button>
    );

    buttons.push(
      <button
        key="prev"
        onClick={() => paginate(type, currentPage - 1)}
        disabled={currentPage === 1}
        className="page-nav"
        title="Vorherige Seite"
      >
        &lt;
      </button>
    );

    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => paginate(type, i)}
            className={currentPage === i ? "active" : ""}
          >
            {i}
          </button>
        );
      }
    } else {
      if (currentPage > 2) {
        buttons.push(
          <button key="dots1" className="disabled" disabled>
            ...
          </button>
        );
      }

      if (currentPage === 1) {
        for (let i = currentPage; i <= currentPage + 2; i++) {
          buttons.push(
            <button
              key={i}
              onClick={() => paginate(type, i)}
              className={currentPage === i ? "active" : ""}
            >
              {i}
            </button>
          );
        }
      } else if (currentPage === totalPages) {
        for (let i = currentPage - 2; i <= currentPage; i++) {
          buttons.push(
            <button
              key={i}
              onClick={() => paginate(type, i)}
              className={currentPage === i ? "active" : ""}
            >
              {i}
            </button>
          );
        }
      } else {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          buttons.push(
            <button
              key={i}
              onClick={() => paginate(type, i)}
              className={currentPage === i ? "active" : ""}
            >
              {i}
            </button>
          );
        }
      }

      if (currentPage < totalPages - 1) {
        buttons.push(
          <button key="dots2" className="disabled" disabled>
            ...
          </button>
        );
      }
    }

    buttons.push(
      <button
        key="next"
        onClick={() => paginate(type, currentPage + 1)}
        disabled={currentPage === totalPages}
        className="page-nav"
        title="Nächste Seite"
      >
        &gt;
      </button>
    );

    buttons.push(
      <button
        key="last"
        onClick={() => paginate(type, totalPages)}
        disabled={currentPage === totalPages}
        className="page-nav"
        title="Letzte Seite"
      >
        &gt;&gt;
      </button>
    );

    return buttons;
  };

  const toggleTypeExpand = useCallback((type) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const getStatusCountsByType = useMemo(() => {
    return messages.reduce((acc, message) => {
      if (!message.calendar || !message.status) return acc;

      if (!acc[message.calendar]) {
        acc[message.calendar] = {};
      }

      acc[message.calendar][message.status] =
        (acc[message.calendar][message.status] || 0) + 1;
      return acc;
    }, {});
  }, [messages]);

  const getTypeCountsByCalendar = useMemo(() => {
    return messages.reduce((acc, message) => {
      if (!message.calendar || !message.messageType) return acc;

      if (!acc[message.calendar]) {
        acc[message.calendar] = {};
      }

      acc[message.calendar][message.messageType] =
        (acc[message.calendar][message.messageType] || 0) + 1;
      return acc;
    }, {});
  }, [messages]);

  const filteredMessagesByType = useMemo(() => {
    const filtered = messages.filter(
      (message) =>
        (message.artistName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (message.phoneNumber || "").includes(searchTerm) ||
        (message.messageType || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.calendar || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc, message) => {
      const type = message.calendar || "Unbekannt";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(message);
      return acc;
    }, {});
  }, [messages, searchTerm]);

  const types = useMemo(
    () => Object.keys(filteredMessagesByType).sort(),
    [filteredMessagesByType]
  );

  const totalFilteredMessages = useMemo(
    () => Object.values(filteredMessagesByType).flat().length,
    [filteredMessagesByType]
  );

  const typeHasMatch = useCallback(
    (type) => {
      return (
        filteredMessagesByType[type] && filteredMessagesByType[type].length > 0
      );
    },
    [filteredMessagesByType]
  );

  const handleRefresh = useCallback(() => {
    setMessages([]);
    setError(null);
    setWarning(null);
    fetchMessages();
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Datum unbekannt";
    const date = new Date(dateString);
    return date.toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Sent":
        return <CheckCircle className="text-success" />;
      case "Delivered":
        return <CheckCircle className="text-primary" />;
      case "Read":
        return <CheckCircle className="text-info" />;
      case "Pending":
        return <Clock className="text-warning" />;
      case "Failed":
        return <ExclamationTriangle className="text-danger" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Sent":
        return "Gesendet";
      case "Delivered":
        return "Zugestellt";
      case "Read":
        return "Gelesen";
      case "Pending":
        return "Ausstehend";
      case "Failed":
        return "Fehlgeschlagen";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <DashboardLayout handleLogout={handleLogout} setAuth={setAuth} >
        <DashboardLoader message={loadingMessage} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout handleLogout={handleLogout} setAuth={setAuth} onRefresh={handleRefresh}>
      <div className="unassigned-events-dashboard">
        {!loading && (
        <div className="transparent-header-container">
          <h1 className="dashboard-main-title">WhatsApp Nachrichten</h1>
          <div className="header-search-box">
            <SearchBox
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Suche nach Künstler, Telefon, Nachricht oder Typ"
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

        <div className="message-type-glossary-vertical">
          <h5 className="glossary-title">Nachrichten Typen Legende:</h5>
          <div className="glossary-items-vertical">
            {messageTypes.map(({ type, label, icon, class: typeClass, tooltip }) => (
              <div
                key={type}
                className={`glossary-item-vertical ${typeClass.replace('type-badge-', '')}-glossaryitem`}
                data-tooltip={tooltip}
              >
                <div className={`icon-badge ${typeClass}`}>
                  {icon}
                </div>
                <span className="glossary-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="events-container">
          {totalFilteredMessages === 0 && !searchTerm ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Whatsapp size={48} />
              </div>
              <p className="empty-state-message">Keine Nachrichten gefunden.</p>
            </div>
          ) : (
            calendarTypes.map((type) => {
              const hasMessages = filteredMessagesByType[type]?.length > 0;
              const isFilteredOut = searchTerm && !typeHasMatch(type);
              const currentPage = currentPages[type] || 1;
              const perPage = getMessagesPerPage(type);
              const indexOfLastMessage = currentPage * perPage;
              const indexOfFirstMessage = indexOfLastMessage - perPage;
              const currentMessages = hasMessages
                ? filteredMessagesByType[type].slice(
                    indexOfFirstMessage,
                    indexOfLastMessage
                  )
                : [];

              return (
                <div
                  key={type}
                  className={`event-calendar-card ${
                    isFilteredOut ? "filtered-out" : ""
                  }`}
                >
                  <div
                    className="calendar-header"
                    onClick={() => toggleTypeExpand(type)}
                  >
                    <div className="header-content">
                      <div className="title-with-icon">
                        <h5 className="calendar-title">{type}</h5>
                        <div className="dropdown-toggle-icon">
                          {expandedTypes[type] ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </div>
                      </div>

                      <div className="badges-container">
                        <div className="type-badge-container d-none d-md-flex">
                          {messageTypes.map(
                            ({
                              type: messageType,
                              icon,
                              class: typeClass,
                              label,
                              tooltip,
                            }) => {
                              const count =
                                (getTypeCountsByCalendar[type] &&
                                  getTypeCountsByCalendar[type][messageType]) ||
                                0;
                              return (
                                <div
                                  key={messageType}
                                  className={`icon-badge icon-title ${typeClass} ${
                                    count === 0 ? "zero-count" : ""
                                  }`}
                                  data-tooltip={tooltip}
                                >
                                  {icon}
                                  <span className="badge-count">{count}</span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <span className="events-count">
                        <span className="count-number">
                          {hasMessages ? filteredMessagesByType[type].length : 0}
                        </span>
                        <span className="count-label">
                          {hasMessages
                            ? filteredMessagesByType[type].length === 1
                              ? " Nachricht"
                              : " Nachrichten"
                            : " Nachrichten"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {expandedTypes[type] && (
                    <div className="calendar-content">
                      {hasMessages ? (
                        <>
                          <div className="table-responsive d-none d-md-block">
                            <Table className="events-table">
                              <thead>
                                <tr>
                                  <th>Künstler</th>
                                  <th>Telefon</th>
                                  <th>Status</th>
                                  <th>Nachricht</th>
                                  <th>Gesendet am</th>
                                  <th>Typ</th>
                                  <th>Aktion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentMessages.map((message, index) => (
                                  <tr key={index} className="event-row">
                                    <td className="event-details">
                                      <div className="event-title">
                                        {message.artistName}
                                      </div>
                                    </td>
                                    <td className="event-details">
                                      <div className="event-title">
                                        {message.phoneNumber}
                                      </div>
                                    </td>
                                    <td className="event-roles">
                                      <Badge
                                        bg={
                                          message.status === "Sent" || message.status === "Delivered" || message.status === "Read"
                                            ? "success"
                                            : message.status === "Failed"
                                            ? "danger"
                                            : message.status === "Pending"
                                            ? "warning"
                                            : "secondary"
                                        }
                                        className="role-badge"
                                      >
                                        {getStatusIcon(message.status)} {getStatusText(message.status)}
                                      </Badge>
                                    </td>
                                    <td className="event-time">
                                      <div className="event-title">
                                        {message.content}
                                      </div>
                                    </td>
                                    <td className="event-time">
                                      <div className="event-title">
                                        {formatDate(message.sentOn)}
                                      </div>
                                    </td>
                                    <td className="event-time">
                                      <div className="event-title">
                                        {messageTypes.find(t => t.type === message.messageType)?.label || message.messageType}
                                      </div>
                                    </td>
                                    <td className="event-actions">
                                      <Link
                                        to={`/whatsapp/${message.id}`}
                                        target="_blank"
                                        className="btn btn-outline-primary btn-sm open-calendar-button"
                                      >
                                        <Whatsapp className="button-icon" />
                                        <span className="d-none d-md-inline">
                                          Details
                                        </span>
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>

                          <div className="event-cards-container d-md-none">
                            {currentMessages.map((message, index) => (
                              <div key={index} className="event-mobile-card">
                                <div className="event-mobile-header">
                                  <div className="event-mobile-title">
                                    {message.artistName}
                                  </div>
                                  <Badge
                                    bg={
                                      message.status === "Sent" || message.status === "Delivered" || message.status === "Read"
                                        ? "success"
                                        : message.status === "Failed"
                                        ? "danger"
                                        : message.status === "Pending"
                                        ? "warning"
                                        : "secondary"
                                    }
                                    className="role-badge"
                                  >
                                    {getStatusIcon(message.status)} {getStatusText(message.status)}
                                  </Badge>
                                </div>

                                <div className="event-mobile-content">
                                  <div className="event-mobile-details">
                                    <div className="event-mobile-phone">
                                      <i className="bi bi-telephone"></i> {message.phoneNumber}
                                    </div>
                                    <div className="event-mobile-message">
                                      <i className="bi bi-chat-left-text"></i> {message.content}
                                    </div>
                                    <div className="event-mobile-datetime">
                                      <i className="bi bi-calendar-event"></i> {formatDate(message.sentOn)}
                                    </div>
                                    <div className="event-mobile-type">
                                      <i className="bi bi-tag"></i> {messageTypes.find(t => t.type === message.messageType)?.label || message.messageType}
                                    </div>
                                  </div>

                                  <div className="event-mobile-actions">
                                    <Link
                                      to={`/whatsapp/${message.id}`}
                                      target="_blank"
                                      className="btn btn-outline-primary btn-sm open-calendar-button"
                                    >
                                      <Whatsapp className="button-icon" />
                                      <span className="button-text">
                                        Details
                                      </span>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pagination-controls">
                            <div className="per-page-selector">
                              <span>Nachrichten pro Seite:</span>
                              <select
                                value={getMessagesPerPage(type)}
                                onChange={(e) =>
                                  handleMessagesPerPageChange(
                                    type,
                                    e.target.value
                                  )
                                }
                                className="per-page-select"
                              >
                                <option value="5">5</option>
                                <option value="7">7</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="40">40</option>
                                <option value="50">50</option>
                              </select>
                            </div>

                            {filteredMessagesByType[type].length >
                              getMessagesPerPage(type) && (
                              <div className="pagination">
                                {renderPaginationButtons(
                                  type,
                                  filteredMessagesByType[type]
                                )}
                              </div>
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
                          Keine Nachrichten in dieser Kategorie.
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

export default WhatsAppListDashboard;