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
  const [fieldErrors, setFieldErrors] = useState({});

  const [artistData, setArtistData] = useState({
    calendar: selectedCalendar || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    role: '',
    email: '',
  });

  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  // Validation patterns
  const validationPatterns = {
    phone: /^(\+49|0)(\s?\d){7,14}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-ZäöüÄÖÜß\s\-']+$/,
    address: /^[a-zA-Z0-9äöüÄÖÜß\s\-\.,#'/]+$/
  };

  // Validation messages
  const validationMessages = {
    calendar: "Bitte wählen Sie einen Kalender aus.",
    firstName: "Bitte geben Sie einen gültigen Vornamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    lastName: "Bitte geben Sie einen gültigen Nachnamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    phone: "Bitte geben Sie eine gültige deutsche Telefonnummer ein (z. B. +4915123456789 oder 015123456789).",
    address: "Bitte geben Sie eine gültige Adresse ein.",
    role: "Bitte wählen Sie eine Rolle aus.",
    email: "Bitte geben Sie eine gültige E-Mail-Adresse ein."
  };

  const getRolesForCalendar = useCallback((calendar) => {
    const config = calendarConfig.find(item => item.calendar === calendar);
    return config ? config.roles : [];
  }, []);

  
      // console.log("Editing artist:", artistToEdit);
  useEffect(() => {
    if (artistData.calendar) {
      const roles = getRolesForCalendar(artistData.calendar);
      setAvailableRoles(roles);

      if (artistData.role && !roles.includes(artistData.role)) {
        setArtistData(prev => ({ ...prev, role: '' }));
      }
    }
  }, [artistData.calendar, getRolesForCalendar]);

  useEffect(() => {
    if (mode === "edit" && artistToEdit) {

      const editData = {
        calendar: artistToEdit.calendar || '',
        firstName: artistToEdit.firstName || '',
        lastName: artistToEdit.lastName || '',
        phone: artistToEdit.phone || '',
        address: artistToEdit.address || '',
        role: artistToEdit.role || '',
        email: artistToEdit.email || '',
      };
      setArtistData(editData);
      setOriginalData(editData);

      const roles = getRolesForCalendar(artistToEdit.calendar);
      setAvailableRoles(roles);
    } else {
      setArtistData({
        calendar: selectedCalendar || '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        role: '',
        email: '',
      });
      setOriginalData(null);

      if (selectedCalendar) {
        const roles = getRolesForCalendar(selectedCalendar);
        setAvailableRoles(roles);
      }
    }
    setValidated(false);
    setFieldErrors({});
  }, [mode, artistToEdit, selectedCalendar, showModal, getRolesForCalendar]);

  const validateField = (field, value) => {
    let isValid = true;
    let message = '';

    switch (field) {
      case 'calendar':
        isValid = !!value.trim();
        message = !isValid ? validationMessages.calendar : '';
        break;
      
      case 'firstName':
        isValid = !!value.trim() && validationPatterns.name.test(value);
        message = !isValid ? validationMessages.firstName : '';
        break;
      
      case 'lastName':
        isValid = !!value.trim() && validationPatterns.name.test(value);
        message = !isValid ? validationMessages.lastName : '';
        break;
      
      case 'phone':
        isValid = !!value.trim() && validationPatterns.phone.test(value.replace(/\s/g, ''));
        message = !isValid ? validationMessages.phone : '';
        break;
      
      case 'address':
        isValid = !!value.trim() && validationPatterns.address.test(value);
        message = !isValid ? validationMessages.address : '';
        break;
      
      case 'role':
        isValid = !!value.trim();
        message = !isValid ? validationMessages.role : '';
        break;
      
      case 'email':
        isValid = !!value.trim() && validationPatterns.email.test(value);
        message = !isValid ? validationMessages.email : '';
        break;
      
      default:
        break;
    }

    return { isValid, message };
  };

  const validateAllFields = () => {
    const errors = {};
    let allValid = true;

    Object.keys(artistData).forEach(field => {
      const { isValid, message } = validateField(field, artistData[field]);
      if (!isValid) {
        errors[field] = message;
        allValid = false;
      }
    });

    setFieldErrors(errors);
    return allValid;
  };

  const handleFieldChange = useCallback((field, value) => {
    setArtistData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [fieldErrors]);

  const handleFieldBlur = useCallback((field, value) => {
    const { isValid, message } = validateField(field, value);
    if (!isValid) {
      setFieldErrors(prev => ({ ...prev, [field]: message }));
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Validate all fields
    if (!validateAllFields()) {
      toast.error("Bitte korrigieren Sie die markierten Felder.");
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
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      role: '',
      email: '',
    });
    setOriginalData(null);
    setValidated(false);
    setFieldErrors({});
  };

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
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === "add" ? "Künstler hinzufügen" : "Künstler bearbeiten"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          
          {/* Calendar */}
          <Form.Group className="mb-3">
            <Form.Label>Kalender *</Form.Label>
            <Form.Select
              value={artistData.calendar}
              onChange={(e) => handleFieldChange("calendar", e.target.value)}
              onBlur={(e) => handleFieldBlur("calendar", e.target.value)}
              required
              disabled={mode === "edit"}
              isInvalid={!!fieldErrors.calendar}
            >
              <option value="">Kalender auswählen</option>
              {calendarConfig.map(config => (
                <option key={config.calendar} value={config.calendar}>
                  {config.calendar}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {fieldErrors.calendar}
            </Form.Control.Feedback>
          </Form.Group>

          {/* First Name */}
          <Form.Group className="mb-3">
            <Form.Label>Vorname *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Vorname eingeben"
              value={artistData.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              onBlur={(e) => handleFieldBlur("firstName", e.target.value)}
              required
              isInvalid={!!fieldErrors.firstName}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.firstName}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Last Name */}
          <Form.Group className="mb-3">
            <Form.Label>Nachname *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nachname eingeben"
              value={artistData.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              onBlur={(e) => handleFieldBlur("lastName", e.target.value)}
              required
              isInvalid={!!fieldErrors.lastName}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.lastName}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Phone */}
          <Form.Group className="mb-3">
            <Form.Label>Telefon (Deutsch) *</Form.Label>
            <Form.Control
              type="text"
              placeholder="+49xxxxxxxxxx oder 0xxxxxxxxxx"
              value={artistData.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={(e) => handleFieldBlur("phone", e.target.value)}
              required
              isInvalid={!!fieldErrors.phone}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.phone}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Address */}
          <Form.Group className="mb-3">
            <Form.Label>Adresse *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Adresse eingeben"
              value={artistData.address}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              onBlur={(e) => handleFieldBlur("address", e.target.value)}
              required
              isInvalid={!!fieldErrors.address}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.address}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Role */}
          <Form.Group className="mb-3">
            <Form.Label>Rolle *</Form.Label>
            <Form.Select
              value={artistData.role}
              onChange={(e) => handleFieldChange("role", e.target.value)}
              onBlur={(e) => handleFieldBlur("role", e.target.value)}
              required
              isInvalid={!!fieldErrors.role}
            >
              <option value="">Rolle auswählen</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {fieldErrors.role}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Email */}
          <Form.Group className="mb-4">
            <Form.Label>E-Mail *</Form.Label>
            <Form.Control
              type="email"
              placeholder="E-Mail-Adresse eingeben"
              value={artistData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={(e) => handleFieldBlur("email", e.target.value)}
              required
              isInvalid={!!fieldErrors.email}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={handleClose} disabled={isLoading}>
              <X className="me-1" /> Abbrechen
            </Button>

            <Button variant="primary" type="submit" disabled={isSubmitDisabled}>
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" /> Speichern...
                </>
              ) : (
                <>
                  <Check2 className="me-1" /> {mode === "add" ? "Speichern" : "Aktualisieren"}
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