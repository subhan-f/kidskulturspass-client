import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Table,
  Button,
  Modal,
  Badge,
  Spinner,
  Alert,
  Form,
  Dropdown,
} from "react-bootstrap";
import {
  ChevronDown,
  ChevronUp,
  X,
  CalendarEvent,
  ExclamationCircle,
  Plus,
  Check,
  Clock,
  ArrowRepeat,
} from "react-bootstrap-icons";
import DashboardLayout from "../components/DashboardLayout";
import SearchBox from "../components/SearchBox";
import { useMediaQuery } from "react-responsive";
import DashboardLoader from "../components/DashboardLoader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { authApi } from "../utils/api";

// Helper functions for recurrence
const dateToYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ymdToICS = (ymd) => {
  return ymd.replace(/-/g, "");
};

const jsWeekdayToICal = (dayIdx) => {
  // Map JavaScript day index (0=Sunday) to iCal day
  const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return days[dayIdx];
};

const nthOfMonthFromDate = (date) => {
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // Get week number in month (1-5)
  const firstWeekDay = firstDay.getDay();
  const weekNumber = Math.ceil((day + firstWeekDay) / 7);

  // Check if it's the last week
  const isLastWeek = day > lastDay.getDate() - 7;

  return isLastWeek ? -1 : weekNumber;
};

const weekdayICalFromDate = (date) => {
  return jsWeekdayToICal(date.getDay());
};

const buildRRuleFromPreset = (
  preset,
  startDate,
  endChoice = { kind: "never" }
) => {
  if (preset === "NONE") return undefined;

  let rrule = "RRULE:FREQ=";
  let baseRule = "";

  switch (preset) {
    case "DAILY":
      baseRule = "DAILY;INTERVAL=1";
      break;
    case "WEEKLY_ON_START":
      const weekday = weekdayICalFromDate(startDate);
      baseRule = `WEEKLY;INTERVAL=1;BYDAY=${weekday}`;
      break;
    case "WEEKDAYS":
      baseRule = "WEEKLY;BYDAY=MO,TU,WE,TH,FR";
      break;
    case "MONTHLY_ON_DAY":
      const day = startDate.getDate();
      baseRule = `MONTHLY;BYMONTHDAY=${day}`;
      break;
    case "MONTHLY_ON_NTH_WEEKDAY":
      const nth = nthOfMonthFromDate(startDate);
      const wday = weekdayICalFromDate(startDate);
      baseRule = `MONTHLY;BYDAY=${wday};BYSETPOS=${nth}`;
      break;
    case "YEARLY_ON_DATE":
      const month = startDate.getMonth() + 1;
      const mday = startDate.getDate();
      baseRule = `YEARLY;BYMONTH=${month};BYMONTHDAY=${mday}`;
      break;
    default:
      return undefined;
  }

  // Add end condition
  if (endChoice.kind === "on" && endChoice.untilYMD) {
    rrule = `${rrule}${baseRule};UNTIL=${ymdToICS(endChoice.untilYMD)}`;
  } else if (endChoice.kind === "after" && endChoice.count) {
    rrule = `${rrule}${baseRule};COUNT=${endChoice.count}`;
  } else {
    rrule = `${rrule}${baseRule}`;
  }

  // Add week start
  rrule = `${rrule};WKST=MO`;

  return rrule;
};

const buildRRuleFromCustom = (state) => {
  let baseRule = "RRULE:FREQ=";

  switch (state.repeatUnit) {
    case "day":
      baseRule += `DAILY;INTERVAL=${state.repeatEvery}`;
      break;
    case "week":
      const days = state.selectedDays.join(",");
      baseRule += `WEEKLY;INTERVAL=${state.repeatEvery};BYDAY=${days}`;
      break;
    case "month":
      // Check if we should use day of month or nth weekday
      if (state.selectedDays.length > 0) {
        // Using nth weekday
        const nth = nthOfMonthFromDate(state.repeatDate);
        const wday = state.selectedDays[0]; // For monthly, typically only one day
        baseRule += `MONTHLY;INTERVAL=${state.repeatEvery};BYDAY=${wday};BYSETPOS=${nth}`;
      } else {
        // Using day of month
        const day = state.repeatDate.getDate();
        baseRule += `MONTHLY;INTERVAL=${state.repeatEvery};BYMONTHDAY=${day}`;
      }
      break;
    case "year":
      const month = state.repeatDate.getMonth() + 1;
      const mday = state.repeatDate.getDate();
      baseRule += `YEARLY;INTERVAL=${state.repeatEvery};BYMONTH=${month};BYMONTHDAY=${mday}`;
      break;
    default:
      return undefined;
  }

  // Add end condition
  if (state.endOption === "on" && state.endDateCustom) {
    baseRule += `;UNTIL=${ymdToICS(state.endDateCustom)}`;
  } else if (state.endOption === "after" && state.occurrences) {
    baseRule += `;COUNT=${state.occurrences}`;
  }

  // Add week start
  baseRule += ";WKST=MO";

  return baseRule;
};

