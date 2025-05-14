import React, { useState } from "react";
import EmailModal from "./EmailModel";

const EmailTable = ({ emails = [] }) => {
  console.log("Emails:", emails);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const emailsPerPage = 15;

  // Sort emails by date in descending order (newest first)
  const sortedEmails = [...emails].sort((a, b) => {
    const dateA = getDateValue(a.date);
    const dateB = getDateValue(b.date);
    return dateB - dateA; // Sort newest first
  });

  // Helper function to get date value for sorting
  function getDateValue(dateInput) {
    if (typeof dateInput === "string") {
      return new Date(dateInput).getTime();
    }
    if (dateInput?.$date?.$numberLong) {
      return parseInt(dateInput.$date.$numberLong);
    }
    if (dateInput instanceof Date) {
      return dateInput.getTime();
    }
    return 0;
  }

  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = sortedEmails.slice(indexOfFirstEmail, indexOfLastEmail);
  const totalPages = Math.ceil(sortedEmails.length / emailsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;

    const buttons = [];

    // Always show << (first page) button
    buttons.push(
      <button
        key="first"
        onClick={() => paginate(1)}
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
        onClick={() => paginate(currentPage - 1)}
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
            onClick={() => paginate(i)}
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
              onClick={() => paginate(i)}
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
              onClick={() => paginate(i)}
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
              onClick={() => paginate(i)}
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
        onClick={() => paginate(currentPage + 1)}
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
        onClick={() => paginate(totalPages)}
        disabled={currentPage === totalPages}
        className="page-nav"
        title="Letzte Seite"
      >
        &gt;&gt;
      </button>
    );

    return buttons;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Invitation":
        return "type-invitation";
      case "New Deal":
        return "type-new-deal";
      case "Update Deal":
        return "type-update-deal";
      case "Cancel Deal":
        return "type-cancel-deal";
      case "Reminder":
        return "type-reminder";
      case "Follow Up":
        return "type-follow-up";
      default:
        return "type-default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "status-delivered";
      case "Pending":
        return "status-pending";
      case "Failed":
        return "status-failed";
      case "Opened":
        return "status-opened";
      case "Sent":
        return "status-sent";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return "bi-check-circle-fill";
      case "Pending":
        return "bi-hourglass-split";
      case "Failed":
        return "bi-x-circle-fill";
      case "Opened":
        return "bi-envelope-open-fill";
      case "Sent":
        return "bi-send-fill";
      default:
        return "bi-envelope";
    }
  };

  const handleShowModal = (email) => {
    setSelectedEmail(email);
    setShowModal(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmail(null);
    document.body.style.overflow = "auto";
  };

  const formatDate = (dateInput) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    if (typeof dateInput === "string") {
      try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
          return "N/A";
        }
        return date.toLocaleString("de-DE", options);
      } catch (e) {
        return "N/A";
      }
    }

    if (dateInput && dateInput.$date && dateInput.$date.$numberLong) {
      try {
        const timestamp = dateInput.$date.$numberLong;
        const date = new Date(parseInt(timestamp));
        if (isNaN(date.getTime())) {
          return "N/A";
        }
        return date.toLocaleString("de-DE", options);
      } catch (e) {
        return "N/A";
      }
    }

    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        return "N/A";
      }
      return dateInput.toLocaleString("de-DE", options);
    }

    return "N/A";
  };

  // Translate status to German
  const translateStatus = (status) => {
    switch(status) {
      case 'Delivered': return 'Zugestellt';
      case 'Sent': return 'Gesendet';
      case 'Pending': return 'Ausstehend';
      case 'Failed': return 'Fehlgeschlagen';
      case 'Opened': return 'Geöffnet';
      default: return status || 'N/A';
    }
  };

  // Translate type to German
  const translateType = (type) => {
    switch(type) {
      case 'Invitation': return 'Einladung';
      case 'New Deal': return 'Neues Angebot';
      case 'Update Deal': return 'Angebotsaktualisierung';
      case 'Cancel Deal': return 'Angebotsstornierung';
      case 'Reminder': return 'Erinnerung';
      case 'Follow Up': return 'Nachverfolgung';
      default: return type || 'N/A';
    }
  };

  return (
    <div className="email-table-container">
      {/* Desktop Table View */}
      <div className="table-responsive d-none d-md-block">
        <table className="email-table">
          <thead className="email-table-header">
            <tr>
              <th>Gesendet an</th>
              <th>Status</th>
              <th>Betreff</th>
              <th>Versand am</th>
              <th>Typ</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {currentEmails.map((email) => (
              <tr key={email._id?.$oid || email.id}>
                <td data-label="To">{email.email}</td>
                <td data-label="Status">
                  <span className={`status-badge ${getStatusColor(email.status)}`}>
                    {translateStatus(email.status)}
                  </span>
                </td>
                <td data-label="Subject">{email.subject}</td>
                <td data-label="Sent At">{formatDate(email.date)}</td>
                <td data-label="Type">
                  <span className={`type-badge ${getTypeColor(email.type)}`}>
                    {translateType(email.type)}
                  </span>
                </td>
                <td data-label="Action">
                  <button
                    className="details-button"
                    onClick={() => handleShowModal(email)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="d-md-none">
        {currentEmails.map((email) => (
          <div key={email._id?.$oid || email.id} className="email-card">
            <div className="email-card-header">
              <div className="email-card-status">
                <i
                  className={`bi ${getStatusIcon(email.status)} ${getStatusColor(email.status)} me-2`}
                  style={{ padding: "3px 6px", fontSize: "14px", borderRadius: "8px" }}
                ></i>
                <span className={`status-badge ${getStatusColor(email.status)}`}>
                  {translateStatus(email.status)}
                </span>
              </div>
              <div className="email-card-date">
                <i className="bi bi-calendar me-2"></i>
                {formatDate(email.date)}
              </div>
            </div>
            <div className="email-card-body">
              <div className="email-card-row">
                <i className="bi bi-envelope me-2"></i>
                <strong>{email.email}</strong>
              </div>
              <div className="email-card-row">
                <i className="bi bi-card-text me-2"></i>
                <strong>{email.subject}</strong>
              </div>
              <div className="email-card-row">
                <i className="bi bi-tag me-2"></i>
                <strong>{translateType(email.type)}</strong>
              </div>
            </div>
            <div className="email-card-footer">
              <button
                className="details-button"
                onClick={() => handleShowModal(email)}
              >
                <i className="bi bi-three-dots text-primary"></i> Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">{renderPaginationButtons()}</div>
      )}

      {/* Email Details Modal */}
      {showModal && (
        <EmailModal email={selectedEmail} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default EmailTable;