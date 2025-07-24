import React from 'react';
import { Button, Badge, Alert } from 'react-bootstrap';
import { Calendar3, Envelope, GeoAlt, Clock, Person, PersonCheck, ArrowLeft } from 'react-bootstrap-icons';

const EventModal = ({ event, onClose }) => {
  if (!event) {
    return (
      <div className="email-modal-overlay">
        <div className="email-modal-container">
          <div className="alert alert-warning">Veranstaltung nicht gefunden</div>
          <Button variant="primary" onClick={onClose} className="email-modal-close-btn">
            <ArrowLeft className="me-2" />
            Zurück zur Veranstaltungsliste
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateTime, timeZone) => {
    if (!dateTime) return 'N/A';
    
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timeZone || 'Europe/Berlin'
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
            <Calendar3 className="me-2" />
            Veranstaltungsdetails
          </h2>
          <button className="email-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="email-modal-body">
          <div className="email-details-section">
            <div className="email-detail">
              <p className="email-detail-label">
                <i className="bi bi-calendar-event me-2"></i>
                Veranstaltung
              </p>
              <p className="email-detail-value">{event.summary || 'N/A'}</p>
            </div>
            
            <div className="email-detail">
              <p className="email-detail-label">
                <i className="bi bi-calendar-check me-2"></i>
                Kalender
              </p>
              <p className="email-detail-value">{event.calendarName || 'N/A'}</p>
            </div>
            <div className="email-detail">
              <p className="email-detail-label">
                <Clock className="me-2" />
                Datum/Uhrzeit
              </p>
              <p className="email-detail-value">
                {formatDate(event.start?.dateTime, event.start?.timeZone)}
              </p>
            </div>
            
            <div className="email-detail">
              <p className="email-detail-label">
                <GeoAlt className="me-2" />
                Ort
              </p>
              <p className="email-detail-value">{event.location || 'N/A'}</p>
            </div>
          </div>

          {event.description && (
            <div className="email-content-section">
              <h3 className="email-content-title">
                <i className="bi bi-card-text me-2"></i>
                Beschreibung
              </h3>
              <div className="email-content-preview" style={{ whiteSpace: 'pre-line' }}>
                {event.description}
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between mt-4">
             <div>
              
             </div>
            
            {event.htmlLink && (
              <Button 
                variant="primary" 
                href={event.htmlLink} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Calendar3 className="me-2" />
                In Kalender öffnen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;