const formatRecurrenceLabel = (rrule, locale = "de-DE") => {
  if (!rrule) return "";

  // Parse the RRULE string
  const parts = rrule.replace("RRULE:", "").split(";");
  const params = {};
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    params[key] = value;
  });

  const freq = params.FREQ;
  const interval = parseInt(params.INTERVAL) || 1;
  const byDay = params.BYDAY;
  const byMonthDay = params.BYMONTHDAY;
  const bySetPos = params.BYSETPOS;
  const byMonth = params.BYMONTH;
  const until = params.UNTIL;
  const count = params.COUNT;

  // German day and month names
  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  let label = "";

  switch (freq) {
    case "DAILY":
      label = interval === 1 ? "Täglich" : `Alle ${interval} Tage`;
      break;
    case "WEEKLY":
      if (byDay === "MO,TU,WE,TH,FR") {
        label = "Jeden Mo–Fr";
      } else {
        const dayLabels = byDay
          .split(",")
          .map((day) => {
            const dayMap = {
              MO: "Mo",
              TU: "Di",
              WE: "Mi",
              TH: "Do",
              FR: "Fr",
              SA: "Sa",
              SU: "So",
            };
            return dayMap[day] || day;
          })
          .join(", ");
        label =
          interval === 1
            ? `Wöchentlich am ${dayLabels}`
            : `Alle ${interval} Wochen am ${dayLabels}`;
      }
      break;
    case "MONTHLY":
      if (bySetPos) {
        const posMap = { 1: "1.", 2: "2.", 3: "3.", 4: "4.", "-1": "letzten" };
        const dayMap = {
          MO: "Montag",
          TU: "Dienstag",
          WE: "Mittwoch",
          TH: "Donnerstag",
          FR: "Freitag",
          SA: "Samstag",
          SU: "Sonntag",
        };
        label =
          interval === 1
            ? `Monatlich am ${posMap[bySetPos]} ${dayMap[byDay]}`
            : `Alle ${interval} Monate am ${posMap[bySetPos]} ${dayMap[byDay]}`;
      } else {
        label =
          interval === 1
            ? `Monatlich am ${byMonthDay}.`
            : `Alle ${interval} Monate am ${byMonthDay}.`;
      }
      break;
    case "YEARLY":
      const monthName = monthNames[parseInt(byMonth) - 1];
      label =
        interval === 1
          ? `Jährlich am ${byMonthDay}. ${monthName}`
          : `Alle ${interval} Jahre am ${byMonthDay}. ${monthName}`;
      break;
    default:
      return rrule;
  }

  // Add end condition
  if (until) {
    const untilDate = new Date(
      parseInt(until.substring(0, 4)),
      parseInt(until.substring(4, 6)) - 1,
      parseInt(until.substring(6, 8))
    );
    const formattedDate = untilDate.toLocaleDateString("de-DE");
    label += ` bis ${formattedDate}`;
  } else if (count) {
    label += ` nach ${count} ${count === 1 ? "Ereignis" : "Ereignissen"}`;
  }

  return label;
};

const parseRRuleToCustomState = (rrule, startDate) => {
  // Default state
  const defaultState = {
    repeatDate: startDate,
    repeatEvery: 1,
    repeatUnit: "week",
    selectedDays: [weekdayICalFromDate(startDate)],
    endOption: "never",
    endDateCustom: undefined,
    occurrences: undefined,
  };

  if (!rrule) return defaultState;

  // Parse the RRULE string
  const parts = rrule.replace("RRULE:", "").split(";");
  const params = {};
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    params[key] = value;
  });

  const freq = params.FREQ;
  const interval = parseInt(params.INTERVAL) || 1;
  const byDay = params.BYDAY;
  const until = params.UNTIL;
  const count = params.COUNT;

  // Map frequency to repeatUnit
  let repeatUnit = "week";
  switch (freq) {
    case "DAILY":
      repeatUnit = "day";
      break;
    case "WEEKLY":
      repeatUnit = "week";
      break;
    case "MONTHLY":
      repeatUnit = "month";
      break;
    case "YEARLY":
      repeatUnit = "year";
      break;
  }

  // Parse selected days
  let selectedDays = [];
  if (byDay) {
    selectedDays = byDay.split(",");
  }

  // Parse end condition
  let endOption = "never";
  let endDateCustom, occurrences;

  if (until) {
    endOption = "on";
    endDateCustom = `${until.substring(0, 4)}-${until.substring(
      4,
      6
    )}-${until.substring(6, 8)}`;
  } else if (count) {
    endOption = "after";
    occurrences = parseInt(count);
  }

  return {
    repeatDate: startDate,
    repeatEvery: interval,
    repeatUnit,
    selectedDays,
    endOption,
    endDateCustom,
    occurrences,
  };
};

