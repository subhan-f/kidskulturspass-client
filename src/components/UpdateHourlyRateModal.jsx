import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { CurrencyEuro, X, Check2 } from 'react-bootstrap-icons';

function UpdateHourlyRateModal({ 
  showModal, 
  setShowModal, 
  artist, 
  handleUpdateHourlyRate,
  isUpdating
}) {
  const [hourlyRate, setHourlyRate] = useState('');

  useEffect(() => {
    if (artist) {
      setHourlyRate(artist.hourlyRate || '');
    }
  }, [artist]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (artist && hourlyRate !== '') {
      handleUpdateHourlyRate(artist._id, artist.calendar, parseFloat(hourlyRate));
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setShowModal(false);
    }
  };

  return (
    <Modal 
      show={showModal} 
      onHide={handleClose}
      centered
      dialogClassName="hourly-rate-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="modal-header">
        <div className="d-flex align-items-center">
          <div className="icon-wrapper me-3">
            <CurrencyEuro size={24} />
          </div>
          <div>
            <Modal.Title>Stundensatz aktualisieren</Modal.Title>
            <p className="mb-0 text-muted">{artist?.name} - {artist?.calendar}</p>
          </div>
        </div>
      </Modal.Header>
      
      <Modal.Body className="modal-body">
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="hourlyRate">
            <Form.Label>Neuer Stundensatz (€)</Form.Label>
            <Form.Control 
              type="number" 
              min="0"
              step="0.01"
              value={hourlyRate} 
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="Stundensatz eingeben"
              required
              className="hourly-rate-input"
            />
          </Form.Group>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={handleClose}
              disabled={isUpdating}
            >
              <X className="me-1" /> Abbrechen
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Aktualisieren...</span>
                </>
              ) : (
                <>
                  <Check2 className="me-1" /> Aktualisieren
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default UpdateHourlyRateModal;