import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Table, Alert, Badge } from "react-bootstrap";
import {
  Telephone,
  ArrowClockwise,
  Envelope,
  ChevronDown,
  ChevronUp,
  EnvelopeOpen,
  PlusCircle,
  ArrowRepeat,
  XCircle,
  Bell,
  CameraVideo,
  ArrowReturnRight,
} from "react-bootstrap-icons";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import api, { getEmails } from "../utils/api";
import DashboardLoader from "../components/DashboardLoader";
import EmailModal from "../components/EmailModel";

function EmailListDashboard({ setAuth }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "E-Mails werden geladen..."
  );
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [expandedTypes, setExpandedTypes] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentPages, setCurrentPages] = useState({});
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailsPerPageConfig, setEmailsPerPageConfig] = useState({});

  const emailTypes = [
    {
      type: "Invitation",
      label: "Einladung",
      icon: <EnvelopeOpen size={14} />,
      class: "type-badge-invitation",
      tooltip:
        "Einladung zum Google-Kalender – enthält Zugriff auf alle zugewiesenen Termine.",
    },
    {
      type: "New Deal",
      label: "Neuer Job",
      icon: <PlusCircle size={14} />,
      class: "type-badge-new-deal",
      tooltip:
        "Info über einen neu verfügbaren Job – mit der Möglichkeit, sich direkt im Google Kalender einzutragen.",
    },
     {
      type: "Follow Up",
      label: "Job noch offen",
      icon: <ArrowReturnRight size={14} />,
      class: "type-badge-follow-up",
      tooltip:
        "Tägliche E-Mail um 15 Uhr – Hinweis für Künstler, dass noch offene Jobs verfügbar sind und eine Eintragung im Kalender möglich ist.",
    },
    {
      type: "Update Deal",
      label: "Update",
      icon: <ArrowRepeat size={14} />,
      class: "type-badge-update-deal",
      tooltip:
        "Aktualisierte Informationen zu einem bestehenden Job im – z. B. Änderungen bei Uhrzeit oder Ort.",
    },
    {
      type: "Cancel Deal",
      label: "Absage",
      icon: <XCircle size={14} />,
      class: "type-badge-cancel-deal",
      tooltip: "Benachrichtigung, dass ein Job abgesagt wurde",
    },
    {
      type: "Reminder",
      label: "Event-Erinnerung",
      icon: <Bell size={14} />,
      class: "type-badge-reminder",
      tooltip:
        "Erinnerung an Künstler für bereits zugesagten Job – wird ein Tag  vor Eventbeginn um 12:00 Uhr versendet.",
    },
    {
      type: "Reminder Photos Videos",
      label: "Fotos/Videos Erinnerung",
      icon: <CameraVideo size={14} />,
      class: "type-badge-reminder-photos-videos",
      tooltip:
        "Erinnerung an den Künstler, 30 Minuten vor dem Auftritt vor Ort – Fotos und kurze Videos seines Auftritts zu machen.",
    },
    {
      type: "Performance Email",
      label: "Performance-Bericht",
      icon: <Telephone size={14} />,
      class: "type-badge-performance",
      tooltip: "Erinnerung an den Künstler, sich ca. 30 Minuten nach dem Event per WhatsApp oder Telefon zu melden – für Feedback zum Ablauf.",
    },
  ];

  const calendarTypes = [
    "Geigen Mitmachkonzert",
    "Klavier Mitmachkonzert",
    "Laternenumzug mit Musik",
    "Nikolaus Besuch",
    "Puppentheater",
    "Weihnachts Mitmachkonzert",
  ];

  const emailsPerPage = 7;

  const getEmailsPerPage = (type) => {
    return emailsPerPageConfig[type] || emailsPerPage;
  };

  const handleEmailsPerPageChange = (type, value) => {
    setEmailsPerPageConfig(prev => ({
      ...prev,
      [type]: parseInt(value) || emailsPerPage
    }));
    // Reset to first page when changing items per page
    setCurrentPages(prev => ({
      ...prev,
      [type]: 1
    }));
  };

  const fetchEmails = async (options = {}) => {
    const {
      showLoading = true,
      isPolling = false,
      forceRefresh = false,
    } = options;

    if (showLoading && !isPolling) {
      setLoading(true);
      setLoadingMessage("E-Mails werden geladen...");
    }

    try {
      console.log("Fetching emails with options:", options);

      const response = await getEmails();

      console.log("Response received:", response.data);

      if (response.data.status === "loading") {
        if (!polling) {
          setPolling(true);
          setPollingAttempts(1);

          if (showLoading) {
            setLoading(true);
            setLoadingMessage(
              "Daten werden vom E-Mail-Service geladen. Dies kann einen Moment dauern..."
            );
          }

          setTimeout(() => pollForEmails(), 2000);
        }
      } else {
        setPolling(false);

        // ✅ Sort by date (newest first)
        const sortedEmails = [...(response.data || [])].sort((a, b) => {
          return new Date(b.date) - new Date(a.date); // descending
        });

        setEmails(sortedEmails);
        setWarning(response.data.warning || null);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching emails:", err);
      setError("Fehler beim Laden der E-Mails");
      setPolling(false);
      setLoading(false);
    }
  };

  const pollForEmails = async () => {
    setPollingAttempts((prev) => prev + 1);
    console.log(`Polling attempt ${pollingAttempts}`);

    try {
      const response = await getEmails();

      console.log("Polling response:", response.data);

      if (!response.data.status || response.data.status !== "loading") {
        setEmails(response.data || []);
        setWarning(response.data.warning || null);
        setError(null);
        setPolling(false);
        setLoading(false);
      } else if (pollingAttempts < 24) {
        setTimeout(() => pollForEmails(), 5000);
      } else {
        setPolling(false);
        setLoading(false);
        setWarning(
          "Timeout beim Laden der Daten. Bitte aktualisieren Sie die Seite oder versuchen Sie es später erneut."
        );

        try {
          const longTimeoutResponse = await getEmails();

          setEmails(longTimeoutResponse.data || []);
          setWarning(longTimeoutResponse.data.warning || null);
        } catch (finalErr) {
          console.error("Final attempt error:", finalErr);
        }
      }
    } catch (err) {
      console.error("Error during polling:", err);
      setPolling(false);
      setLoading(false);
      setError("Fehler beim Laden der E-Mails");
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (emails.length > 0) {
      const initialExpandState = {};
      const initialPagesState = {};
      calendarTypes.forEach((type) => {
        initialExpandState[type] = true;
        initialPagesState[type] = 1;
      });
      setExpandedTypes(initialExpandState);
      setCurrentPages(initialPagesState);
    }
  }, [emails]);

  const paginate = (type, pageNumber) => {
    setCurrentPages((prev) => ({
      ...prev,
      [type]: pageNumber,
    }));
  };

  const renderPaginationButtons = (type, filteredEmails) => {
    const perPage = getEmailsPerPage(type);
    const totalPages = Math.ceil(filteredEmails.length / perPage);
    const currentPage = currentPages[type] || 1;

    if (totalPages <= 1) return null;

    const buttons = [];

    // Always show << (first page) button
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

    // Always show < (previous page) button
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
      // Show all pages if total pages is 3 or less
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
      // Show current page and adjacent pages
      if (currentPage > 2) {
        buttons.push(
          <button key="dots1" className="disabled" disabled>
            ...
          </button>
        );
      }

      if (currentPage === 1) {
        // Show current page and next two pages
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
        // Show current page and previous two pages
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
        // Show previous, current, and next page
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

    // Always show > (next page) button
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

    // Always show >> (last page) button
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

  const getStatusCounts = () => {
    return emails.reduce((acc, email) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {});
  };

  const getStatusCountsByType = useMemo(() => {
    return emails.reduce((acc, email) => {
      if (!email.calendar || !email.status) return acc;

      if (!acc[email.calendar]) {
        acc[email.calendar] = {};
      }

      acc[email.calendar][email.status] =
        (acc[email.calendar][email.status] || 0) + 1;
      return acc;
    }, {});
  }, [emails]);

  const getTypeCountsByCalendar = useMemo(() => {
    return emails.reduce((acc, email) => {
      if (!email.calendar || !email.type) return acc;

      if (!acc[email.calendar]) {
        acc[email.calendar] = {};
      }

      acc[email.calendar][email.type] =
        (acc[email.calendar][email.type] || 0) + 1;
      return acc;
    }, {});
  }, [emails]);

  const filteredEmailsByType = useMemo(() => {
    const filtered = emails.filter(
      (email) =>
        (email.subject || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (email.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (email.calendar || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc, email) => {
      const type = email.calendar || "Unbekannt";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(email);
      return acc;
    }, {});
  }, [emails, searchTerm]);

  const types = useMemo(
    () => Object.keys(filteredEmailsByType).sort(),
    [filteredEmailsByType]
  );

  const totalFilteredEmails = useMemo(
    () => Object.values(filteredEmailsByType).flat().length,
    [filteredEmailsByType]
  );

  const typeHasMatch = useCallback(
    (type) => {
      return (
        filteredEmailsByType[type] && filteredEmailsByType[type].length > 0
      );
    },
    [filteredEmailsByType]
  );

  const handleRefresh = useCallback(() => {
    setEmails([]);
    setError(null);
    setWarning(null);
    fetchEmails({ forceRefresh: true });
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const formatDate = (dateString) => {
    console.log("Formatting date:", dateString);
    if (!dateString) return "Datum unbekannt";

    const date = new Date(dateString);
    console.log("Parsed date:", date);
    return date.toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout setAuth={setAuth} pageTitle="E-Mail Liste">
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
    <DashboardLayout setAuth={setAuth} onRefresh={handleRefresh}>
      <div className="unassigned-events-dashboard">
        {/* Header section with vertically centered heading and search bar */}
        <div className="transparent-header-container">
          <h1 className="dashboard-main-title">E-Mail Liste</h1>
          <div className="header-search-box">
            <SearchBox
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Suche nach Emails, Empfänger, Betreff oder Typ"
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

        {/* Glossary/Legend Section - Vertical Layout */}
        <div className="email-type-glossary-vertical">
          <h5 className="glossary-title">E-Mail Typen Legende:</h5>
          <div className="glossary-items-vertical">
            {/* Invitation */}
            <div
              className="glossary-item-vertical invitation-glossaryitem"
              data-tooltip="Einladung zum Google-Kalender – enthält Zugriff auf alle zugewiesenen Termine."
            >
              <div className="icon-badge type-badge-invitation">
                <EnvelopeOpen size={16} />
              </div>
              <span className="glossary-label">Einladung</span>
            </div>
             {/* New Deal */}
            <div
              className="glossary-item-vertical new-deal-glossaryitem"
              data-tooltip="Info über einen neu verfügbaren Job – mit der Möglichkeit, sich direkt im Google Kalender einzutragen."
            >
              <div className="icon-badge type-badge-new-deal">
                <PlusCircle size={16} />
              </div>
              <span className="glossary-label">Neuer Job</span>
            </div>
             {/* Follow Up */}
            <div
              className="glossary-item-vertical follow-up-glossaryitem"
              data-tooltip="Tägliche E-Mail um 15 Uhr – Hinweis für Künstler, dass noch offene Jobs verfügbar sind und eine Eintragung im Kalender möglich ist."
            >
              <div className="icon-badge type-badge-follow-up">
                <ArrowReturnRight size={16} />
              </div>
              <span className="glossary-label"> Job noch offen</span>
            </div>
              {/* Update Deal */}
            <div
              className="glossary-item-vertical update-deal-glossaryitem"
              data-tooltip="Aktualisierte Informationen zu einem bestehenden Job im – z. B. Änderungen bei Uhrzeit oder Ort."
            >
              <div className="icon-badge type-badge-update-deal">
                <ArrowRepeat size={16} />
              </div>
              <span className="glossary-label">Update</span>
            </div>
            {/* Cancel Deal */}
            <div
              className="glossary-item-vertical cancel-deal-glossaryitem"
              data-tooltip="Benachrichtigung, dass ein Job abgesagt wurde."
            >
              <div className="icon-badge type-badge-cancel-deal">
                <XCircle size={16} />
              </div>
              <span className="glossary-label">Absage</span>
            </div>
            {/* Reminder */}
            <div
              className="glossary-item-vertical reminder-glossaryitem"
              data-tooltip="Erinnerung an Künstler für bereits zugesagten Job – wird ein Tag  vor Eventbeginn um 12:00 Uhr versendet."
            >
              <div className="icon-badge type-badge-reminder">
                <Bell size={16} />
              </div>
              <span className="glossary-label">Event-Erinnerung</span>
            </div>
             {/* Reminder Photos Videos */}
            <div
              className="glossary-item-vertical reminder-photos-videos-glossaryitem"
              data-tooltip="Erinnerung an den Künstler, 30 Minuten vor dem Auftritt vor Ort – Fotos und kurze Videos seines Auftritts zu machen."
            >
              <div className="icon-badge type-badge-reminder-photos-videos">
                <CameraVideo size={16} />
              </div>
              <span className="glossary-label">Fotos/Videos Erinnerung</span>
            </div>
            {/* Performance Email */}
            <div
              className="glossary-item-vertical performance-glossaryitem"
              data-tooltip="Erinnerung an den Künstler, sich ca. 30 Minuten nach dem Event per WhatsApp oder Telefon zu melden – für Feedback zum Ablauf."
            >
              <div className="icon-badge type-badge-performance">
                <Telephone size={16} />
              </div>
              <span className="glossary-label">Performance-Bericht</span>
            </div>
          </div>
        </div>

        {/* Events Container */}
        <div className="events-container">
          {totalFilteredEmails === 0 && !searchTerm ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Envelope size={48} />
              </div>
              <p className="empty-state-message">Keine E-Mails gefunden.</p>
            </div>
          ) : (
            calendarTypes.map((type) => {
              const hasEmails = filteredEmailsByType[type]?.length > 0;
              const isFilteredOut = searchTerm && !typeHasMatch(type);
              const currentPage = currentPages[type] || 1;
              const perPage = getEmailsPerPage(type);
              const indexOfLastEmail = currentPage * perPage;
              const indexOfFirstEmail = indexOfLastEmail - perPage;
              const currentEmails = hasEmails
                ? filteredEmailsByType[type].slice(
                    indexOfFirstEmail,
                    indexOfLastEmail
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
                        {/* Status badges (left side) */}
                        {getStatusCountsByType[type] &&
                          Object.entries(getStatusCountsByType[type]).length >
                            0 && (
                            <></>
                          )}
                        <div className="type-badge-container d-none d-md-flex">
                            {emailTypes.map(({ type: emailType, icon, class: typeClass, label, tooltip }) => {
                    const count = (getTypeCountsByCalendar[type] && getTypeCountsByCalendar[type][emailType]) || 0;
                    return (
                      <div
                        key={emailType}
                        className={`icon-badge icon-title ${typeClass} ${count === 0 ? "zero-count" : ""}`}
                        data-tooltip={tooltip}
                      >
                        {icon}
                        <span className="badge-count">{count}</span>
                      </div>
                    );
                  })}
                        </div>
                      </div>

                      <span className="events-count">
                        <span className="count-number">
                          {hasEmails ? filteredEmailsByType[type].length : 0}
                        </span>
                        <span className="count-label">
                          {hasEmails
                            ? filteredEmailsByType[type].length === 1
                              ? " E-Mail"
                              : " E-Mails"
                            : " E-Mails"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {expandedTypes[type] && (
                    <div className="calendar-content">
                      {hasEmails ? (
                        <>
                          {/* Regular table for desktop */}
                          <div className="table-responsive d-none d-md-block">
                            <Table className="events-table">
                              <thead>
                                <tr>
                                  <th>E-Mail</th>
                                  <th>Status</th>
                                  <th>Betreff</th>
                                  <th>Datum/Uhrzeit</th>
                                  <th>Typ</th>
                                  <th>Aktion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentEmails.map((email, index) => (
                                  <tr key={index} className="event-row">
                                    <td className="event-details">
                                      <div className="event-title">
                                        {email.email}
                                      </div>
                                    </td>
                                     <td className="event-roles">
                                      <Badge
                                        bg={
                                          email.status === "Sent"
                                            ? "success"
                                            : email.status === "Failed"
                                            ? "danger"
                                            : email.status === "Pending"
                                            ? "warning"
                                            : "secondary"
                                        }
                                        className="role-badge"
                                      >
                                        {email.status === "Sent"
                                          ? "Gesendet"
                                          : email.status === "Failed"
                                          ? "Fehlgeschlagen"
                                          : email.status === "Pending"
                                          ? "Ausstehend"
                                          : email.status}
                                      </Badge>
                                    </td>
                                    <td className="event-time">
                                      <div className="event-title">
                                        {email.subject}
                                      </div>
                                    </td>
                                    <td className="event-time">
                                      <div className="event-title">
                                        {formatDate(email.date)}
                                      </div>
                                    </td>
                                    <td className="event-time">
                                      <div className="event-title">
                                        {email.type === "Invitation"
                                          ? "Einladung"
                                          : email.type === "New Deal"
                                          ? "Neuer Job"
                                          : email.type === "Cancel Deal"
                                          ? "Absage"
                                          : email.type === "Update Deal"
                                          ? "Update"
                                          : email.type === "Reminder"
                                          ? "Event-Erinnerung"
                                          : email.type === "Follow Up"
                                          ? "Job noch offen"
                                          : email.type === "Performance Email"
                                          ? "Performance-Bericht"
                                          : email.type}
                                      </div>
                                    </td>
                                    <td className="event-actions">
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => setSelectedEmail(email)}
                                        className="open-calendar-button"
                                      >
                                        <Envelope className="button-icon" />
                                        <span className="d-none d-md-inline">
                                          Details
                                        </span>
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>

                          {/* Mobile-friendly cards for small screens */}
                          <div className="event-cards-container d-md-none">
                            {currentEmails.map((email, index) => (
                              <div key={index} className="event-mobile-card">
                                <div className="event-mobile-header">
                                  <div className="event-mobile-title">
                                    {email.subject}
                                  </div>
                                  <Badge
                                    bg={
                                      email.status === "Sent"
                                        ? "success"
                                        : email.status === "Failed"
                                        ? "danger"
                                        : email.status === "Pending"
                                        ? "warning"
                                        : "secondary"
                                    }
                                    className="role-badge"
                                  >
                                    {email.status === "Sent"
                                      ? "Gesendet"
                                      : email.status === "Failed"
                                      ? "Fehlgeschlagen"
                                      : email.status === "Pending"
                                      ? "Ausstehend"
                                      : email.status}
                                  </Badge>
                                </div>

                                <div className="event-mobile-content">
                                  <div className="event-mobile-roles">
                                    <div className="event-mobile-location">
                                      <i className="bi bi-envelope"></i>{" "}
                                      {email.email}
                                    </div>
                                  </div>

                                  <div className="event-mobile-details">
                                    <div className="event-mobile-datetime">
                                      <i className="bi bi-calendar-event"></i>{" "}
                                      {formatDate(email.date)}
                                    </div>
                                    <div className="event-mobile-type">
                                      <i className="bi bi-tag"></i> {email.type}
                                    </div>
                                  </div>

                                  <div className="event-mobile-actions">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => setSelectedEmail(email)}
                                      className="open-calendar-button"
                                    >
                                      <Envelope className="button-icon" />
                                      <span className="button-text">
                                        Details
                                      </span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pagination */}
                          <div className="pagination-controls">
                            <div className="per-page-selector">
                              <span>E-Mails pro Seite:</span>
                              <select
                                value={getEmailsPerPage(type)}
                                onChange={(e) => handleEmailsPerPageChange(type, e.target.value)}
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
                                <option value="60">60</option>
                                <option value="70">70</option>
                                <option value="80">80</option>
                                <option value="90">90</option>
                                <option value="100">100</option>
                                <option value="125">125</option>
                                <option value="150">150</option>
                              </select>
                            </div>
                            
                            {filteredEmailsByType[type].length > getEmailsPerPage(type) && (
                              <div className="pagination">
                                {renderPaginationButtons(
                                  type,
                                  filteredEmailsByType[type]
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
                          Keine E-Mails in dieser Kategorie.
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
      {selectedEmail && (
        <EmailModal
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
        />
      )}
    </DashboardLayout>
  );
}

export default EmailListDashboard;