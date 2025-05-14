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

  // German translations for status values
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

  // German translations for type values
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
    <div className="email-modal-overlay">
      <div className="email-modal-container">
        <div className="email-modal-header">
          <h2 className="email-modal-title">
            <i className="bi bi-envelope-fill me-2"></i>
            E-Mail-Details
          </h2>
          <button className="email-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="email-modal-body">
          <div className="email-details-section">
            <div className="email-detail">
              <p className="email-detail-label">Empfänger</p>
              <p className="email-detail-value">{email.email || 'N/A'}</p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Status</p>
              <p className="email-detail-value">
                <span className="email-status-badge">
                  {translateStatus(email.status)}
                </span>
              </p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Betreff</p>
              <p className="email-detail-value">{email.subject || 'N/A'}</p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Gesendet am</p>
              <p className="email-detail-value">{formatDate(email.date)}</p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">Typ</p>
              <p className="email-detail-value">{translateType(email.type)}</p>
            </div>
          </div>

          <div className="email-content-section">
            <h3 className="email-content-title">
              <i className="bi bi-card-text me-2"></i>
              E-Mail-Inhalt
            </h3>
            <div className="email-content-preview">
              {email.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: email.htmlContent }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: email.content || 'Kein Inhalt verfügbar' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;