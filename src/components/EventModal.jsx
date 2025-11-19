import React from "react";
import { Button } from "react-bootstrap";
import { Calendar3, GeoAlt, Clock, ArrowLeft, Person } from "react-bootstrap-icons";

const EventModal = ({ user, modalFor, event, onClose, mode }) => {
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

  // Calendar configuration with required roles
  const calendarConfig = [
    { calendar: "Geigen Mitmachkonzert", roles: ["Geiger*in", "Moderator*in"] },
    { calendar: "Klavier Mitmachkonzert", roles: ["Pianist*in", "Moderator*in"] },
    { calendar: "Laternenumzug mit Musik", roles: ["Instrumentalist*in", "Sängerin*in"] },
    { calendar: "Nikolaus Besuch", roles: ["Nikolaus", "Sängerin*in"] },
    { calendar: "Puppentheater", roles: ["Puppenspieler*in"] },
    { calendar: "Weihnachts Mitmachkonzert", roles: ["Detlef", "Sängerin*in", "Admin"] },
  ];

  // Find current calendar configuration
  const currentCalendar = calendarConfig.find(
    (c) => c.calendar === event.calendarName
  );

  // Helper: get user's attendee record
  const currentUserAttendee = event.attendees?.find(
    (a) => a.email === user["E-Mail"]
  );

  // ✅ Determine which attendees to show based on mode
  let displayedArtists = [];
  let artistMessage = "";

  if (currentCalendar && currentCalendar.roles.length > 1) {
    if (mode === "assigned") {
      // find opposite role artist
      if (currentUserAttendee) {
        const userRole = currentUserAttendee.role;
        const oppositeRole = currentCalendar.roles.find((r) => r !== userRole);
        const otherArtist = event.attendees?.find((a) => a.role === oppositeRole);

        if (otherArtist) {
          displayedArtists = [otherArtist];
        } else {
          artistMessage = "Kein weiterer Künstler hat an dieser Veranstaltung teilgenommen.";
        }
      }
    } else if (mode === "unassigned") {
      // show all artists that have joined
      displayedArtists = event.attendees?.filter((a) =>
        currentCalendar.roles.includes(a.role)
      );
      if (!displayedArtists?.length) {
        artistMessage = "Bisher hat kein Künstler an dieser Veranstaltung teilgenommen.";
      }
    }
  }

  // Helper for travel expense info (unchanged)
  const getUserTravelExpense = () => {
    if (!user || !event?.eventExpense?.travelExpense) return null;
    const attendee = event.attendees?.find((a) => a.email === user["E-Mail"]);
    if (!attendee) return null;
    const userRole = attendee.artistTravelRole;
    const travelExpense = event.eventExpense.travelExpense;

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

    const calendarConfig = calendarWithTheRequiredRoles.find(
      (c) => c.calendar === event.calendarName
    );
    const requiredRoles = calendarConfig?.requiredRoles || [];

    if (requiredRoles.length > 1 && event.attendees?.length === 1) {
      return { amount: null, role: userRole, fraction: null, incomplete: true };
    }

    if (requiredRoles.length === 1 && userRole === "driver") {
      return {
        amount: attendee.artistTravelCost,
        role: userRole,
        fraction: "1/1",
      };
    }

    const drivers = event.attendees?.filter(
      (a) => a.artistTravelRole === "driver"
    );

    if (userRole === "driver") {
      if (drivers.length === 1) {
        return {
          amount: attendee.artistTravelCost,
          role: userRole,
          fraction: "2/3",
        };
      } else if (drivers.length === 2) {
        return {
          amount: attendee.artistTravelCost,
          role: userRole,
          fraction: "1/2",
        };
      }
    }

    if (userRole === "passenger") {
      return {
        amount: attendee.artistTravelCost,
        role: userRole,
        fraction: "1/3",
      };
    }

    return {
      amount: attendee.artistTravelCost,
      role: userRole,
      fraction: null,
    };
  };

  const userTravelExpense = getUserTravelExpense();

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
          {/* Event basic details */}
          <div className="email-details-section">
            <div className="email-detail">
              <p className="email-detail-label">
                <i className="bi bi-calendar-event me-2"></i> Veranstaltung
              </p>
              <p className="email-detail-value">{event.summary || "N/A"}</p>
            </div>

            <div className="email-detail">
              <p className="email-detail-label">
                <i className="bi bi-calendar-check me-2"></i> Kalender
              </p>
              <p className="email-detail-value">{event.calendarName || "N/A"}</p>
            </div>

            <div className="email-detail">
              <p className="email-detail-label">
                <Clock className="me-2" /> Datum/Uhrzeit
              </p>
              <p className="email-detail-value">
                {formatDate(event.start?.dateTime, event.start?.timeZone)}
              </p>
            </div>

            {/* Kosten */}
            <div className="email-detail">
              <p className="email-detail-label">
                <i className="bi bi-currency-euro me-2"></i> Kosten
              </p>
              <p className="email-detail-value">
                Veranstaltungsvergütung:{" "}
                {event.eventExpense?.eventPay
                  ? `${event.eventExpense.eventPay} €`
                  : event.calendarName === "Puppentheater"
                  ? "110 €"
                  : "N/A"}
                <br />
                Reise:{" "}
                {event.eventExpense?.travelExpense
                  ? `${event.eventExpense.travelExpense} €`
                  : "N/A"}
                {modalFor === "assigned" ? (
                  <>
                    {userTravelExpense?.incomplete ? (
                      <>
                        <br />
                        <span className="text-danger">
                          Ein weiterer Künstler ist noch nicht beigetreten. Dein Reisekostenanteil kann nicht berechnet werden.
                        </span>
                      </>
                    ) : (
                      userTravelExpense && (
                        <>
                          <br />
                          Dein Anteil: {userTravelExpense.amount?.toFixed(2)} € (
                          {userTravelExpense.role === "driver"
                            ? "Fahrer*in"
                            : userTravelExpense.role === "passenger"
                            ? "Beifahrer*in"
                            : ""}
                          {userTravelExpense.fraction &&
                            ` – ${userTravelExpense.fraction}`}
                          )
                        </>
                      )
                    )}
                  </>
                ) : event.eventExpense?.travelExpense ? (
                  <>
                    <br />
                    <span className="text-muted">
                      <strong>Hinweis:</strong> Fahrer*in allein = volle Kosten. Zwei Fahrer*innen = je 1/2. Fahrer*in + Beifahrer*in = 2/3 und 1/3.
                    </span>
                  </>
                ) : null}
              </p>
            </div>

            {/* ✅ NEW SECTION: Artist Info */}
            {currentCalendar && currentCalendar.roles.length > 1 && (
              <div className="email-detail mt-3">
                <p className="email-detail-label">
                  <Person className="me-2" /> Künstler
                </p>
                {displayedArtists.length > 0 ? (
                  displayedArtists.map((artist, idx) => (
                    <p key={idx} className="email-detail-value">
                      {artist.name || artist.email} – {artist.role} {artist?.travelRole ? `(- ${artist.travelRole})` : ""}
                    </p>
                  ))
                ) : (
                  <p className="text-muted">{artistMessage}</p>
                )}
              </div>
            )}

            {/* Ort */}
            <div className="email-detail">
              <p className="email-detail-label">
                <GeoAlt className="me-2" /> Ort
              </p>
              <p className="email-detail-value">
                {event.location ? (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}`}
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
                <i className="bi bi-card-text me-2"></i> Beschreibung
              </h3>
              <div className="email-content-preview" style={{ whiteSpace: "pre-line" }}>
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
                <Calendar3 className="me-2" /> In Kalender öffnen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
