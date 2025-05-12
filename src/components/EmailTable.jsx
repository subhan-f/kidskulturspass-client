import React, { useState } from 'react';

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
      case 'Delivered':
        return 'status-delivered';
      case 'Pending':
        return 'status-pending';
      case 'Failed':
        return 'status-failed';
      case 'Opened':
        return 'status-opened';
      case 'Sent':
        return 'status-sent';
      default:
        return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bi-check-circle-fill';
      case 'Pending':
        return 'bi-hourglass-split';
      case 'Failed':
        return 'bi-x-circle-fill';
      case 'Opened':
        return 'bi-envelope-open-fill';
      case 'Sent':
        return 'bi-send-fill';
      default:
        return 'bi-envelope';
    }
  };

  const handleShowModal = (email) => {
    setSelectedEmail(email);
    setShowModal(true);
    document.body.style.overflow = 'hidden'; // Prevent body scrolling when modal is open
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmail(null);
    document.body.style.overflow = 'auto'; // Re-enable body scrolling
  };

  const formatDate = (dateInput) => {
    if (typeof dateInput === 'string') {
      try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
          return 'N/A';
        }
        return date.toLocaleDateString();
      } catch (e) {
        return 'N/A';
      }
    }
    
    if (dateInput && dateInput.$date && dateInput.$date.$numberLong) {
      try {
        const timestamp = dateInput.$date.$numberLong;
        const date = new Date(parseInt(timestamp));
        if (isNaN(date.getTime())) {
          return 'N/A';
        }
        return date.toLocaleDateString();
      } catch (e) {
        return 'N/A';
      }
    }
    
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        return 'N/A';
      }
      return dateInput.toLocaleDateString();
    }
    
    return 'N/A';
  };

  return (
    <div className="email-table-container">
      {/* Desktop Table View */}
      <div className="table-responsive d-none d-md-block">
        <table className="email-table">
          <thead>
            <tr>
              <th>To</th>
              <th>Status</th>
              <th>Subject</th>
              <th>Sent At</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentEmails.map((email) => (
              <tr key={email._id.$oid}>
                <td data-label="To">{email.email}</td>
                <td data-label="Status">
                  <span className={`status-badge ${getStatusColor(email.status)}`}>
                    {email.status}
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
                <i className={`bi ${getStatusIcon(email.status)} ${getStatusColor(email.status)} me-2`} style={{padding:"1px 3px", borderRadius:"8px"}}></i>
                <span className={`status-badge ${getStatusColor(email.status)}`}>
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
          Previous
        </button>
        
        {Array.from({ length: Math.ceil(emails.length / emailsPerPage) }).map((_, index) => (
          <button
            key={index}
            onClick={() => paginate(index + 1)}
            className={currentPage === index + 1 ? 'active' : ''}
          >
            {index + 1}
          </button>
        ))}
        
        <button
          onClick={() => paginate(currentPage < Math.ceil(emails.length / emailsPerPage) ? currentPage + 1 : currentPage)}
          disabled={currentPage === Math.ceil(emails.length / emailsPerPage)}
        >
          Next
        </button>
      </div>

      {/* Email Details Modal */}
      {showModal && (
        <div className="modal" style={{ display: 'block', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}>
          <div 
            className="modal-backdrop fade show" 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
            onClick={handleCloseModal}
          ></div>
          
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ zIndex: 1050, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-envelope me-2"></i>
                  {selectedEmail.subject}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <div>
                      <strong>To:</strong> {selectedEmail.email}
                    </div>
                    <div>
                      <span className={`badge ${getStatusColor(selectedEmail.status)}`}>
                        {selectedEmail.status}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong>Sent:</strong> {formatDate(selectedEmail.date)}
                  </div>
                  <div className="mb-2">
                    <strong>Type:</strong> {selectedEmail.type}
                  </div>
                </div>
                <hr />
                <div 
                  className="email-content-preview"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTable;