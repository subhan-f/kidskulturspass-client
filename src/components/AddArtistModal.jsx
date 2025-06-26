import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Form, Button, Container, Row, Col } from 'react-bootstrap';
import { PersonPlus, X, Check2 } from 'react-bootstrap-icons';

function AddArtistModal({ 
  showModal, 
  setShowModal, 
  selectedCalendar, 
  selectedRoles,
  fetchArtists,
  roleOptions, 
  handleAddArtist 
}) {
  const [validated, setValidated] = useState(false);
  const [artistData, setArtistData] = useState({
  calendar: selectedCalendar || '',
  name: '',
  role: '',
  email: ''
});

  // Update form data when calendar changes
  useEffect(() => {
    console.log('[Modal] Selected calendar prop changed:', selectedCalendar);
  setArtistData(prev => ({
    ...prev,
    calendar: selectedCalendar || ''
  }));
}, [selectedCalendar, showModal]); // Add showModal to dependencies

const [isLoading, setIsLoading] = useState(false);

const handleSubmit = useCallback(async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  
  if (!form.checkValidity()) {
    e.preventDefault();
    e.stopPropagation();
    setValidated(true);
    return;
  }

  if (!artistData.calendar) {
    toast.error('Bitte wählen Sie einen Kalender aus');
    return;
  }

  setIsLoading(true);
  try {
    await handleAddArtist(artistData);
    resetForm();
  } finally {
    setIsLoading(false);
  }
}, [artistData, handleAddArtist]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [setShowModal]);

  const resetForm = () => {
    setArtistData({
      calendar: selectedCalendar || '',
      name: '',
      role: '',
      email: ''
    });
    setValidated(false);
  };

  const handleFieldChange = useCallback((field, value) => {
    setArtistData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Modal 
      show={showModal} 
      onHide={handleClose}
      size="lg"
      centered
      dialogClassName="artist-popup-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="popup-modal-header">
        <div className="d-flex align-items-center">
          <div className="icon-wrapper me-3">
            <PersonPlus size={24} />
          </div>
          <div>
            <Modal.Title>Künstler hinzufügen</Modal.Title>
            <p className="mb-0 text-muted">{selectedCalendar}</p>
          </div>
        </div>
      </Modal.Header>
      
      <Modal.Body className="popup-modal-body">
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group controlId="artistName" className="mb-3">
            <Form.Label>Name <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="text" 
              value={artistData.name} 
              onChange={(e) => handleFieldChange('name', e.target.value)} 
              placeholder="Name des Künstlers eingeben"
              required 
            />
            <Form.Control.Feedback type="invalid">
              Bitte geben Sie einen Namen ein.
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group controlId="artistRole" className="mb-3">
            <Form.Label>Rolle <span className="text-danger">*</span></Form.Label>
            <Form.Select 
              value={artistData.role} 
              onChange={(e) => handleFieldChange('role', e.target.value)}
              required
            >
              <option value="">Rolle auswählen</option>
              {Array.isArray(selectedRoles) && selectedRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              Bitte wählen Sie eine Rolle aus.
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group controlId="artistEmail" className="mb-4">
            <Form.Label>E-Mail <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="email" 
              value={artistData.email} 
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="E-Mail-Adresse eingeben" 
              required
            />
            <Form.Control.Feedback type="invalid">
              Bitte geben Sie eine gültige E-Mail-Adresse ein.
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Die E-Mail wird für Benachrichtigungen über Veranstaltungen verwendet.
            </Form.Text>
          </Form.Group>
          
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={handleClose}
            >
              <X className="me-1" /> Abbrechen
            </Button>
            <Button 
              variant="primary" 
              type="submit"
            >
              <Check2 className="me-1" /> Speichern
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default React.memo(AddArtistModal);
