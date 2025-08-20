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

const buildEventPayload = (form) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    title: form.title || "Sperrtermin",
    calendarName: "Sperrtermine",
    allDay: true,
    timezone: timezone,
    startDate: dateToYMD(form.startDate),
    endDate: dateToYMD(form.endDate),
    recurrence: form.recurrence,
  };
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

  // Busy artist state
  const [selectedMonth, setSelectedMonth] = useState("");
  const [busySelectedDays, setBusySelectedDays] = useState([]);
  const [isBusySubmitting, setIsBusySubmitting] = useState(false);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // Add these state variables

  // Add to resetForm function

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
        // Handle both single and recurring events
        const startDate = event.start.date || event.start.dateTime;
        const endDate = event.end.date || event.end.dateTime;

        const berlinStart = new Date(startDate);
        const berlinEnd = new Date(endDate);

        // For all-day events, adjust end date
        if (event.start.date) {
          berlinEnd.setDate(berlinEnd.getDate() - 1);
        }

        return {
          id: event.id,
          startDate: berlinStart.toISOString().split("T")[0],
          endDate: berlinEnd.toISOString().split("T")[0],
          details: event.description || "Nicht verfügbar",
          uid: event.extendedProperties?.private?.uid || event.id || "",
          htmlLink: event.htmlLink || "",
          isRecurring: event.isRecurring || false,
          recurrenceSummary: event.recurrenceSummary || "",
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

  const formatDateNoTZ = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleRecurrencePresetChange = (preset) => {
    setRecurrencePreset(preset);

    if (preset === "CUSTOM") {
      setShowCustomRepeatModal(true);
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
    setShowCustomRepeatModal(false);
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
          veryBusy: false,
          reason: "Nicht verfügbar",
          details: "Nicht verfügbar",
          recurrence: recurrenceObj, // Add recurrence object
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

  const handleBusyArtistSubmit = async (e) => {
    e.preventDefault();
    setIsBusySubmitting(true);

    if (!selectedMonth || busySelectedDays.length === 0) {
      toast.error(
        "Bitte wählen Sie einen Monat und mindestens einen Wochentag aus."
      );
      setIsBusySubmitting(false);
      return;
    }

    try {
      const calendarNames = "Sperrtermine"; // Only use Sperrtermine calendar

      // Get current year
      const currentYear = new Date().getFullYear();
      // Get month index (0-11)
      const monthIndex =
        monthsFromCurrent.indexOf(selectedMonth) + currentMonthIndex;

      // Get current date
      const today = new Date();

      // Create start date - if current month, use today's date, otherwise first of month
      const startDate =
        monthIndex === today.getMonth()
          ? new Date(today)
          : new Date(currentYear, monthIndex, 1);

      // Create end date (last day of month)
      const endDate = new Date(currentYear, monthIndex + 1, 0);

      // Format dates
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
          reason: "Ausgebucht",
          veryBusy: true,
          details: `Ausgebucht an folgenden Wochentagen: ${busySelectedDays.join(
            ", "
          )}`,
          daysOfWeek: busySelectedDays,
        },
      };
      console.log("Unavailability data to submit:", unavailabilityData);

      // await axios.post(
      //   `${UNAVAILABLE_API_URL}/busy-unavailabilities`,
      //   unavailabilityData
      // );

      toast.success("Ausbuchung erfolgreich hinzugefügt");
      setShowBusyArtistModal(false);
      setSelectedMonth("");
      setBusySelectedDays([]);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Fehler beim Speichern der Ausbuchung");
    } finally {
      setIsBusySubmitting(false);
    }
  };

  const toggleBusyDaySelection = (dayId) => {
    setBusySelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const resetForm = () => {
    setStartDate(null);
    setEndDate(null);
    setSubmitSuccess(false);
    setRecurrencePreset("NONE");
    setRecurrenceObj(null);
    setRecurrenceEndChoice({ kind: "never" });
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUnavailability || !selectedUnavailability.uid) {
      toast.error("Ungültiger Sperrtermin ausgewählt");
      return;
    }

    setIsDeleting(true);
    try {
      const calendarNames = ["Sperrtermine"]; // Only use Sperrtermine calendar

      const deletePayload = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: calendarNames,
        },
        uid: selectedUnavailability.uid,
      };

      await axios.delete(`${UNAVAILABLE_API_URL}/unavailabilities`, {
        data: deletePayload,
      });

      toast.success("Sperrtermin erfolgreich gelöscht");
      setShowDeleteModal(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Europe/Berlin",
    });
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
                                  <td className="event-time"></td>
                                  <td className="event-time">
                                    {formatDate(unavailability.startDate)}-
                                    {formatDate(unavailability.endDate)}
                                  </td>
                                  <td>
                                    {console.log(unavailability)}
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
                                      onClick={() => {
                                        setSelectedUnavailability(
                                          unavailability
                                        );
                                        setShowDeleteModal(true);
                                      }}
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

                      <div className="event-cards-container d-md-none">
                        {filteredUnavailabilities.map(
                          (unavailability, index) => (
                            <div key={index} className="event-mobile-card">
                              <div className="event-mobile-header">
                                <div className="event-mobile-title">
                                  {formatDate(unavailability.startDate)} -{" "}
                                  {formatDate(unavailability.endDate)}
                                </div>
                              </div>
                              <div className="event-mobile-content">
                                <div className="event-mobile-reason">
                                  <Badge
                                    bg="light"
                                    text="dark"
                                    className="role-badge"
                                  >
                                    {getReasonIcon()}
                                    <span className="ms-2">
                                      {unavailability.details}
                                    </span>
                                  </Badge>
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
                                      console.log(unavailability.htmlLink);
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
                                    onClick={() => {
                                      setSelectedUnavailability(unavailability);
                                      setShowDeleteModal(true);
                                    }}
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
        show={showFormModal}
        onHide={() => {
          if (!isSubmitting) {
            setShowFormModal(false);
            resetForm();
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

              {/* Recurrence Dropdown */}
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
        onHide={() => {
          setShowCustomRepeatModal(false);
          resetCustomRepeatForm();
        }}
        size="lg"
        centered
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
          <Modal.Title>Delete Unavailability</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isDeleting ? (
            <div className="text-center py-3">
              <Spinner animation="border" role="status" className="me-2" />
              Deleting event...
            </div>
          ) : (
            <p>Are you sure you want to delete this unavailability?</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default UnavailabilityDashboard;
