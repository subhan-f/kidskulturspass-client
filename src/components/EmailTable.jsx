import React, { useState } from "react";
import EmailModal from "./EmailModel";

const EmailTable = ({ emails = [] }) => {
  console.log("Emails:", emails);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const emailsPerPage = 5;

  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = emails.slice(indexOfFirstEmail, indexOfLastEmail);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
    document.body.style.overflow = "hidden"; // Prevent body scrolling when modal is open
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmail(null);
    document.body.style.overflow = "auto"; // Re-enable body scrolling
  };

  const formatDate = (dateInput) => {
    if (typeof dateInput === "string") {
      try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
          return "N/A";
        }
        return date.toLocaleDateString();
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
        return date.toLocaleDateString();
      } catch (e) {
        return "N/A";
      }
    }

    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        return "N/A";
      }
      return dateInput.toLocaleDateString();
    }

    return "N/A";
  };

  return (
    <div className="email-table-container">
      {/* Desktop Table View */}
      <div className="table-responsive d-none d-md-block">
        <table className="email-table">
          <thead>
            <tr>
              <th>Gesendet an</th>
              <th>Status</th>
              <th>Betreff</th>
              <th>Versand am</th>
              <th>Typ</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentEmails.map((email) => (
              <tr key={email._id.$oid}>
                <td data-label="To">{email.email}</td>
                <td data-label="Status">
                  <span
                    className={`status-badge ${getStatusColor(email.status)}`}
                  >
                    {email.status =="Sent"?"Gesendet":email.status}
                  </span>
                </td>
                <td data-label="Subject">{email.subject}</td>
                <td data-label="Sent At">{formatDate(email.date)}</td>
                <td data-label="Type">{email.type}</td>
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
          <div key={email._id.$oid} className="email-card">
            <div className="email-card-header">
              <div className="email-card-status">
                <i
                  className={`bi ${getStatusIcon(
                    email.status
                  )} ${getStatusColor(email.status)} me-2`}
                  style={{ padding: "1px 3px", borderRadius: "8px" }}
                ></i>
                <span
                  className={`status-badge ${getStatusColor(email.status)}`}
                >
                  {email.status}
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
                <strong>To:</strong> {email.email}
              </div>
              <div className="email-card-row">
                <i className="bi bi-card-text me-2"></i>
                <strong>Subject:</strong> {email.subject}
              </div>
              <div className="email-card-row">
                <i className="bi bi-tag me-2"></i>
                <strong>Type:</strong> {email.type}
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
      <div className="pagination">
        <button
          onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
          disabled={currentPage === 1}
        >
          Vorherige
        </button>

        {Array.from({ length: Math.ceil(emails.length / emailsPerPage) }).map(
          (_, index) => (
            <button
              key={index}
              onClick={() => paginate(index + 1)}
              className={currentPage === index + 1 ? "active" : ""}
            >
              {index + 1}
            </button>
          )
        )}

        <button
          onClick={() =>
            paginate(
              currentPage < Math.ceil(emails.length / emailsPerPage)
                ? currentPage + 1
                : currentPage
            )
          }
          disabled={currentPage === Math.ceil(emails.length / emailsPerPage)}
        >
          Nächste
        </button>
      </div>

      {/* Email Details Modal */}
      {showModal && (
        <EmailModal email={selectedEmail} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default EmailTable;
