/**
 * Sort events by date (most recent first)
 */
export const sortEventsByDate = (eventsArray) => {
  return [...eventsArray].sort((a, b) => {
    const dateA = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
    const dateB = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
    return dateA - dateB;
  });
};

/**
 * Generate dummy data for completed and paid events
 */
export const generateDummyEvents = (eventsData, type) => {
  const dummyEvents = JSON.parse(JSON.stringify(eventsData));

  Object.keys(dummyEvents).forEach((calendar) => {
    dummyEvents[calendar] = dummyEvents[calendar].map((event) => {
      // Add dummy data based on type
      if (type === "completed") {
        event.status = "abgeschlossen";
        event.totalCost = `€${(Math.random() * 500 + 100).toFixed(2)}`;
      } else if (type === "paid") {
        event.status = "bezahlt";
        event.totalCost = `€${(Math.random() * 500 + 100).toFixed(2)}`;
        event.paymentDate = new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("de-DE");
        event.receiptId = `RCPT-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;
      }
      return event;
    });
  });

  return dummyEvents;
};

/**
 * Determine available travel roles based on event and user context
 */
export const determineAvailableRoles = (event, user) => {
  const attendees = event?.attendees || [];
  const currentRole = (user?.travelRole || "").toLowerCase();

  // Helper to build role object
  const createRole = (value, disabled = false) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    disabled,
  });

  // Only 1 artist (the user themself) => can choose either freely
  if (attendees.length === 1) {
    return [createRole("driver", false), createRole("passenger", false)];
  }

  // 2 artists -> apply the cases
  if (attendees.length === 2) {
    const other = attendees.find((a) => a.email !== user.email) || {};
    const otherRole = (other.travelRole || "").toLowerCase();

    // Case A: current user is passenger -> show passenger (default) then driver (both selectable)
    if (currentRole === "passenger") {
      return [createRole("passenger", false), createRole("driver", false)];
    }

    // Case B: current user is driver -> behavior depends on the other artist
    if (currentRole === "driver") {
      if (otherRole === "driver") {
        // the other is driver too -> both selectable
        return [createRole("driver", false), createRole("passenger", false)];
      }
      if (otherRole === "passenger") {
        // the other is passenger -> current must stay driver; passenger option shown but unselectable
        return [createRole("driver", false), createRole("passenger", true)];
      }
      // fallback: the other has no role info -> allow both
      return [createRole("driver", false), createRole("passenger", false)];
    }

    // fallback: currentRole unknown -> prefer current (if present) else driver first
    if (!currentRole) {
      return [createRole("driver", false), createRole("passenger", false)];
    }

    // ultimate fallback: both
    return [createRole("driver", false), createRole("passenger", false)];
  }

  // More than 2 attendees: fallback to both selectable (not covered by your rules)
  return [
    createRole("driver", false),
    createRole("passenger", false),
  ];
};

/**
 * Filter events based on search term
 */
export const filterEvents = (eventsObj, searchTerm) => {
  const filtered = {};

  Object.keys(eventsObj).forEach((calendar) => {
    filtered[calendar] = (eventsObj[calendar] || []).filter(
      (event) =>
        (event.summary || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (event.calendar || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (event.role || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (event.location || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  });

  return filtered;
};

/**
 * Format date for display
 */
export const formatEventDate = (event) => {
  if (!event?.start?.dateTime) return "Datum unbekannt";

  const date = new Date(event.start.dateTime);
  return {
    date: date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: event.start.timeZone,
    }),
    time: date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: event.start.timeZone,
    }),
  };
};

/**
 * Get current user from event attendees
 */
export const getCurrentUserFromEvent = (event, userEmail) => {
  return event.attendees?.find((a) => a.email === userEmail);
};

/**
 * Format travel role for display
 */
export const formatTravelRole = (travelRole) => {
  if (!travelRole) return "Keine Reiserolle";
  
  switch (travelRole.toLowerCase()) {
    case "driver":
      return "Fahrer*in";
    case "passenger":
      return "Beifahrer*in";
    default:
      return travelRole.charAt(0).toUpperCase() + travelRole.slice(1);
  }
};

/**
 * Check if calendar has matching events after filtering
 */
export const calendarHasMatch = (calendar, eventsData) => {
  return eventsData[calendar] && eventsData[calendar].length > 0;
};

/**
 * Get total number of filtered events
 */
export const getTotalFilteredEvents = (eventsData) => {
  return Object.values(eventsData).flat().length;
};

/**
 * Initialize expanded calendars state
 */
export const initializeExpandedCalendars = (eventsData) => {
  const initialExpandState = {};
  Object.keys(eventsData || {}).forEach((cal) => {
    initialExpandState[cal] = true;
  });
  return initialExpandState;
};