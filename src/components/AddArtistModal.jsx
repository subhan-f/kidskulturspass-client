import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { PersonPlus, X, Check2, Pencil } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';

const calendarConfig = [
  { calendar: "Geigen Mitmachkonzert", roles: ["Geiger*in", "Moderator*in"] },
  { calendar: "Klavier Mitmachkonzert", roles: ["Pianist*in", "Moderator*in"] },
  { calendar: "Laternenumzug mit Musik", roles: ["Instrumentalist*in", "Sängerin*in"] },
  { calendar: "Nikolaus Besuch", roles: ["Nikolaus", "Sängerin*in"] },
  { calendar: "Puppentheater", roles: ["Puppenspieler*in"] },
  { calendar: "Weihnachts Mitmachkonzert", roles: ["Detlef", "Sängerin*in", "Admin"] },
];

function AddArtistModal({ 
  showModal, 
  setShowModal, 
  selectedCalendar, 
  selectedRoles,
  handleAddArtist,
  handleUpdateArtist,
  roleOptions,
  mode = "add",
  artistToEdit = null
}) {
  const [validated, setValidated] = useState(false);
  const [artistData, setArtistData] = useState({
    calendar: selectedCalendar || '',
    name: '',
    role: '',
    email: '',
    password: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  // Get roles based on selected calendar
  const getRolesForCalendar = useCallback((calendar) => {
    const config = calendarConfig.find(item => item.calendar === calendar);
    return config ? config.roles : [];
  }, []);

  // Update available roles when calendar changes
  useEffect(() => {
    if (artistData.calendar) {
      const roles = getRolesForCalendar(artistData.calendar);
      setAvailableRoles(roles);
      
      // If current role is not in available roles, reset it
      if (artistData.role && !roles.includes(artistData.role)) {
        setArtistData(prev => ({ ...prev, role: '' }));
      }
    }
  }, [artistData.calendar, getRolesForCalendar]);

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === "edit" && artistToEdit) {
      const editData = {
        calendar: artistToEdit.calendar || '',
        name: artistToEdit.name || '',
        role: artistToEdit.role || '',
        email: artistToEdit.email || '',
      };
      setArtistData(editData);
      setOriginalData(editData);
      
      // Set available roles for the artist's calendar
      const roles = getRolesForCalendar(artistToEdit.calendar);
      setAvailableRoles(roles);
    } else {
      // Add mode - reset form
      setArtistData({
        calendar: selectedCalendar || '',
        name: '',
        role: '',
        email: '',
      });
      setOriginalData(null);
      
      // Set available roles for selected calendar
      if (selectedCalendar) {
        const roles = getRolesForCalendar(selectedCalendar);
        setAvailableRoles(roles);
      }
    }
    setValidated(false);
  }, [mode, artistToEdit, selectedCalendar, showModal, getRolesForCalendar]);

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
      if (mode === "add") {
        await handleAddArtist(artistData);
      } else {
        await handleUpdateArtist(artistData);
      }
      resetForm();
    } finally {
      setIsLoading(false);
    }
  }, [artistData, handleAddArtist, handleUpdateArtist, mode]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setShowModal(false);
      resetForm();
    }
  }, [setShowModal, isLoading]);

  const resetForm = () => {
    setArtistData({
      calendar: selectedCalendar || '',
      name: '',
      role: '',
      email: '',
    });
    setOriginalData(null);
    setValidated(false);
  };

  const handleFieldChange = useCallback((field, value) => {
    setArtistData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Check if form has changes (for edit mode)
  const hasChanges = useCallback(() => {
    if (mode !== "edit" || !originalData) return true;
    
    return Object.keys(artistData).some(key => 
      artistData[key] !== originalData[key]
    );
  }, [artistData, originalData, mode]);

  const isSubmitDisabled = isLoading || (mode === "edit" && !hasChanges());

 return (
    <Modal 
      show={showModal} 
      onHide={isLoading ? null : handleClose}
      size="lg"
      centered
      dialogClassName="artist-popup-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="popup-modal-header">
        <div className="d-flex align-items-center">
          <div className="icon-wrapper me-3">
            {mode === "add" ? <PersonPlus size={24} /> : <Pencil size={24} />}
          </div>
          <div>
            <Modal.Title>
              {mode === "add" ? "Künstler hinzufügen" : "Künstler bearbeiten"}
            </Modal.Title>
            <p className="mb-0 text-muted">{selectedCalendar}</p>
          </div>
        </div>
      </Modal.Header>
      
      <Modal.Body className="popup-modal-body">
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group controlId="artistCalendar" className="mb-3">
            <Form.Label>Kalender <span className="text-danger">*</span></Form.Label>
            <Form.Select 
              value={artistData.calendar} 
              onChange={(e) => handleFieldChange('calendar', e.target.value)}
              required
              disabled={mode === "edit"} // Disable calendar selection in edit mode
            >
              <option value="">Kalender auswählen</option>
              {calendarConfig.map(config => (
                <option key={config.calendar} value={config.calendar}>
                  {config.calendar}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              Bitte wählen Sie einen Kalender aus.
            </Form.Control.Feedback>
          </Form.Group>
          
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
              {availableRoles.map(role => (
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
              disabled={isLoading}
            >
              <X className="me-1" /> Abbrechen
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">
                    {mode === "add" ? "Speichern..." : "Aktualisieren..."}
                  </span>
                </>
              ) : (
                <>
                  <Check2 className="me-1" /> 
                  {mode === "add" ? "Speichern" : "Aktualisieren"}
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default React.memo(AddArtistModal);