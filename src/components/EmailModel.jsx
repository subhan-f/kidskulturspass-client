import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EmailModal = ({ email, onClose }) => {
  useEffect(() => {
    const navbar = document.querySelector('.navbar-main');
    const dashboard = document.querySelector('.dashboard-page');
    const contentWrapper = document.querySelector('.content-wrapper');

    if (navbar) navbar.classList.add('hidden');
    if (dashboard) dashboard.classList.add('navbar-hidden');
    if (contentWrapper) contentWrapper.classList.add('navbar-hidden');

    return () => {
      if (navbar) navbar.classList.remove('hidden');
      if (dashboard) dashboard.classList.remove('navbar-hidden');
      if (contentWrapper) contentWrapper.classList.remove('navbar-hidden');
    };
  }, []);

  if (!email) return null;

  const formatDate = (dateInput) => {
    try {
      let date;
      if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput?.$date?.$numberLong) {
        date = new Date(parseInt(dateInput.$date.$numberLong));
      } else if (dateInput instanceof Date) {
        date = dateInput;
      }

      if (!date || isNaN(date.getTime())) return 'N/A';

      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="email-modal-overlay">
      <div className="email-modal-container">
        <div className="email-modal-header">
          <h2 className="email-modal-title">
            <i className="bi bi-envelope-fill me-2"></i>
            Email Details
          </h2>
          <button className="email-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="email-modal-body">
          <div className="email-details-section">
            <div className="email-detail">
              <p className="email-detail-label">Recipient</p>
              <p className="email-detail-value">{email.email || 'N/A'}</p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Status</p>
              <p className="email-detail-value">
                <span className="email-status-badge">
                  {email.status || 'N/A'}
                </span>
              </p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Subject</p>
              <p className="email-detail-value">{email.subject || 'N/A'}</p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Sent At</p>
              <p className="email-detail-value">{formatDate(email.date)}</p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Type</p>
              <p className="email-detail-value">{email.type || 'N/A'}</p>
            </div>
          </div>

          <div className="email-content-section">
            <h3 className="email-content-title">
              <i className="bi bi-card-text me-2"></i>
              Email Content
            </h3>
            <div className="email-content-preview">
              {email.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: email.htmlContent }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: email.content || 'No content available' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