const UnavailabilityDashboard = ({ setAuth, handleLogout }) => {
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCustomRepeatModal, setShowCustomRepeatModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedUnavailability, setSelectedUnavailability] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [joinedCalendars, setJoinedCalendars] = useState([]);
  const [showDeleteOptionsModal, setShowDeleteOptionsModal] = useState(false);
  const [deleteOption, setDeleteOption] = useState("all");
  const [recurrenceId, setRecurrenceId] = useState(null);

  // Recurrence state
  const [recurrencePreset, setRecurrencePreset] = useState("NONE");
  const [recurrenceObj, setRecurrenceObj] = useState(null);
  const [recurrenceEndChoice, setRecurrenceEndChoice] = useState({
    kind: "never",
  });

  // Custom repeat state
  const [repeatDate, setRepeatDate] = useState(new Date());
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState("week");
  const [selectedDays, setSelectedDays] = useState([]);
  const [endOption, setEndOption] = useState("never");
  const [endDateCustom, setEndDateCustom] = useState("");
  const [occurrences, setOccurrences] = useState(1);

  // New state for time and all-day
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [isAllDay, setIsAllDay] = useState(true);

  // Busy artist state
  const [selectedMonth, setSelectedMonth] = useState("");
  const [busySelectedDays, setBusySelectedDays] = useState([]);
  const [isBusySubmitting, setIsBusySubmitting] = useState(false);

  const [activeModal, setActiveModal] = useState(null);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const USER_API_URL =
    "https://artist-crud-function-754826373806.europe-west10.run.app";
  const UNAVAILABLE_API_URL =
    "https://unavailable-events-754826373806.europe-west1.run.app";

  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ][currentMonthIndex];

  const monthsFromCurrent = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ].slice(currentMonthIndex);

  const daysOfWeek = [
    { id: "monday", label: "Montag" },
    { id: "tuesday", label: "Dienstag" },
    { id: "wednesday", label: "Mittwoch" },
    { id: "thursday", label: "Donnerstag" },
    { id: "friday", label: "Freitag" },
    { id: "saturday", label: "Samstag" },
    { id: "sunday", label: "Sonntag" },
  ];

  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeValue = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
        options.push(timeValue);
      }
    }
    return options;
  };

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // Function to filter time options based on current time for today's date
  const getFilteredTimeOptions = (isStartTime) => {
    const now = new Date();

    // Add proper null/undefined check - return all options if startDate is null
    if (!startDate) {
      return timeOptions;
    }

    try {
      const isToday = startDate.toDateString() === now.toDateString();

      if (!isToday || !isStartTime) return timeOptions;

      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const roundedMinute = Math.ceil(currentMinute / 15) * 15;
      const currentTimeValue = `${String(currentHour).padStart(
        2,
        "0"
      )}:${String(roundedMinute).padStart(2, "0")}`;

      return timeOptions.filter((time) => time >= currentTimeValue);
    } catch (error) {
      console.error("Error filtering time options:", error);
      return timeOptions; // Return all options as fallback
    }
  };

  const buildEventPayload = (form) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (isAllDay) {
      return {
        title: form.title || "Sperrtermin",
        calendarName: "Sperrtermine",
        allDay: true,
        timezone: timezone,
        startDate: dateToYMD(form.startDate),
        endDate: dateToYMD(form.endDate),
        recurrence: form.recurrence,
      };
    } else {
      return {
        title: form.title || "Sperrtermin",
        calendarName: "Sperrtermine",
        allDay: false,
        timezone: timezone,
        startDate: dateToYMD(form.startDate),
        endDate: dateToYMD(form.endDate),
        startTime: startTime,
        endTime: endTime,
        recurrence: form.recurrence,
      };
    }
  };

  const toBerlinTime = (date) => {
    return new Date(
      date.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
    );
  };

  const fetchUnavailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userRes = await authApi.getMe();
      setCurrentUser(userRes.data.user);

      const userDataRes = await axios.get(
        `${USER_API_URL}/?id=${userRes.data.user._id}`
      );
      const userFromApi = userDataRes.data;

      const calendars = [{ Calendar: "Sperrtermine" }];
      setJoinedCalendars(calendars);

      const calendarNames = calendars.map((c) => c.Calendar);
      const payload = {
        user: {
          name: userFromApi.Name,
          email: userFromApi["E-Mail"],
          calendars: calendarNames,
        },
      };

      const unavailabilityRes = await axios.post(
        `${UNAVAILABLE_API_URL}/getUnavailabilities`,
        payload
      );

      console.log("Unavailability data fetched:", unavailabilityRes.data);

      const fetched = (unavailabilityRes.data || []).map((event) => {
        // Handle both all-day and timed events
        const isAllDay = !!event.start.date;
        const startDate = event.start.date || event.start.dateTime;
        const endDate = event.end.date || event.end.dateTime;

        const berlinStart = new Date(startDate);
        const berlinEnd = new Date(endDate);

        // For all-day events, adjust end date
        if (event.start.date) {
          berlinEnd.setDate(berlinEnd.getDate() - 1);
        }

        // Extract time information
        let startTime = null;
        let endTime = null;

        if (!isAllDay) {
          startTime = event.start.dateTime
            ? new Date(event.start.dateTime).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Berlin",
              })
            : null;

          endTime = event.end.dateTime
            ? new Date(event.end.dateTime).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Berlin",
              })
            : null;
        }

        return {
          id: event.id,
          startDate: berlinStart.toISOString().split("T")[0],
          endDate: berlinEnd.toISOString().split("T")[0],
          startTime: startTime,
          endTime: endTime,
          isAllDay: isAllDay,
          details: event.description || "Nicht verfügbar",
          htmlLink: event.htmlLink || "",
          isRecurring: event.isRecurring || false,
          recurrenceSummary: event.recurrenceSummary || "",
          recurrenceId: event.recurringEventId || null,
          recurrenceRule: event.recurrenceRule || null,
          originalStartTime: event.originalStartTime || null,
        };
      });

      setUnavailabilities(fetched);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(
        "Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut."
      );
      toast.error("Fehler beim Laden der Sperrtermine");
      setUnavailabilities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnavailabilities();
  }, [fetchUnavailabilities]);

  const filteredUnavailabilities = useMemo(() => {
    if (!searchTerm.trim()) return unavailabilities;

    const searchLower = searchTerm.toLowerCase();
    return unavailabilities.filter((unavailability) => {
      const startDateText = new Date(unavailability.startDate)
        .toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })
        .toLowerCase();
      const endDateText = new Date(unavailability.endDate)
        .toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })
        .toLowerCase();
      return (
        startDateText.includes(searchLower) || endDateText.includes(searchLower)
      );
    });
  }, [unavailabilities, searchTerm]);

  // Keep the existing formatDateNoTZ function for backend:
  const formatDateNoTZ = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const handleRecurrencePresetChange = (preset) => {
    setRecurrencePreset(preset);

    if (preset === "CUSTOM") {
      setActiveModal("custom");
      setShowCustomRepeatModal(true);
      setShowFormModal(false); // Hide the add modal
      return;
    }

    if (preset === "NONE") {
      setRecurrenceObj(undefined);
      return;
    }

    if (!startDate) {
      toast.error("Bitte wählen Sie zuerst ein Startdatum");
      return;
    }

    const rrule = buildRRuleFromPreset(preset, startDate, recurrenceEndChoice);
    const summary = formatRecurrenceLabel(rrule);

    setRecurrenceObj({
      rrule,
      summary,
    });
  };
  const handleCustomRepeatSubmit = (e) => {
    e.preventDefault();

    // Validate
    if (repeatUnit === "week" && selectedDays.length === 0) {
      toast.error("Bitte wählen Sie mindestens einen Wochentag aus");
      return;
    }

    if (
      endOption === "on" &&
      (!endDateCustom || new Date(endDateCustom) < repeatDate)
    ) {
      toast.error("Enddatum muss nach dem Startdatum liegen");
      return;
    }

    if (endOption === "after" && (!occurrences || occurrences < 1)) {
      toast.error("Bitte geben Sie eine gültige Anzahl von Ereignissen ein");
      return;
    }

    const customState = {
      repeatDate,
      repeatEvery,
      repeatUnit,
      selectedDays,
      endOption,
      endDateCustom: endOption === "on" ? endDateCustom : undefined,
      occurrences: endOption === "after" ? occurrences : undefined,
    };

    const rrule = buildRRuleFromCustom(customState);
    const summary = formatRecurrenceLabel(rrule);

    setRecurrenceObj({
      rrule,
      summary,
    });
    setRecurrencePreset("CUSTOM");

    // Close custom modal and reopen add modal
    setShowCustomRepeatModal(false);
    setActiveModal("add");
    setShowFormModal(true);
  };

  const handleCustomModalClose = () => {
    setShowCustomRepeatModal(false);
    setActiveModal("add");
    setShowFormModal(true);
    resetCustomRepeatForm();
  };

  const resetCustomRepeatForm = () => {
    setRepeatDate(startDate || new Date());
    setRepeatEvery(1);
    setRepeatUnit("week");
    setSelectedDays(startDate ? [weekdayICalFromDate(startDate)] : []);
    setEndOption("never");
    setEndDateCustom("");
    setOccurrences(1);
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!startDate || !endDate || startDate > endDate) {
      toast.error("Bitte wählen Sie einen gültigen Datumsbereich.");
      setIsSubmitting(false);
      return;
    }

    // Time validation for non-all-day events
    if (!isAllDay) {
      // If it's the same day, check that end time is after start time
      if (startDate.getTime() === endDate.getTime() && startTime >= endTime) {
        toast.error("Endzeit muss nach der Startzeit liegen.");
        setIsSubmitting(false);
      }
    }

    try {
      const calendarNames = "Sperrtermine";

      const formattedStart = formatDateNoTZ(startDate);
      const formattedEnd = formatDateNoTZ(endDate);

      const unavailabilityData = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: calendarNames,
        },
        unavailability: {
          startDate: formattedStart,
          endDate: formattedEnd,
          startTime: isAllDay ? undefined : startTime,
          endTime: isAllDay ? undefined : endTime,
          allDay: isAllDay,
          veryBusy: false,
          reason: "Nicht verfügbar",
          details: "Nicht verfügbar",
          recurrence: recurrenceObj,
        },
      };

      console.log("Unavailability data to submit:", unavailabilityData);

      await axios.post(
        `${UNAVAILABLE_API_URL}/unavailabilities`,
        unavailabilityData
      );

      toast.success("Sperrtermin erfolgreich hinzugefügt");
      setSubmitSuccess(true);

      setTimeout(() => {
        setShowFormModal(false);
        resetForm();
        fetchUnavailabilities();
      }, 1000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Fehler beim Speichern des Sperrtermins");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (unavailability) => {
    setSelectedUnavailability(unavailability);
    setRecurrenceId(unavailability.recurrenceId || null);

    if (unavailability.isRecurring) {
      setShowDeleteOptionsModal(true);
    } else {
      setShowDeleteModal(true);
    }
  };

  // Add this new modal for recurrence deletion options
  const DeleteOptionsModal = () => (
    <Modal
      show={showDeleteOptionsModal}
      onHide={() => {
        if (!isDeleting) {
          setShowDeleteOptionsModal(false);
        }
      }}
      centered
      backdrop={isDeleting ? "static" : true}
      keyboard={!isDeleting}
    >
      <Modal.Header closeButton={!isDeleting}>
        <Modal.Title>Wiederkehrenden Termin löschen</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isDeleting ? (
          <div className="text-center py-3">
            <Spinner animation="border" role="status" className="me-2" />
            Termin wird gelöscht...
          </div>
        ) : (
          <>
            <p>Wie möchten Sie diesen wiederkehrenden Termin löschen?</p>
            <Form>
              <Form.Check
                type="radio"
                id="delete-all"
                name="deleteOption"
                label="Alle Termine in der Serie löschen"
                checked={deleteOption === "all"}
                onChange={() => setDeleteOption("all")}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="delete-this"
                name="deleteOption"
                label="Nur diesen Termin löschen"
                checked={deleteOption === "this"}
                onChange={() => setDeleteOption("this")}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="delete-following"
                name="deleteOption"
                label="Diesen und alle folgenden Termine löschen"
                checked={deleteOption === "following"}
                onChange={() => setDeleteOption("following")}
              />
            </Form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteOptionsModal(false)}
          disabled={isDeleting}
        >
          Abbrechen
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            setShowDeleteOptionsModal(false);
            setShowDeleteModal(true);
          }}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Löschen...
            </>
          ) : (
            "Fortfahren"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const resetForm = () => {
    setStartDate(null);
    setEndDate(null);
    setStartTime("00:00");
    setEndTime("23:59");
    setIsAllDay(true);
    setSubmitSuccess(false);
    setRecurrencePreset("NONE");
    setRecurrenceObj(null);
    setRecurrenceEndChoice({ kind: "never" });
  };
  const handleDeleteConfirm = async () => {
    if (!selectedUnavailability) {
      toast.error("Ungültiger Sperrtermin ausgewählt");
      return;
    }

    setIsDeleting(true);
    try {
      // Decide IDs properly
      const parentId =
        selectedUnavailability.recurrenceId || selectedUnavailability.id;
      const instanceId = selectedUnavailability.id; // always has suffix if recurring

      let eventIdToSend = instanceId;
      let recurrenceIdToSend = parentId;

      if (selectedUnavailability.isRecurring) {
        if (deleteOption === "this") {
          // ✅ single occurrence
          eventIdToSend = instanceId;
        } else if (deleteOption === "all" || deleteOption === "following") {
          // ✅ parent event
          eventIdToSend = parentId;
        }
      }

      const deletePayload = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: ["Sperrtermine"],
        },
        eventId: eventIdToSend,
        recurrenceId: recurrenceIdToSend,
        deleteOption, // "this" | "all" | "following"
        originalStartTime: selectedUnavailability.originalStartTime,
      };

      // Add extra fields for recurring
      if (selectedUnavailability.isRecurring) {
        if (deleteOption === "this") {
          deletePayload.singleInstance = true;
          deletePayload.instanceStartDate = selectedUnavailability.startDate;
        } else if (deleteOption === "following") {
          deletePayload.exception = true;
          deletePayload.exceptionStartDate = selectedUnavailability.startDate;
        }
      }

      console.log("Delete payload:", deletePayload);

      await axios.delete(`${UNAVAILABLE_API_URL}/unavailabilities`, {
        data: deletePayload,
      });

      toast.success("Sperrtermin erfolgreich gelöscht");
      setShowDeleteModal(false);
      setShowDeleteOptionsModal(false);
      setDeleteOption("all");
      setRecurrenceId(null);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Fehler beim Löschen des Sperrtermins");
    } finally {
      setIsDeleting(false);
    }
  };

  const getReasonIcon = () => {
    return <ExclamationCircle className="reason-icon" />;
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const formatDateTime = (dateString, timeString = null, isAllDay = false) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("de-DE", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Europe/Berlin",
    });

    if (isAllDay || !timeString) {
      return formattedDate;
    }

    return `${formattedDate} : : ${timeString}`;
  };

  return (
    <DashboardLayout
      setAuth={setAuth}
      onRefresh={fetchUnavailabilities}
      handleLogout={handleLogout}
    >
      <div className="unavailability-dashboard">
        {!loading && (
          <div className="transparent-header-container">
            <h1 className="dashboard-main-title">Sperrtermine</h1>
            <div className="header-search-box">
              <SearchBox
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nach Datum suchen..."
              />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="dashboard-alert">
            {error}
          </Alert>
        )}

        <div className="d-flex justify-content-end mb-3 gap-2">
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setActiveModal("add");
              setShowFormModal(true);
            }}
            className="add-unavailability-btn"
          >
            <Plus className="me-2" />
            Sperrtermin hinzufügen
          </Button>
        </div>

        <div className="events-container">
          {loading ? (
            <DashboardLoader message="Lade Sperrtermine..." />
          ) : (
            <div className="event-calendar-card">
              <div className="calendar-header" onClick={toggleExpand}>
                <div className="header-content">
                  <div className="title-with-icon">
                    <h5 className="calendar-title">Meine Sperrtermine</h5>
                    <div className="dropdown-toggle-icon">
                      {expanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </div>
                    <Badge
                      bg="primary"
                      className="enhanced-badge capsule-badge"
                    >
                      Gesamt{" "}
                      <span className="badge-count">
                        {filteredUnavailabilities.length}
                      </span>
                    </Badge>
                  </div>
                  <span className="events-count">
                    <span className="count-number">
                      {filteredUnavailabilities.length}
                    </span>
                    <span className="count-label">
                      {filteredUnavailabilities.length === 1
                        ? " Eintrag"
                        : " Einträge"}
                    </span>
                  </span>
                </div>
              </div>

              {expanded && (
                <div className="calendar-content">
                  {filteredUnavailabilities.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CalendarEvent size={48} />
                      </div>
                      <h4>
                        {searchTerm
                          ? "Keine passenden Sperrtermine gefunden"
                          : "Keine Sperrtermine eingetragen"}
                      </h4>
                      <p>
                        {searchTerm
                          ? "Versuchen Sie einen anderen Suchbegriff"
                          : "Klicken Sie oben auf den Button, um einen Sperrtermin hinzuzufügen"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table className="events-table">
                          <thead>
                            <tr>
                              <th>Von (Berliner Zeit)</th>
                              <th>Bis (Berliner Zeit)</th>
                              <th>Grund</th>
                              <th>Aktionen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUnavailabilities.map(
                              (unavailability, index) => (
                                <tr key={index} className="event-row">
                                  <td></td>
                                  <td className="event-time">
                                    {formatDateTime(
                                      unavailability.startDate,
                                      unavailability.startTime,
                                      unavailability.isAllDay
                                    )} {" — "}
                                    {formatDateTime(
                                      unavailability.endDate,
                                      unavailability.endTime,
                                      unavailability.isAllDay
                                    )}
                                  </td>   
                                  <td>
                                    {unavailability.isRecurring && (
                                      <Badge bg="info" className="ms-2">
                                        <ArrowRepeat
                                          size={12}
                                          className="me-1"
                                        />
                                        Wiederholend
                                      </Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => {
                                        if (unavailability.htmlLink) {
                                          window.open(
                                            `${unavailability.htmlLink}`,
                                            "_blank"
                                          );
                                        } else {
                                          toast.error(
                                            "Kein Kalenderlink für dieses Ereignis verfügbar"
                                          );
                                        }
                                      }}
                                    >
                                      Details
                                    </Button>

                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteClick(unavailability)
                                      }
                                      className="delete-btn"
                                    >
                                      <X className="me-1" />
                                      <span className="d-none d-md-inline">
                                        Löschen
                                      </span>
                                    </Button>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </Table>
                      </div>
                      <div className="event-mobile-cards-container d-md-none">
                        {filteredUnavailabilities.map(
                          (unavailability, index) => (
                            <div key={index} className="event-mobile-card">
                              <div className="event-mobile-header">
                                <div style={{"paddingLeft":"5px"}} className="event-mobile-title">
                                  {formatDateTime(
                                    unavailability.startDate,
                                    unavailability.startTime,
                                    unavailability.isAllDay
                                  )}{" "}
                                  -{" "}
                                  {formatDateTime(
                                    unavailability.endDate,
                                    unavailability.endTime,
                                    unavailability.isAllDay
                                  )}
                                </div>
                              </div>
                              <div className="event-mobile-content">
                                <div className="event-mobile-reason">
                                  {unavailability.isRecurring && (
                                    <Badge bg="info" className="ms-2">
                                      <ArrowRepeat size={12} className="me-1" />
                                      Wiederholend
                                    </Badge>
                                  )}
                                </div>
                                <div className="event-mobile-actions">
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => {
                                      if (unavailability.htmlLink) {
                                        window.open(
                                          `${unavailability.htmlLink}`,
                                          "_blank"
                                        );
                                      } else {
                                        toast.error(
                                          "Kein Kalenderlink für dieses Ereignis verfügbar"
                                        );
                                      }
                                    }}
                                  >
                                    Details
                                  </Button>

                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteClick(unavailability)
                                    }
                                    className="delete-btn"
                                  >
                                    <X className="me-1" />
                                    Löschen
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        show={showFormModal && activeModal !== "custom"}
        onHide={() => {
          if (!isSubmitting) {
            setShowFormModal(false);
            resetForm();
            setActiveModal(null);
          }
        }}
        size="lg"
        centered
        backdrop={isSubmitting ? "static" : true}
        keyboard={!isSubmitting}
      >
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title>Sperrtermin eintragen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submitSuccess ? (
            <div className="text-center p-4">
              <div className="text-success mb-3">
                <Check size={48} />
              </div>
              <h4>Sperrtermin erfolgreich gespeichert!</h4>
              <p>Die Liste wird automatisch aktualisiert...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* All Day Checkbox */}
              <div className="form-group mb-3">
                <Form.Check
                  type="checkbox"
                  id="allDayCheckbox"
                  label="Ganztägig"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                />
              </div>

              {/* Start Date */}
              <div className="form-group mb-3">
                <label className="form-label">Von (Startdatum)</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <CalendarEvent />
                  </span>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      setEndDate(null);
                      // Reset times when date changes
                      if (!isAllDay) {
                        const now = new Date();
                        if (date.toDateString() === now.toDateString()) {
                          const currentHour = now.getHours();
                          const currentMinute = now.getMinutes();
                          const roundedMinute =
                            Math.ceil(currentMinute / 15) * 15;
                          setStartTime(
                            `${String(currentHour).padStart(2, "0")}:${String(
                              roundedMinute
                            ).padStart(2, "0")}`
                          );
                          // Set end time to 1 hour after start
                          const endHour = (currentHour + 1) % 24;
                          setEndTime(
                            `${String(endHour).padStart(2, "0")}:${String(
                              roundedMinute
                            ).padStart(2, "0")}`
                          );
                        } else {
                          setStartTime("00:00");
                          setEndTime("01:00");
                        }
                      }
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    dateFormat="dd.MM.yyyy"
                    className="form-control"
                    placeholderText="Startdatum auswählen"
                    required
                  />
                </div>
              </div>

              {/* Start Time (only show if not all day) */}
              {!isAllDay && (
                <div className="form-group mb-3">
                  <label className="form-label">Startzeit</label>
                  <Form.Select
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      // If end time is before or equal to start time, adjust it
                      if (e.target.value >= endTime) {
                        const [hours, minutes] = e.target.value
                          .split(":")
                          .map(Number);
                        let newHours = (hours + 1) % 24;
                        setEndTime(
                          `${String(newHours).padStart(2, "0")}:${String(
                            minutes
                          ).padStart(2, "0")}`
                        );
                      }
                    }}
                  >
                    {/* Add a null check before calling getFilteredTimeOptions */}
                    {startDate
                      ? getFilteredTimeOptions(true).map((time) => (
                          <option key={`start-${time}`} value={time}>
                            {time}
                          </option>
                        ))
                      : timeOptions.map((time) => (
                          <option key={`start-${time}`} value={time}>
                            {time}
                          </option>
                        ))}
                  </Form.Select>
                </div>
              )}

              {/* End Date */}
              <div className="form-group mb-3">
                <label className="form-label">Bis (Enddatum)</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <CalendarEvent />
                  </span>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    disabled={!startDate}
                    dateFormat="dd.MM.yyyy"
                    className="form-control"
                    placeholderText={
                      startDate
                        ? "Enddatum auswählen"
                        : "Bitte zuerst Startdatum wählen"
                    }
                    required
                  />
                </div>
              </div>

              {/* End Time (only show if not all day) */}
              {!isAllDay && (
                <div className="form-group mb-3">
                  <label className="form-label">Endzeit</label>
                  <Form.Select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!startDate}
                  >
                    {timeOptions.map((time) => (
                      <option
                        key={`end-${time}`}
                        value={time}
                        disabled={
                          startDate &&
                          endDate &&
                          startDate.toDateString() === endDate.toDateString() &&
                          time <= startTime
                        }
                      >
                        {time}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              )}
              {/* Recurrence Dropdown - Updated to include DAILY option */}
              <div className="form-group mb-3">
                <label className="form-label">Wiederholung</label>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    className="w-100 text-start"
                  >
                    <ArrowRepeat className="me-2" />
                    {recurrencePreset === "NONE" && "Wiederholt sich nicht"}
                    {recurrencePreset === "DAILY" && "Täglich"}
                    {recurrencePreset === "WEEKLY_ON_START" &&
                      `Wöchentlich am ${
                        startDate
                          ? new Date(startDate).toLocaleDateString("de-DE", {
                              weekday: "short",
                            })
                          : ""
                      }`}
                    {recurrencePreset === "WEEKDAYS" && "Jeden Mo–Fr"}
                    {recurrencePreset === "MONTHLY_ON_DAY" &&
                      `Monatlich am ${startDate ? startDate.getDate() : ""}.`}
                    {recurrencePreset === "MONTHLY_ON_NTH_WEEKDAY" &&
                      startDate &&
                      `Monatlich am ${nthOfMonthFromDate(
                        startDate
                      )}. ${new Date(startDate).toLocaleDateString("de-DE", {
                        weekday: "long",
                      })}`}
                    {recurrencePreset === "YEARLY_ON_DATE" &&
                      startDate &&
                      `Jährlich am ${startDate.getDate()}. ${new Date(
                        startDate
                      ).toLocaleDateString("de-DE", { month: "long" })}`}
                    {recurrencePreset === "CUSTOM" &&
                      `Benutzerdefiniert: ${recurrenceObj?.summary || ""}`}
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="w-100">
                    <Dropdown.Item
                      onClick={() => handleRecurrencePresetChange("NONE")}
                    >
                      Wiederholt sich nicht
                    </Dropdown.Item>
                    {/* Added DAILY option */}
                    <Dropdown.Item
                      onClick={() => handleRecurrencePresetChange("DAILY")}
                    >
                      Täglich
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        handleRecurrencePresetChange("WEEKLY_ON_START")
                      }
                      disabled={!startDate}
                    >
                      Wöchentlich am{" "}
                      {startDate
                        ? new Date(startDate).toLocaleDateString("de-DE", {
                            weekday: "long",
                          })
                        : ""}
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => handleRecurrencePresetChange("WEEKDAYS")}
                    >
                      Jeden Wochentag (Mo–Fr)
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        handleRecurrencePresetChange("MONTHLY_ON_DAY")
                      }
                      disabled={!startDate}
                    >
                      Monatlich am {startDate ? startDate.getDate() : ""}.
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        handleRecurrencePresetChange("MONTHLY_ON_NTH_WEEKDAY")
                      }
                      disabled={!startDate}
                    >
                      {startDate &&
                        `Monatlich am ${nthOfMonthFromDate(
                          startDate
                        )}. ${new Date(startDate).toLocaleDateString("de-DE", {
                          weekday: "long",
                        })}`}
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() =>
                        handleRecurrencePresetChange("YEARLY_ON_DATE")
                      }
                      disabled={!startDate}
                    >
                      {startDate &&
                        `Jährlich am ${startDate.getDate()}. ${new Date(
                          startDate
                        ).toLocaleDateString("de-DE", { month: "long" })}`}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      onClick={() => handleRecurrencePresetChange("CUSTOM")}
                    >
                      Benutzerdefiniert...
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

                {recurrenceObj?.summary && (
                  <div className="mt-2 text-muted small">
                    {recurrenceObj.summary}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={() => {
                    setShowFormModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Speichern...
                    </>
                  ) : (
                    "Speichern"
                  )}
                </Button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>

      {/* Custom Repeat Modal */}
      <Modal
        show={showCustomRepeatModal}
        onHide={handleCustomModalClose}
        size="lg"
        centered
        backdrop="static" // Prevent closing by clicking outside
      >
        <Modal.Header closeButton>
          <Modal.Title>Benutzerdefinierte Wiederholung</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCustomRepeatSubmit}>
            {/* Repeat Every */}
            <div className="form-group mb-3">
              <label className="form-label">Wiederhole alle</label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="number"
                  min="1"
                  value={repeatEvery}
                  onChange={(e) =>
                    setRepeatEvery(parseInt(e.target.value) || 1)
                  }
                  className="me-2"
                  style={{ width: "80px" }}
                />
                <Form.Select
                  value={repeatUnit}
                  onChange={(e) => setRepeatUnit(e.target.value)}
                >
                  <option value="day">Tage</option>
                  <option value="week">Wochen</option>
                  <option value="month">Monate</option>
                  <option value="year">Jahre</option>
                </Form.Select>
              </div>
            </div>

            {/* Weekday Selection (for weekly) */}
            {repeatUnit === "week" && (
              <div className="form-group mb-3">
                <label className="form-label">An folgenden Tagen:</label>
                <div className="days-selection-container">
                  {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((day) => {
                    const dayLabels = {
                      MO: "Mo",
                      TU: "Di",
                      WE: "Mi",
                      TH: "Do",
                      FR: "Fr",
                      SA: "Sa",
                      SU: "So",
                    };
                    return (
                      <Button
                        key={day}
                        variant={
                          selectedDays.includes(day)
                            ? "primary"
                            : "outline-primary"
                        }
                        onClick={() => toggleDay(day)}
                        className="day-button"
                        type="button"
                      >
                        {dayLabels[day]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* End Condition */}
            <div className="form-group mb-3">
              <label className="form-label">Ende der Wiederholung</label>
              <div>
                <Form.Check
                  type="radio"
                  id="endNever"
                  name="endOption"
                  label="Nie"
                  checked={endOption === "never"}
                  onChange={() => setEndOption("never")}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="endOn"
                  name="endOption"
                  label="Am"
                  checked={endOption === "on"}
                  onChange={() => setEndOption("on")}
                  className="mb-2"
                />
                {endOption === "on" && (
                  <DatePicker
                    selected={endDateCustom ? new Date(endDateCustom) : null}
                    onChange={(date) => setEndDateCustom(dateToYMD(date))}
                    minDate={repeatDate}
                    dateFormat="dd.MM.yyyy"
                    className="form-control ms-4 mt-1"
                    placeholderText="Enddatum auswählen"
                  />
                )}
                <Form.Check
                  type="radio"
                  id="endAfter"
                  name="endOption"
                  label="Nach"
                  checked={endOption === "after"}
                  onChange={() => setEndOption("after")}
                  className="mb-2"
                />
                {endOption === "after" && (
                  <div className="d-flex align-items-center ms-4 mt-1">
                    <Form.Control
                      type="number"
                      min="1"
                      value={occurrences}
                      onChange={(e) =>
                        setOccurrences(parseInt(e.target.value) || 1)
                      }
                      className="me-2"
                      style={{ width: "80px" }}
                    />
                    <span>Ereignissen</span>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  setShowCustomRepeatModal(false);
                  resetCustomRepeatForm();
                }}
              >
                Abbrechen
              </Button>
              <Button variant="primary" type="submit">
                Speichern
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
          }
        }}
        centered
        backdrop={isDeleting ? "static" : true}
        keyboard={!isDeleting}
      >
        <Modal.Header closeButton={!isDeleting}>
          <Modal.Title>
            {selectedUnavailability?.isRecurring
              ? deleteOption === "this"
                ? "Nur diesen Termin löschen"
                : deleteOption === "following"
                ? "Diesen und alle folgenden Termine löschen"
                : "Alle Termine löschen"
              : "Sperrtermin löschen"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isDeleting ? (
            <div className="text-center py-3">
              <Spinner animation="border" role="status" className="me-2" />
              Termin wird gelöscht...
            </div>
          ) : (
            <p>
              {selectedUnavailability?.isRecurring
                ? deleteOption === "this"
                  ? "Möchten Sie wirklich nur diesen einzelnen Termin aus der Serie löschen?"
                  : deleteOption === "following"
                  ? "Möchten Sie wirklich diesen und alle folgenden Termine aus der Serie löschen?"
                  : "Möchten Sie wirklich alle Termine in dieser Serie löschen?"
                : "Möchten Sie diesen Sperrtermin wirklich löschen?"}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Abbrechen
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Löschen...
              </>
            ) : (
              "Löschen"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <DeleteOptionsModal />
    </DashboardLayout>
  );
};

export default UnavailabilityDashboard;
