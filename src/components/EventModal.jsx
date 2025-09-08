import React from "react";
import { Button, Badge, Alert } from "react-bootstrap";
import {
  Calendar3,
  Envelope,
  GeoAlt,
  Clock,
  Person,
  PersonCheck,
  ArrowLeft,
} from "react-bootstrap-icons";

const EventModal = ({ user, modalFor, event, onClose }) => {
  if (!event) {
    return (
      <div className="email-modal-overlay">
        <div className="email-modal-container">
          <div className="alert alert-warning">
            Veranstaltung nicht gefunden
          </div>
          <Button
            variant="primary"
            onClick={onClose}
            className="email-modal-close-btn"
          >
            <ArrowLeft className="me-2" />
            Zurück zur Veranstaltungsliste
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateTime, timeZone) => {
    if (!dateTime) return "N/A";

    try {
      const date = new Date(dateTime);
      return date.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timeZone || "Europe/Berlin",
      });
    } catch {
      return "N/A";
    }
  };

  // Required roles config
  const calendarWithTheRequiredRoles = [
    {
      calendar: "Geigen Mitmachkonzert",
      requiredRoles: ["Geiger*in", "Moderator*in"],
    },
    {
      calendar: "Klavier Mitmachkonzert",
      requiredRoles: ["Pianist*in", "Moderator*in"],
    },
    {
      calendar: "Laternenumzug mit Musik",
      requiredRoles: ["Instrumentalist*in", "Sängerin*in"],
    },
    {
      calendar: "Nikolaus Besuch",
      requiredRoles: ["Nikolaus", "Sängerin*in"],
    },
    {
      calendar: "Puppentheater",
      requiredRoles: ["Puppenspieler*in"],
    },
    {
      calendar: "Weihnachts Mitmachkonzert",
      requiredRoles: ["Detlef", "Sängerin*in"],
    },
  ];

  // Helper: calculate user's travel expense
  const calculateUserTravelExpense = () => {
    if (!user || !event?.eventExpense?.travelExpense) return null;

    const travelExpense = event.eventExpense.travelExpense;

    // find the attendee for the current user
    const attendee = event.attendees?.find(
      (a) => a.email === user["E-Mail"]
    );
    if (!attendee) return null;

    const userRole = attendee.travelRole;

    // find required roles for this calendar
    const calendarConfig = calendarWithTheRequiredRoles.find(
      (c) => c.calendar === event.calendarName
    );

    const requiredRoles = calendarConfig?.requiredRoles || [];

    // CASE 1: calendar requires only one role -> full travelExpense goes to driver
    if (requiredRoles.length === 1 && userRole === "driver") {
      return { amount: travelExpense, role: userRole };
    }

    // collect all drivers in attendees
    const drivers = event.attendees?.filter((a) => a.travelRole === "driver");

    // CASE 2: user is driver
    if (userRole === "driver") {
      if (drivers.length === 1) {
        // single driver: gets 2/3
        return { amount: (2 / 3) * travelExpense, role: userRole };
      } else if (drivers.length === 2) {
        // two drivers: split equally
        return { amount: (1 / 2) * travelExpense, role: userRole };
      }
    }

    // CASE 3: user is passenger
    if (userRole === "passenger") {
      // passengers share the remaining 1/3 equally
      const passengers = event.attendees?.filter(
        (a) => a.travelRole === "passenger"
      );
      if (passengers.length > 0) {
        return {
          amount: (1 / 3) * travelExpense / passengers.length,
          role: userRole,
        };
      }
    }

    return null;
  };

  const userTravelExpense = calculateUserTravelExpense();

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
              <p className="email-detail-value">{event.summary || "N/A"}</p>
            </div>

            <div className="email-detail">
              <p className="email-detail-label">
                <i className="bi bi-calendar-check me-2"></i>
                Kalender
              </p>
              <p className="email-detail-value">
                {event.calendarName || "N/A"}
              </p>
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
                <i className="bi bi-currency-euro me-2"></i>
                Kosten
              </p>
              <p className="email-detail-value">
                Gesamt:{" "}
                {event.eventExpense?.totalExpense
                  ? `${event.eventExpense.totalExpense} €`
                  : "N/A"}
                <br />
                Reise:{" "}
                {event.eventExpense?.travelExpense
                  ? `${event.eventExpense.travelExpense} €`
                  : "N/A"}
                {modalFor === "assigned" && userTravelExpense && (
                  <>
                    <br />
                    Dein Anteil: {userTravelExpense.amount.toFixed(2)} € (
                    {userTravelExpense.role})
                  </>
                )}
              </p>
            </div>

            <div className="email-detail">
              <p className="email-detail-label">
                <GeoAlt className="me-2" />
                Ort
              </p>
              <p className="email-detail-value">
                {event.location ? (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                      event.location
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {event.location}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>

          {event.description && (
            <div className="email-content-section">
              <h3 className="email-content-title">
                <i className="bi bi-card-text me-2"></i>
                Beschreibung
              </h3>
              <div
                className="email-content-preview"
                style={{ whiteSpace: "pre-line" }}
              >
                {event.description}
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between mt-4">
            <div></div>

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
