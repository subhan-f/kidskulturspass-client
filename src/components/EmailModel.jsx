import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { Envelope, ArrowLeft } from 'react-bootstrap-icons';
import api, { getEmailById } from '../utils/api';

const EmailModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        setLoading(true);
        const response = await getEmailById(id);
        console.log('Fetched email:', response.data);
        setEmail(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching email:', err);
        setError('Failed to load email details');
        setLoading(false);
      }
    };

    fetchEmail();
  }, [id]);

  const handleClose = () => {
    navigate('/emails');
  };

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

  const translateStatus = (status) => {
    switch(status) {
      case 'Sent': return 'Gesendet';
      case 'Failed': return 'Fehlgeschlagen';
      case 'Pending': return 'Ausstehend';
      default: return status || 'N/A';
    }
  };

  const translateType = (type) => {
    switch(type) {
      case 'Invitation': return 'Einladung';
      case 'New Deal': return 'Neuer Job';
      case 'Update Deal': return 'Update';
      case 'Cancel Deal': return 'Absage';
      case 'Reminder': return 'Event-Erinnerung';
      case 'Follow Up': return 'Job noch offen';
      case 'Performance Email': return 'Performance-Bericht';
      default: return type || 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="email-modal-overlay">
        <div className="email-modal-container">
          <div className="text-center p-5">
            <p>E-Mail-Details werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="email-modal-overlay">
        <div className="email-modal-container">
          <div className="alert alert-danger">{error}</div>
          <Button variant="primary" onClick={handleClose} className="email-modal-close-btn">
            <ArrowLeft className="me-2" />
            Zurück zur E-Mail-Liste
          </Button>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="email-modal-overlay">
        <div className="email-modal-container">
          <div className="alert alert-warning">E-Mail nicht gefunden</div>
          <Button variant="primary" onClick={handleClose} className="email-modal-close-btn">
            <ArrowLeft className="me-2" />
            Zurück zur E-Mail-Liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="email-modal-overlay">
      <div className="email-modal-container">
        <div className="email-modal-header">
          <h2 className="email-modal-title">
            <Envelope className="me-2" />
            E-Mail-Details
          </h2>
          <button className="email-modal-close" onClick={handleClose}>
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
                <span className={`role-badge badge ${
                  email.status === 'Sent' ? 'bg-success' :
                  email.status === 'Failed' ? 'bg-danger' :
                  email.status === 'Pending' ? 'bg-warning' : 'bg-secondary'
                }`}>
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