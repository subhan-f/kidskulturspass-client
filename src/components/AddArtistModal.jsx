import React, { useState, useCallback, useEffect } from "react";
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
  selectedRoles, // kept for compatibility even if unused
  handleAddArtist,
  handleUpdateArtist,
  roleOptions, // kept for compatibility even if unused
  mode = "add",
  artistToEdit = null,
}) {
  const [validated, setValidated] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  // ✅ ONLY these are required (as you asked)
  const requiredFields = ["calendar", "role", "firstName", "lastName"];
  const isRequired = useCallback(
    (field) => requiredFields.includes(field),
    []
  );

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
    email: "", // optional now
  });

  // Validation patterns (still used when field is filled)
  const validationPatterns = {
    phone: /^(\+49|0)(\s?\d){7,14}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-ZäöüÄÖÜß\s\-']+$/,
    street: /^[a-zA-Z0-9äöüÄÖÜß\s\-.,#'/]+$/,
    houseNumber: /^[a-zA-Z0-9\s\-/]+$/,
    city: /^[a-zA-ZäöüÄÖÜß\s\-'.]+$/,
    postalCode: /^\d{5}$/,
  };

  // Validation messages
  const validationMessages = {
    calendar: "Bitte wählen Sie einen Kalender aus.",
    firstName:
      "Bitte geben Sie einen gültigen Vornamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    lastName:
      "Bitte geben Sie einen gültigen Nachnamen ein (nur Buchstaben, Bindestriche und Leerzeichen).",
    phone:
      "Bitte geben Sie eine gültige deutsche Telefonnummer ein (z. B. +4915123456789 oder 015123456789).",
    street: "Bitte geben Sie eine gültige Straße ein.",
    houseNumber: "Bitte geben Sie eine gültige Hausnummer ein.",
    city: "Bitte geben Sie einen gültigen Ort ein.",
    postalCode: "Bitte geben Sie eine gültige 5-stellige Postleitzahl ein.",
    state: "Bitte wählen Sie ein Bundesland aus.",
    role: "Bitte wählen Sie eine Rolle aus.",
    email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  };

  const getRolesForCalendar = useCallback((calendar) => {
    const config = calendarConfig.find((item) => item.calendar === calendar);
    return config ? config.roles : [];
  }, []);

  // Update roles when calendar changes
  useEffect(() => {
    if (artistData.calendar) {
      const roles = getRolesForCalendar(artistData.calendar);
      setAvailableRoles(roles);

      if (artistData.role && !roles.includes(artistData.role)) {
        setArtistData((prev) => ({ ...prev, role: "" }));
      }
    } else {
      setAvailableRoles([]);
      if (artistData.role) setArtistData((prev) => ({ ...prev, role: "" }));
    }
  }, [artistData.calendar, artistData.role, getRolesForCalendar]);

  // Initialize for edit/add
  useEffect(() => {
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
        firstName: artistToEdit.firstName || "",
        lastName: artistToEdit.lastName || "",
        phone: artistToEdit.phone || "",
        street,
        houseNumber,
        city,
        postalCode,
        state,
        role: artistToEdit.role || "",
        email: artistToEdit.email || "",
      };

      setArtistData(editData);
      setOriginalData(editData);
      setAvailableRoles(getRolesForCalendar(artistToEdit.calendar));
    } else {
      resetForm();
      if (selectedCalendar) setAvailableRoles(getRolesForCalendar(selectedCalendar));
    }

    setValidated(false);
    setFieldErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, artistToEdit, selectedCalendar, showModal, getRolesForCalendar]);

  /**
   * ✅ Validation behavior:
   * - optional + empty => valid
   * - required + empty => invalid
   * - if filled => validate pattern
   */
  const validateField = (field, valueRaw) => {
    const value = (valueRaw ?? "").toString();
    const trimmed = value.trim();
    const required = isRequired(field);

    if (!required && trimmed === "") return { isValid: true, message: "" };

    if (required && trimmed === "") {
      return {
        isValid: false,
        message: validationMessages[field] || "Pflichtfeld.",
      };
    }

    let isValid = true;
    let message = "";

    switch (field) {
      case "calendar":
        isValid = !!trimmed;
        message = !isValid ? validationMessages.calendar : "";
        break;

      case "role":
        isValid = !!trimmed;
        message = !isValid ? validationMessages.role : "";
        break;

      case "firstName":
        isValid = validationPatterns.name.test(value);
        message = !isValid ? validationMessages.firstName : "";
        break;

      case "lastName":
        isValid = validationPatterns.name.test(value);
        message = !isValid ? validationMessages.lastName : "";
        break;

      case "phone":
        isValid = validationPatterns.phone.test(value.replace(/\s/g, ""));
        message = !isValid ? validationMessages.phone : "";
        break;

      case "street":
        isValid = validationPatterns.street.test(value);
        message = !isValid ? validationMessages.street : "";
        break;

      case "houseNumber":
        isValid = validationPatterns.houseNumber.test(value);
        message = !isValid ? validationMessages.houseNumber : "";
        break;

      case "city":
        isValid = validationPatterns.city.test(value);
        message = !isValid ? validationMessages.city : "";
        break;

      case "postalCode":
        isValid = validationPatterns.postalCode.test(value);
        message = !isValid ? validationMessages.postalCode : "";
        break;

      case "state":
        isValid = germanStates.includes(value);
        message = !isValid ? validationMessages.state : "";
        break;

      case "email":
        // optional, but if filled must be valid
        isValid = validationPatterns.email.test(value);
        message = !isValid ? validationMessages.email : "";
        break;

      default:
        break;
    }

    return { isValid, message };
  };

  const validateAllFields = () => {
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
  };

  const handleFieldChange = useCallback((field, value) => {
    setArtistData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  const handleFieldBlur = useCallback((field, value) => {
    const { isValid, message } = validateField(field, value);
    if (!isValid) setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

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
    return Object.keys(artistData).some((k) => artistData[k] !== originalData[k]);
  }, [artistData, originalData, mode]);

  const isSubmitDisabled = isLoading || (mode === "edit" && !hasChanges());

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setShowModal(false);
      resetForm();
    }
  }, [setShowModal, isLoading]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const form = e.currentTarget;

      // ✅ Will only block missing REQUIRED JSX fields (now only 4)
      if (!form.checkValidity()) {
        e.stopPropagation();
        setValidated(true);
        return;
      }

      if (!validateAllFields()) {
        toast.error("Bitte korrigieren Sie die markierten Felder.");
        return;
      }

      setIsLoading(true);

      try {
        const hasAnyAddress =
          artistData.street.trim() ||
          artistData.houseNumber.trim() ||
          artistData.postalCode.trim() ||
          artistData.city.trim() ||
          artistData.state.trim();

        const combinedAddress = hasAnyAddress
          ? `${artistData.street} ${artistData.houseNumber}, ${artistData.postalCode} ${artistData.city}, ${artistData.state}`
          : "";

        const payload = { ...artistData, address: combinedAddress };

        if (mode === "add") await handleAddArtist(payload);
        else await handleUpdateArtist(payload);

        resetForm();
        setShowModal(false);
      } catch (err) {
        console.error(err);
        toast.error(err?.message || "Speichern fehlgeschlagen.");
      } finally {
        setIsLoading(false);
      }
    },
    [artistData, handleAddArtist, handleUpdateArtist, mode, setShowModal]
  );

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
              <Form.Group className="mb-3">
                <Form.Label>Kalender *</Form.Label>
                <Form.Select
                  value={artistData.calendar}
                  onChange={(e) => handleFieldChange("calendar", e.target.value)}
                  onBlur={(e) => handleFieldBlur("calendar", e.target.value)}
                  required={isRequired("calendar")}
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
                  onBlur={(e) => handleFieldBlur("role", e.target.value)}
                  required={isRequired("role")}
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
                  onBlur={(e) => handleFieldBlur("firstName", e.target.value)}
                  required={isRequired("firstName")}
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
                  onBlur={(e) => handleFieldBlur("lastName", e.target.value)}
                  required={isRequired("lastName")}
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
              {/* Email optional */}
              <Form.Group className="mb-4">
                <Form.Label>Email (optional)</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="E-Mail-Adresse eingeben"
                  value={artistData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={(e) => handleFieldBlur("email", e.target.value)}
                  required={isRequired("email")} // false
                  isInvalid={!!fieldErrors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6">
              {/* Phone optional */}
              <Form.Group className="mb-3">
                <Form.Label>Telefon (optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="+49xxxxxxxxxx"
                  value={artistData.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                  required={isRequired("phone")} // false
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
                    onBlur={(e) => handleFieldBlur("street", e.target.value)}
                    required={isRequired("street")} // false
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
                    onChange={(e) =>
                      handleFieldChange("houseNumber", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("houseNumber", e.target.value)
                    }
                    required={isRequired("houseNumber")} // false
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
                    onChange={(e) =>
                      handleFieldChange("postalCode", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("postalCode", e.target.value)
                    }
                    required={isRequired("postalCode")} // false
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
                    required={isRequired("city")} // false
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
                    onBlur={(e) => handleFieldBlur("state", e.target.value)}
                    required={isRequired("state")} // false
                    isInvalid={!!fieldErrors.state}
                  >
                    <option value="">Bundesland auswählen</option>
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
                  <Spinner as="span" animation="border" size="sm" /> Speichern...
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
