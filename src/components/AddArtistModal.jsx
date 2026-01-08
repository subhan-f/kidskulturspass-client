import React, { useState, useCallback, useEffect, useRef } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import { X, Check2 } from "react-bootstrap-icons";
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

// ONLY these are required:
const REQUIRED_FIELDS = ["calendar", "role", "firstName", "lastName"];

function AddArtistModal({
  showModal,
  setShowModal,
  selectedCalendar,
  handleAddArtist,
  handleUpdateArtist,
  mode = "add",
  artistToEdit = null,
}) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [originalData, setOriginalData] = useState(null);

  const [artistData, setArtistData] = useState({
    calendar: selectedCalendar || "",
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    state: "",
  });

  const wasOpenRef = useRef(false);

  const validationPatterns = {
    phone: /^(\+49|0)(\s?\d){7,14}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-ZäöüÄÖÜß\s\-']+$/,
    street: /^[a-zA-Z0-9äöüÄÖÜß\s\-.,#'/]+$/,
    houseNumber: /^[a-zA-Z0-9\s\-/]+$/,
    city: /^[a-zA-ZäöüÄÖÜß\s\-'.]+$/,
    postalCode: /^\d{5}$/,
  };

  const validationMessages = {
    calendar: "Bitte wählen Sie einen Kalender aus.",
    role: "Bitte wählen Sie eine Rolle aus.",
    firstName:
      "Bitte geben Sie einen gültigen Vornamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    lastName:
      "Bitte geben Sie einen gültigen Nachnamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    phone:
      "Bitte geben Sie eine gültige deutsche Telefonnummer ein (z. B. +4915123456789 oder 015123456789).",
    street: "Bitte geben Sie eine gültige Straße ein.",
    houseNumber: "Bitte geben Sie eine gültige Hausnummer ein.",
    city: "Bitte geben Sie einen gültigen Ort ein.",
    postalCode: "Bitte geben Sie eine gültige 5-stellige Postleitzahl ein.",
  };

  const getRolesForCalendar = useCallback((calendar) => {
    const config = calendarConfig.find((item) => item.calendar === calendar);
    return config ? config.roles : [];
  }, []);

  // Update roles when calendar changes
  useEffect(() => {
    const roles = artistData.calendar ? getRolesForCalendar(artistData.calendar) : [];
    setAvailableRoles(roles);

    if (artistData.role && !roles.includes(artistData.role)) {
      setArtistData((prev) => ({ ...prev, role: "" }));
    }
  }, [artistData.calendar, artistData.role, getRolesForCalendar]);

  // IMPORTANT: Initialize/reset ONLY when the modal OPENS (false -> true)
  useEffect(() => {
    const isOpeningNow = showModal && !wasOpenRef.current;
    wasOpenRef.current = showModal;

    if (!isOpeningNow) return;

    setFieldErrors({});
    setIsLoading(false);

    if (mode === "edit" && artistToEdit) {
      let street = "";
      let houseNumber = "";
      let city = "";
      let postalCode = "";
      let state = "";

      if (artistToEdit.address) {
        const addressParts = artistToEdit.address.split(", ");
        if (addressParts.length >= 2) {
          const streetAndNumber = addressParts[0].split(" ");
          if (streetAndNumber.length > 1) {
            houseNumber = streetAndNumber.pop();
            street = streetAndNumber.join(" ");
          } else {
            street = addressParts[0];
          }

          const cityPart = addressParts[1].split(" ");
          if (cityPart.length > 1) {
            postalCode = cityPart[0];
            city = cityPart.slice(1).join(" ");
          }

          if (addressParts.length > 2) state = addressParts[2];
        }
      }

      const editData = {
        calendar: artistToEdit.calendar || "",
        role: artistToEdit.role || "",
        firstName: artistToEdit.firstName || "",
        lastName: artistToEdit.lastName || "",
        email: artistToEdit.email || "",
        phone: artistToEdit.phone || "",
        street,
        houseNumber,
        postalCode,
        city,
        state,
      };

      setArtistData(editData);
      setOriginalData(editData);

      const roles = getRolesForCalendar(editData.calendar);
      setAvailableRoles(roles);
    } else {
      const fresh = {
        calendar: selectedCalendar || "",
        role: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        street: "",
        houseNumber: "",
        postalCode: "",
        city: "",
        state: "",
      };
      setArtistData(fresh);
      setOriginalData(null);

      const roles = fresh.calendar ? getRolesForCalendar(fresh.calendar) : [];
      setAvailableRoles(roles);
    }
  }, [showModal, mode, artistToEdit, selectedCalendar, getRolesForCalendar]);

  const validateField = useCallback(
    (field, rawValue) => {
      const value = (rawValue ?? "").toString().trim();
      const isRequired = REQUIRED_FIELDS.includes(field);

      // optional + empty => valid
      if (!isRequired && !value) return { isValid: true, message: "" };

      switch (field) {
        case "calendar":
          return value
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.calendar };

        case "role":
          return value
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.role };

        case "firstName":
          return value && validationPatterns.name.test(value)
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.firstName };

        case "lastName":
          return value && validationPatterns.name.test(value)
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.lastName };

        case "email":
          return validationPatterns.email.test(value)
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.email };

        case "phone":
          return validationPatterns.phone.test(value.replace(/\s/g, ""))
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.phone };

        case "street":
          return validationPatterns.street.test(value)
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.street };

        case "houseNumber":
          return validationPatterns.houseNumber.test(value)
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.houseNumber };

        case "city":
          return validationPatterns.city.test(value)
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.city };

        case "postalCode":
          return validationPatterns.postalCode.test(value)
            ? { isValid: true, message: "" }
            : { isValid: false, message: validationMessages.postalCode };

        default:
          return { isValid: true, message: "" };
      }
    },
    [validationMessages, validationPatterns]
  );

  const validateAllFields = useCallback(() => {
    const errors = {};
    let allValid = true;

    Object.keys(artistData).forEach((field) => {
      const { isValid, message } = validateField(field, artistData[field]);
      if (!isValid) {
        errors[field] = message;
        allValid = false;
      }
    });

    setFieldErrors(errors);
    return allValid;
  }, [artistData, validateField]);

  const handleFieldChange = useCallback((field, value) => {
    setArtistData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const handleBlur = useCallback(
    (field) => {
      const { isValid, message } = validateField(field, artistData[field]);
      if (!isValid) {
        setFieldErrors((prev) => ({ ...prev, [field]: message }));
      }
    },
    [artistData, validateField]
  );

  const hasChanges = useCallback(() => {
    if (mode !== "edit" || !originalData) return true;
    return Object.keys(artistData).some((k) => artistData[k] !== originalData[k]);
  }, [artistData, originalData, mode]);

  const handleClose = useCallback(() => {
    if (!isLoading) setShowModal(false);
  }, [isLoading, setShowModal]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateAllFields()) {
        toast.error("Bitte korrigieren Sie die markierten Felder.");
        return;
      }

      setIsLoading(true);
      try {
        // Backward compatible combined address (only if provided)
        const parts = [];
        const line1 = [artistData.street, artistData.houseNumber].filter(Boolean).join(" ").trim();
        const line2 = [artistData.postalCode, artistData.city].filter(Boolean).join(" ").trim();
        const line3 = (artistData.state || "").trim();

        if (line1) parts.push(line1);
        if (line2) parts.push(line2);
        if (line3) parts.push(line3);

        const combinedAddress = parts.join(", ");

        const payload = {
          ...artistData,
          address: combinedAddress || "",
        };

        if (mode === "add") {
          await handleAddArtist(payload);
        } else {
          await handleUpdateArtist(payload);
        }

        // IMPORTANT: close modal on success (DON'T reset form here)
        setShowModal(false);
      } catch (err) {
        // keep values in the form so user doesn’t lose input
        toast.error("Speichern fehlgeschlagen. Bitte erneut versuchen.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [artistData, mode, handleAddArtist, handleUpdateArtist, setShowModal, validateAllFields]
  );

  const isSubmitDisabled = isLoading || (mode === "edit" && !hasChanges());

  return (
    <Modal
      show={showModal}
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>
          {mode === "add" ? "Künstler hinzufügen" : "Künstler bearbeiten"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Kalender *</Form.Label>
                <Form.Select
                  value={artistData.calendar}
                  onChange={(e) => handleFieldChange("calendar", e.target.value)}
                  onBlur={() => handleBlur("calendar")}
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
              <Form.Group className="mb-3">
                <Form.Label>Rolle *</Form.Label>
                <Form.Select
                  value={artistData.role}
                  onChange={(e) => handleFieldChange("role", e.target.value)}
                  onBlur={() => handleBlur("role")}
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
              <Form.Group className="mb-3">
                <Form.Label>Vorname *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Vorname eingeben"
                  value={artistData.firstName}
                  onChange={(e) => handleFieldChange("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  isInvalid={!!fieldErrors.firstName}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.firstName}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Nachname *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nachname eingeben"
                  value={artistData.lastName}
                  onChange={(e) => handleFieldChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
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
              <Form.Group className="mb-4">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="E-Mail-Adresse eingeben"
                  value={artistData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  isInvalid={!!fieldErrors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Telefon</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="+49xxxxxxxxxx"
                  value={artistData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  isInvalid={!!fieldErrors.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.phone}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <div className="border p-3 mb-3 rounded">
            <h6 className="mb-3">Adresse (optional)</h6>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Straße</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Straße eingeben"
                    value={artistData.street}
                    onChange={(e) => handleFieldChange("street", e.target.value)}
                    onBlur={() => handleBlur("street")}
                    isInvalid={!!fieldErrors.street}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.street}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Hausnummer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Hausnummer eingeben"
                    value={artistData.houseNumber}
                    onChange={(e) => handleFieldChange("houseNumber", e.target.value)}
                    onBlur={() => handleBlur("houseNumber")}
                    isInvalid={!!fieldErrors.houseNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.houseNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>PLZ</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="12345"
                    value={artistData.postalCode}
                    onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                    onBlur={() => handleBlur("postalCode")}
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
                    onBlur={() => handleBlur("city")}
                    isInvalid={!!fieldErrors.city}
                  />
                  <Form.Control.Feedback type="invalid">
                    {fieldErrors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Bundesland</Form.Label>
                  <Form.Select
                    value={artistData.state}
                    onChange={(e) => handleFieldChange("state", e.target.value)}
                  >
                    <option value="">Bundesland auswählen</option>
                    {germanStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </div>

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
