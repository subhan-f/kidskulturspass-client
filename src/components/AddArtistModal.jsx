//popup

import React, { useState, useCallback, useEffect } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import { PersonPlus, X, Check2, Pencil } from "react-bootstrap-icons";
import { toast } from "react-toastify";

const calendarConfig = [
  { calendar: "Geigen Mitmachkonzert", roles: ["Geiger*in", "Moderator*in"] },
  { calendar: "Klavier Mitmachkonzert", roles: ["Pianist*in", "Moderator*in"] },
  {
    calendar: "Laternenumzug mit Musik",
    roles: ["Instrumentalist*in", "Sängerin*in"],
  },
  { calendar: "Nikolaus Besuch", roles: ["Nikolaus", "Sängerin*in"] },
  { calendar: "Puppentheater", roles: ["Puppenspieler*in"] },
  {
    calendar: "Weihnachts Mitmachkonzert",
    roles: ["Detlef", "Sängerin*in", "Admin"],
  },
];

// German states (Bundesländer)
const germanStates = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
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
  artistToEdit = null,
}) {
  const [validated, setValidated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [artistData, setArtistData] = useState({
    calendar: selectedCalendar || "",
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    houseNumber: "",
    city: "",
    postalCode: "",
    state: "",
    role: "",
    email: "",
  });

  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  // Validation patterns
  const validationPatterns = {
    phone: /^(\+49|0)(\s?\d){7,14}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-ZäöüÄÖÜß\s\-']+$/,
    street: /^[a-zA-Z0-9äöüÄÖÜß\s\-.,#'/]+$/,
    houseNumber: /^[a-zA-Z0-9\s\-/]+$/,
    city: /^[a-zA-ZäöüÄÖÜß\s\-'.]+$/,
    postalCode: /^\d{5}$/,
  };

  // Validation messages (nur für required Felder + optionale Felder bei Eingabe)
  const validationMessages = {
    firstName:
      "Bitte gib einen gültigen Vornamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    lastName:
      "Bitte gib einen gültigen Nachnamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    phone:
      "Bitte gib eine gültige deutsche Telefonnummer ein (z. B. +4915123456789 oder 015123456789).",
    street: "Bitte gib eine gültige Straße ein.",
    houseNumber: "Bitte gib eine gültige Hausnummer ein.",
    city: "Bitte gib einen gültigen Ort ein.",
    postalCode: "Bitte gib eine gültige 5-stellige Postleitzahl ein.",
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
  };

  const getRolesForCalendar = useCallback((calendar) => {
    const config = calendarConfig.find((item) => item.calendar === calendar);
    return config ? config.roles : [];
  }, []);

  useEffect(() => {
    if (artistData.calendar) {
      const roles = getRolesForCalendar(artistData.calendar);
      setAvailableRoles(roles);

      if (artistData.role && !roles.includes(artistData.role)) {
        setArtistData((prev) => ({ ...prev, role: "" }));
      }
    }
  }, [artistData.calendar, getRolesForCalendar]);

  useEffect(() => {
    if (mode === "edit" && artistToEdit) {
      // Parse the existing address if it's in the old format
      let street = "";
      let houseNumber = "";
      let city = "";
      let postalCode = "";
      let state = "";

      if (artistToEdit.address) {
        // Try to parse the old address format
        const addressParts = artistToEdit.address.split(", ");
        if (addressParts.length >= 2) {
          // Extract street and house number
          const streetAndNumber = addressParts[0].split(" ");
          if (streetAndNumber.length > 1) {
            houseNumber = streetAndNumber.pop();
            street = streetAndNumber.join(" ");
          } else {
            street = addressParts[0];
          }

          // Extract postal code and city
          const cityPart = addressParts[1].split(" ");
          if (cityPart.length > 1) {
            postalCode = cityPart[0];
            city = cityPart.slice(1).join(" ");
          }

          // Extract state if exists
          if (addressParts.length > 2) {
            state = addressParts[2];
          }
        }
      }

      const editData = {
        calendar: artistToEdit.calendar || "",
        firstName: artistToEdit.firstName || "",
        lastName: artistToEdit.lastName || "",
        phone: artistToEdit.phone || "",
        street: street || "",
        houseNumber: houseNumber || "",
        city: city || "",
        postalCode: postalCode || "",
        state: state || "",
        role: artistToEdit.role || "",
        email: artistToEdit.email || "",
      };
      setArtistData(editData);
      setOriginalData(editData);

      const roles = getRolesForCalendar(artistToEdit.calendar);
      setAvailableRoles(roles);
    } else {
      setArtistData({
        calendar: selectedCalendar || "",
        firstName: "",
        lastName: "",
        phone: "",
        street: "",
        houseNumber: "",
        city: "",
        postalCode: "",
        state: "",
        role: "",
        email: "",
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
    let message = "";

    const trimmed = (value || "").trim();

    switch (field) {
      // NUR diese beiden sind required
      case "firstName":
        isValid = !!trimmed && validationPatterns.name.test(value);
        message = !isValid ? validationMessages.firstName : "";
        break;

      case "lastName":
        isValid = !!trimmed && validationPatterns.name.test(value);
        message = !isValid ? validationMessages.lastName : "";
        break;

      // Alles andere OPTIONAL: nur prüfen, wenn etwas eingegeben wurde
      case "phone":
        if (!trimmed) break;
        isValid = validationPatterns.phone.test(value.replace(/\s/g, ""));
        message = !isValid ? validationMessages.phone : "";
        break;

      case "email":
        if (!trimmed) break;
        isValid = validationPatterns.email.test(value);
        message = !isValid ? validationMessages.email : "";
        break;

      case "street":
        if (!trimmed) break;
        isValid = validationPatterns.street.test(value);
        message = !isValid ? validationMessages.street : "";
        break;

      case "houseNumber":
        if (!trimmed) break;
        isValid = validationPatterns.houseNumber.test(value);
        message = !isValid ? validationMessages.houseNumber : "";
        break;

      case "city":
        if (!trimmed) break;
        isValid = validationPatterns.city.test(value);
        message = !isValid ? validationMessages.city : "";
        break;

      case "postalCode":
        if (!trimmed) break;
        isValid = validationPatterns.postalCode.test(value);
        message = !isValid ? validationMessages.postalCode : "";
        break;

      default:
        // calendar, role, state etc. sind nicht required -> immer ok
        break;
    }

    return { isValid, message };
  };

  const validateAllFields = () => {
    const errors = {};
    let allValid = true;

    // NUR required Felder + optionale Felder die ausgefüllt sind werden geprüft
    Object.keys(artistData).forEach((field) => {
      const { isValid, message } = validateField(field, artistData[field]);
      if (!isValid) {
        errors[field] = message;
        allValid = false;
      }
    });

    setFieldErrors(errors);
    return allValid;
  };

  const handleFieldChange = useCallback(
    (field, value) => {
      setArtistData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [fieldErrors]
  );

  const handleFieldBlur = useCallback((field, value) => {
    const { isValid, message } = validateField(field, value);
    if (!isValid) {
      setFieldErrors((prev) => ({ ...prev, [field]: message }));
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
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
        toast.error("Bitte korrigiere die markierten Felder.");
        return;
      }

      setIsLoading(true);
      try {
        // Combine address fields into a single string for backward compatibility
        const combinedAddress = `${artistData.street} ${artistData.houseNumber}, ${artistData.postalCode} ${artistData.city}, ${artistData.state}`;

        const artistDataWithCombinedAddress = {
          ...artistData,
          address: combinedAddress,
        };

        if (mode === "add") {
          await handleAddArtist(artistDataWithCombinedAddress);
        } else {
          await handleUpdateArtist(artistDataWithCombinedAddress);
        }
        resetForm();
      } finally {
        setIsLoading(false);
      }
    },
    [artistData, handleAddArtist, handleUpdateArtist, mode]
  );

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setShowModal(false);
      resetForm();
    }
  }, [setShowModal, isLoading]);

  const resetForm = () => {
    setArtistData({
      calendar: selectedCalendar || "",
      firstName: "",
      lastName: "",
      phone: "",
      street: "",
      houseNumber: "",
      city: "",
      postalCode: "",
      state: "",
      role: "",
      email: "",
    });
    setOriginalData(null);
    setValidated(false);
    setFieldErrors({});
  };

  const hasChanges = useCallback(() => {
    if (mode !== "edit" || !originalData) return true;

    return Object.keys(artistData).some(
      (key) => artistData[key] !== originalData[key]
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
          <div className="row">
            <div className="col-md-6">
              {/* Calendar */}
              <Form.Group className="mb-3">
                <Form.Label>Kalender</Form.Label>
                <Form.Select
                  value={artistData.calendar}
                  onChange={(e) =>
                    handleFieldChange("calendar", e.target.value)
                  }
                  onBlur={(e) => handleFieldBlur("calendar", e.target.value)}
                  disabled={mode === "edit"}
                  isInvalid={!!fieldErrors.calendar}
                >
                  <option value="">Kalender auswählen</option>
                  {calendarConfig.map((config) => (
                    <option key={config.calendar} value={config.calendar}>
                      {config.calendar}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.calendar}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
            <div className="col-md-6">
              {/* Role */}
              <Form.Group className="mb-3">
                <Form.Label>Rolle</Form.Label>
                <Form.Select
                  value={artistData.role}
                  onChange={(e) => handleFieldChange("role", e.target.value)}
                  onBlur={(e) => handleFieldBlur("role", e.target.value)}
                  isInvalid={!!fieldErrors.role}
                >
                  <option value="">Rolle auswählen</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.role}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              {/* First Name */}
              <Form.Group className="mb-3">
                <Form.Label>Vorname *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Vorname eingeben"
                  value={artistData.firstName}
                  onChange={(e) =>
                    handleFieldChange("firstName", e.target.value)
                  }
                  onBlur={(e) => handleFieldBlur("firstName", e.target.value)}
                  required
                  isInvalid={!!fieldErrors.firstName}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.firstName}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6">
              {/* Last Name */}
              <Form.Group className="mb-3">
                <Form.Label>Nachname *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nachname eingeben"
                  value={artistData.lastName}
                  onChange={(e) =>
                    handleFieldChange("lastName", e.target.value)
                  }
                  onBlur={(e) => handleFieldBlur("lastName", e.target.value)}
                  required
                  isInvalid={!!fieldErrors.lastName}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.lastName}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              {/* Email */}
              <Form.Group className="mb-4">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="E-Mail-Adresse eingeben"
                  value={artistData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={(e) => handleFieldBlur("email", e.target.value)}
                  isInvalid={!!fieldErrors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6">
              {/* Phone */}
              <Form.Group className="mb-3">
                <Form.Label>Telefon</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="+49xxxxxxxxxx"
                  value={artistData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                  isInvalid={!!fieldErrors.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.phone}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          {/* Address Section */}
          <div className="border p-3 mb-3 rounded">
            <h6 className="mb-3">Adresse</h6>

            <div className="row">
              <div className="col-md-6">
                {/* Street */}
                <Form.Group className="mb-3">
                  <Form.Label>Straße</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Straße eingeben"
                    value={artistData.street}
                    onChange={(e) =>
                      handleFieldChange("street", e.target.value)
                    }
                    onBlur={(e) => handleFieldBlur("street", e.target.value)}
                    isInvalid={!!fieldErrors.street}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.street}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                {/* House Number */}
                <Form.Group className="mb-3">
                  <Form.Label>Hausnummer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Hausnummer eingeben"
                    value={artistData.houseNumber}
                    onChange={(e) =>
                      handleFieldChange("houseNumber", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("houseNumber", e.target.value)
                    }
                    isInvalid={!!fieldErrors.houseNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.houseNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            {/* City and Postal Code in one row */}
            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>PLZ</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="12345"
                    value={artistData.postalCode}
                    onChange={(e) =>
                      handleFieldChange("postalCode", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("postalCode", e.target.value)
                    }
                    isInvalid={!!fieldErrors.postalCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.postalCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Ort</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Stadt eingeben"
                    value={artistData.city}
                    onChange={(e) => handleFieldChange("city", e.target.value)}
                    onBlur={(e) => handleFieldBlur("city", e.target.value)}
                    isInvalid={!!fieldErrors.city}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-4">
                {/* State */}
                <Form.Group className="mb-3">
                  <Form.Label>Bundesland</Form.Label>
                  <Form.Select
                    value={artistData.state}
                    onChange={(e) => handleFieldChange("state", e.target.value)}
                    onBlur={(e) => handleFieldBlur("state", e.target.value)}
                    isInvalid={!!fieldErrors.state}
                  >
                    {germanStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="me-1" /> Abbrechen
            </Button>

            <Button variant="primary" type="submit" disabled={isSubmitDisabled}>
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" />{" "}
                  Speichern...
                </>
              ) : (
                <>
                  <Check2 className="me-1" />{" "}
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
