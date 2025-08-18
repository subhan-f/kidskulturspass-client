// import React, { useEffect, useState, useCallback, useMemo } from "react";
// import { toast } from "react-toastify";
// import {
//   Table,
//   Button,
//   Modal,
//   Badge,
//   Spinner,
//   Alert,
//   Form,
//   Dropdown,
// } from "react-bootstrap";
// import {
//   ChevronDown,
//   ChevronUp,
//   X,
//   CalendarEvent,
//   ExclamationCircle,
//   Plus,
//   Check,
//   Clock,
//   ArrowRepeat,
// } from "react-bootstrap-icons";
// import DashboardLayout from "../components/DashboardLayout";
// import SearchBox from "../components/SearchBox";
// import { useMediaQuery } from "react-responsive";
// import DashboardLoader from "../components/DashboardLoader";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import axios from "axios";
// import { authApi } from "../utils/api";

// const UnavailabilityDashboard = ({ setAuth, handleLogout }) => {
//   const [unavailabilities, setUnavailabilities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showFormModal, setShowFormModal] = useState(false);
//   const [showBusyArtistModal, setShowBusyArtistModal] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitSuccess, setSubmitSuccess] = useState(false);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [selectedUnavailability, setSelectedUnavailability] = useState(null);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [expanded, setExpanded] = useState(true);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [joinedCalendars, setJoinedCalendars] = useState([]);
//   const [showRepeatModal, setShowRepeatModal] = useState(false);
//   const [repeatType, setRepeatType] = useState(null);
//   const [repeatDate, setRepeatDate] = useState(null);
//   const [showRepeatConfirmation, setShowRepeatConfirmation] = useState(false);
//   const [showCustomRepeatModal, setShowCustomRepeatModal] = useState(false);
//   const [repeatEvery, setRepeatEvery] = useState(1);
//   const [repeatUnit, setRepeatUnit] = useState("week");
//   const [endOption, setEndOption] = useState("never");
//   const [endDateCustom, setEndDateCustom] = useState("");
//   const [occurrences, setOccurrences] = useState(5);
//   const [selectedDays, setSelectedDays] = useState([]);

//   // Busy artist state
//   const [selectedMonth, setSelectedMonth] = useState("");
//   const [isBusySubmitting, setIsBusySubmitting] = useState(false);

//   const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

//   const USER_API_URL =
//     "https://artist-crud-function-754826373806.europe-west10.run.app";
//   const UNAVAILABLE_API_URL =
//     "https://unavailable-events-754826373806.europe-west1.run.app";

//   const currentMonthIndex = new Date().getMonth();
//   const currentMonthName = [
//     "Januar",
//     "Februar",
//     "März",
//     "April",
//     "Mai",
//     "Juni",
//     "Juli",
//     "August",
//     "September",
//     "Oktober",
//     "November",
//     "Dezember",
//   ][currentMonthIndex];

//   const monthsFromCurrent = [
//     "Januar",
//     "Februar",
//     "März",
//     "April",
//     "Mai",
//     "Juni",
//     "Juli",
//     "August",
//     "September",
//     "Oktober",
//     "November",
//     "Dezember",
//   ].slice(currentMonthIndex);

//   const daysOfWeek = [
//     { id: "monday", label: "Montag" },
//     { id: "tuesday", label: "Dienstag" },
//     { id: "wednesday", label: "Mittwoch" },
//     { id: "thursday", label: "Donnerstag" },
//     { id: "friday", label: "Freitag" },
//     { id: "saturday", label: "Samstag" },
//     { id: "sunday", label: "Sonntag" },
//   ];

//   const days = [
//     { value: "MO", label: "Montag" },
//     { value: "TU", label: "Dienstag" },
//     { value: "WE", label: "Mittwoch" },
//     { value: "TH", label: "Donnerstag" },
//     { value: "FR", label: "Freitag" },
//     { value: "SA", label: "Samstag" },
//     { value: "SU", label: "Sonntag" },
//   ];

//   const toBerlinTime = (date) => {
//     return new Date(
//       date.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
//     );
//   };

//   const fetchUnavailabilities = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const userRes = await authApi.getMe();
//       setCurrentUser(userRes.data.user);

//       const userDataRes = await axios.get(
//         `${USER_API_URL}/?id=${userRes.data.user._id}`
//       );
//       const userFromApi = userDataRes.data;

//       const calendarName = "Sperrtermine";
//       setJoinedCalendars([{ Calendar: calendarName }]);

//       const payload = {
//         user: {
//           name: userFromApi.Name,
//           email: userFromApi["E-Mail"],
//           calendars: calendarName,
//         },
//       };
//       console.log("Fetching unavailabilities with payload:", payload);

//       const unavailabilityRes = await axios.post(
//         `${UNAVAILABLE_API_URL}/getUnavailabilities`,
//         payload
//       );
//       console.log("Unavailability data fetched:", unavailabilityRes.data);

//       const fetched = (unavailabilityRes.data || []).map((event) => {
//         const berlinStart = new Date(event.start.dateTime || event.start.date);
//         const berlinEnd = new Date(event.end.dateTime || event.end.date);
//         berlinEnd.setDate(berlinEnd.getDate() - 1);

//         return {
//           id:
//             event.id ||
//             event.iCalUID ||
//             event.uid ||
//             `${berlinStart.getTime()}-${Math.random()}`,
//           startDate: berlinStart.toISOString().split("T")[0],
//           endDate: berlinEnd.toISOString().split("T")[0],
//           details: "Nicht verfügbar",
//           uid: event.extendedProperties?.private?.uid || event.id || "",
//           htmlLink: event.htmlLink || "",
//         };
//       });

//       setUnavailabilities(fetched);
//     } catch (err) {
//       console.error("Error loading data:", err);
//       setError(
//         "Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut."
//       );
//       toast.error("Fehler beim Laden der Sperrtermine");
//       setUnavailabilities([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUnavailabilities();
//   }, [fetchUnavailabilities]);

//   const filteredUnavailabilities = useMemo(() => {
//     if (!searchTerm.trim()) return unavailabilities;

//     const searchLower = searchTerm.toLowerCase();
//     return unavailabilities.filter((unavailability) => {
//       const startDateText = new Date(unavailability.startDate)
//         .toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })
//         .toLowerCase();
//       const endDateText = new Date(unavailability.endDate)
//         .toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })
//         .toLowerCase();
//       return (
//         startDateText.includes(searchLower) || endDateText.includes(searchLower)
//       );
//     });
//   }, [unavailabilities, searchTerm]);

//   const formatDateNoTZ = (date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     if (!startDate || !endDate || startDate > endDate) {
//       toast.error("Bitte wählen Sie einen gültigen Datumsbereich.");
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       const calendarNames = "Sperrtermine";

//       const formattedStart = formatDateNoTZ(startDate);
//       const formattedEnd = formatDateNoTZ(endDate);

//       const unavailabilityData = {
//         user: {
//           name: currentUser.Name,
//           email: currentUser["E-Mail"],
//           calendars: calendarNames,
//         },
//         unavailability: {
//           startDate: formattedStart,
//           endDate: formattedEnd,
//           veryBusy: false,
//           reason: "Nicht verfügbar",
//           details: "Nicht verfügbar",
//         },
//       };
//       console.log("Unavailability data to submit:", unavailabilityData);

//       await axios.post(
//         `${UNAVAILABLE_API_URL}/unavailabilities`,
//         unavailabilityData
//       );

//       toast.success("Sperrtermin erfolgreich hinzugefügt");

//       setTimeout(() => {
//         setShowFormModal(false);
//         resetForm();
//         fetchUnavailabilities();
//       }, 1000);
//     } catch (error) {
//       console.error("Submission error:", error);
//       toast.error("Fehler beim Speichern des Sperrtermins");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleRepeatSubmit = async () => {
//     if (!repeatDate) {
//       toast.error("Bitte wählen Sie ein gültiges Datum.");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const calendarNames = "Sperrtermine";
//       const formattedDate = formatDateNoTZ(repeatDate);

//       const unavailabilityData = {
//         user: {
//           name: currentUser.Name,
//           email: currentUser["E-Mail"],
//           calendars: calendarNames,
//         },
//         unavailability: {
//           startDate: formattedDate,
//           endDate: formattedDate,
//           veryBusy: false,
//           reason: "Nicht verfügbar",
//           details: "Nicht verfügbar",
//           repeat: repeatType,
//         },
//       };
//       console.log("Repeating unavailability data:", unavailabilityData);

//       await axios.post(
//         `${UNAVAILABLE_API_URL}/repeating-unavailabilities`,
//         unavailabilityData
//       );

//       toast.success(`Wiederholender Sperrtermin (${getRepeatLabel(repeatType)}) erfolgreich hinzugefügt`);
//       setShowRepeatConfirmation(false);
//       setShowRepeatModal(false);
//       fetchUnavailabilities();
//     } catch (error) {
//       console.error("Error creating repeating unavailability:", error);
//       toast.error("Fehler beim Erstellen des wiederholenden Sperrtermins");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

// const handleCustomRepeatSubmit = async () => {
//   if (!repeatDate) {
//     toast.error("Bitte wählen Sie ein gültiges Startdatum.");
//     return;
//   }

//   setIsSubmitting(true);

//   try {
//     const calendarNames = "Sperrtermine";
//     const formattedDate = formatDateNoTZ(repeatDate);

//     // Prepare recurrence rules based on custom settings
//     let rrule = `FREQ=${repeatUnit === 'week' ? 'WEEKLY' : repeatUnit.toUpperCase()}`;
//     rrule += `;INTERVAL=${repeatEvery}`;

//     if (repeatUnit === "week" && selectedDays.length > 0) {
//       rrule += `;BYDAY=${selectedDays.join(",")}`;
//     }

//     if (endOption === "on" && endDateCustom) {
//       rrule += `;UNTIL=${new Date(endDateCustom).toISOString().split('T')[0].replace(/-/g, '')}`;
//     } else if (endOption === "after") {
//       rrule += `;COUNT=${occurrences}`;
//     }

//     const unavailabilityData = {
//       user: {
//         name: currentUser.Name,
//         email: currentUser["E-Mail"],
//         calendars: calendarNames,
//       },
//       unavailability: {
//         startDate: formattedDate,
//         endDate: formattedDate,
//         veryBusy: false,
//         reason: "Nicht verfügbar",
//         details: "Nicht verfügbar",
//         repeat: "custom",
//         rrule: `RRULE:${rrule}`,
//       },
//     };
//     console.log("Custom repeating unavailability data:", unavailabilityData);

//     await axios.post(
//       `${UNAVAILABLE_API_URL}/repeating-unavailabilities`,
//       unavailabilityData
//     );

//     toast.success("Benutzerdefinierter wiederholender Sperrtermin erfolgreich hinzugefügt");
//     setShowCustomRepeatModal(false);
//     resetCustomRepeatForm();
//     fetchUnavailabilities();
//   } catch (error) {
//     console.error("Error creating custom repeating unavailability:", error);
//     toast.error("Fehler beim Erstellen des benutzerdefinierten wiederholenden Sperrtermins");
//   } finally {
//     setIsSubmitting(false);
//   }
// };

//   const getRepeatLabel = (type) => {
//     switch (type) {
//       case 'weekly':
//         return 'Wöchentlich';
//       case 'monthly':
//         return 'Monatlich';
//       case 'annually':
//         return 'Jährlich';
//       case 'custom':
//         return 'Benutzerdefiniert';
//       default:
//         return '';
//     }
//   };

//   const handleBusyArtistSubmit = async (e) => {
//     e.preventDefault();
//     setIsBusySubmitting(true);

//     if (!selectedMonth || selectedDays.length === 0) {
//       toast.error(
//         "Bitte wählen Sie einen Monat und mindestens einen Wochentag aus."
//       );
//       setIsBusySubmitting(false);
//       return;
//     }

//     try {
//       const calendarNames = "Sperrtermine";

//       const currentYear = new Date().getFullYear();
//       const monthIndex =
//         monthsFromCurrent.indexOf(selectedMonth) + currentMonthIndex;

//       const today = new Date();
//       const startDate =
//         monthIndex === today.getMonth()
//           ? new Date(today)
//           : new Date(currentYear, monthIndex, 1);
//       const endDate = new Date(currentYear, monthIndex + 1, 0);

//       const formattedStart = formatDateNoTZ(startDate);
//       const formattedEnd = formatDateNoTZ(endDate);

//       const unavailabilityData = {
//         user: {
//           name: currentUser.Name,
//           email: currentUser["E-Mail"],
//           calendars: calendarNames,
//         },
//         unavailability: {
//           startDate: formattedStart,
//           endDate: formattedEnd,
//           reason: "Ausgebucht",
//           veryBusy: true,
//           details: `Ausgebucht an folgenden Wochentagen: ${selectedDays.join(
//             ", "
//           )}`,
//           daysOfWeek: selectedDays,
//         },
//       };
//       console.log("Unavailability data to submit:", unavailabilityData);

//       await axios.post(
//         `${UNAVAILABLE_API_URL}/busy-unavailabilities`,
//         unavailabilityData
//       ); 

//       toast.success("Ausbuchung erfolgreich hinzugefügt");
//       setShowBusyArtistModal(false);
//       setSelectedMonth("");
//       setSelectedDays([]);
//       fetchUnavailabilities();
//     } catch (error) {
//       console.error("Submission error:", error);
//       toast.error("Fehler beim Speichern der Ausbuchung");
//     } finally {
//       setIsBusySubmitting(false);
//     }
//   };

//   const toggleDaySelection = (dayId) => {
//     setSelectedDays((prev) =>
//       prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
//     );
//   };

//   const toggleDay = (dayValue) => {
//     setSelectedDays((prev) =>
//       prev.includes(dayValue)
//         ? prev.filter((d) => d !== dayValue)
//         : [...prev, dayValue]
//     );
//   };

//   const resetForm = () => {
//     setStartDate(null);
//     setEndDate(null);
//     setSubmitSuccess(false);
//     setRepeatDate(null);
//     setRepeatType(null);
//   };

//   const resetCustomRepeatForm = () => {
//     setRepeatDate(null);
//     setRepeatEvery(1);
//     setRepeatUnit("week");
//     setEndOption("never");
//     setEndDateCustom("");
//     setOccurrences(5);
//     setSelectedDays([]);
//   };

//   const handleDeleteConfirm = async () => {
//     if (!selectedUnavailability || !selectedUnavailability.uid) {
//       toast.error("Ungültiger Sperrtermin ausgewählt");
//       return;
//     }

//     setIsDeleting(true);
//     try {
//       const calendarNames = "Sperrtermine";

//       const deletePayload = {
//         user: {
//           name: currentUser.Name,
//           email: currentUser["E-Mail"],
//           calendars: calendarNames,
//         },
//         uid: selectedUnavailability.uid,
//       };

//       await axios.delete(`${UNAVAILABLE_API_URL}/unavailabilities`, {
//         data: deletePayload,
//       });

//       toast.success("Sperrtermin erfolgreich gelöscht");
//       setShowDeleteModal(false);
//       fetchUnavailabilities();
//     } catch (error) {
//       console.error("Delete error:", error);
//       toast.error("Fehler beim Löschen des Sperrtermins");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const getReasonIcon = () => {
//     return <ExclamationCircle className="reason-icon" />;
//   };

//   const toggleExpand = () => {
//     setExpanded(!expanded);
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("de-DE", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//       timeZone: "Europe/Berlin",
//     });
//   };

//   const handleRepeatOptionSelect = (type) => {
//     if (type === 'none') {
//       resetForm();
//       setShowFormModal(true);
//     } else if (type === 'custom') {
//       resetCustomRepeatForm();
//       setShowCustomRepeatModal(true);
//     } else {
//       setRepeatType(type);
//       setShowRepeatModal(true);
//     }
//   };

//   return (
//     <DashboardLayout
//       setAuth={setAuth}
//       onRefresh={fetchUnavailabilities}
//       handleLogout={handleLogout}
//     >
//       <div className="unavailability-dashboard">
//         {!loading && (
//           <div className="transparent-header-container">
//             <h1 className="dashboard-main-title">Sperrtermine</h1>
//             <div className="header-search-box">
//               <SearchBox
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Nach Datum suchen..."
//               />
//             </div>
//           </div>
//         )}

//         {error && (
//           <Alert variant="danger" className="dashboard-alert">
//             {error}
//           </Alert>
//         )}

//         <div className="d-flex justify-content-end mb-3 gap-2">
//           <Dropdown>
//             <Dropdown.Toggle variant="primary" className="add-unavailability-btn">
//               <Plus className="me-2" />
//               Sperrtermin hinzufügen
//             </Dropdown.Toggle>

//             <Dropdown.Menu>
//               <Dropdown.Item onClick={() => handleRepeatOptionSelect('none')}>
//                 Nicht wiederholen
//               </Dropdown.Item>
//               <Dropdown.Item disabled>Täglich</Dropdown.Item>
//               <Dropdown.Item onClick={() => handleRepeatOptionSelect('weekly')}>
//                 Wöchentlich
//               </Dropdown.Item>
//               <Dropdown.Item onClick={() => handleRepeatOptionSelect('monthly')}>
//                 Monatlich
//               </Dropdown.Item>
//               <Dropdown.Item onClick={() => handleRepeatOptionSelect('annually')}>
//                 Jährlich
//               </Dropdown.Item>
//               <Dropdown.Item onClick={() => handleRepeatOptionSelect('custom')}>
//                 Benutzerdefiniert
//               </Dropdown.Item>
//             </Dropdown.Menu>
//           </Dropdown>

//           <Button
//             variant="warning"
//             onClick={() => setShowBusyArtistModal(true)}
//             className="add-busy-btn"
//           >
//             <Clock className="me-2" />
//             Ausgebucht eintragen
//           </Button>
//         </div>

//         <div className="events-container">
//           {loading ? (
//             <DashboardLoader message="Lade Sperrtermine..." />
//           ) : (
//             <div className="event-calendar-card">
//               <div className="calendar-header" onClick={toggleExpand}>
//                 <div className="header-content">
//                   <div className="title-with-icon">
//                     <h5 className="calendar-title">Meine Sperrtermine</h5>
//                     <div className="dropdown-toggle-icon">
//                       {expanded ? (
//                         <ChevronUp size={14} />
//                       ) : (
//                         <ChevronDown size={14} />
//                       )}
//                     </div>
//                     <Badge
//                       bg="primary"
//                       className="enhanced-badge capsule-badge"
//                     >
//                       Gesamt{" "}
//                       <span className="badge-count">
//                         {filteredUnavailabilities.length}
//                       </span>
//                     </Badge>
//                   </div>
//                   <span className="events-count">
//                     <span className="count-number">
//                       {filteredUnavailabilities.length}
//                     </span>
//                     <span className="count-label">
//                       {filteredUnavailabilities.length === 1
//                         ? " Eintrag"
//                         : " Einträge"}
//                     </span>
//                   </span>
//                 </div>
//               </div>

//               {expanded && (
//                 <div className="calendar-content">
//                   {filteredUnavailabilities.length === 0 ? (
//                     <div className="empty-state">
//                       <div className="empty-state-icon">
//                         <CalendarEvent size={48} />
//                       </div>
//                       <h4>
//                         {searchTerm
//                           ? "Keine passenden Sperrtermine gefunden"
//                           : "Keine Sperrtermine eingetragen"}
//                       </h4>
//                       <p>
//                         {searchTerm
//                           ? "Versuchen Sie einen anderen Suchbegriff"
//                           : "Klicken Sie oben auf den Button, um einen Sperrtermin hinzuzufügen"}
//                       </p>
//                     </div>
//                   ) : (
//                     <>
//                       <div className="table-responsive d-none d-md-block">
//                         <Table className="events-table">
//                           <thead>
//                             <tr>
//                               <th>Von (Berliner Zeit)</th>
//                               <th>Bis (Berliner Zeit)</th>
//                               <th>Grund</th>
//                               <th>Aktionen</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {filteredUnavailabilities.map(
//                               (unavailability, index) => (
//                                 <tr key={index} className="event-row">
//                                   <td className="event-time"></td>
//                                   <td className="event-time">
//                                     {formatDate(unavailability.startDate)}-
//                                     {formatDate(unavailability.endDate)}
//                                   </td>
//                                   <td>
//                                     <Button
//                                       variant="outline-info"
//                                       size="sm"
//                                       className="me-2"
//                                       onClick={() => {
//                                         if (unavailability.htmlLink) {
//                                           window.open(
//                                             `${unavailability.htmlLink}`,
//                                             "_blank"
//                                           );
//                                         } else {
//                                           toast.error(
//                                             "Kein Kalenderlink für dieses Ereignis verfügbar"
//                                           );
//                                         }
//                                       }}
//                                     >
//                                       Details
//                                     </Button>

//                                     <Button
//                                       variant="outline-danger"
//                                       size="sm"
//                                       onClick={() => {
//                                         setSelectedUnavailability(
//                                           unavailability
//                                         );
//                                         setShowDeleteModal(true);
//                                       }}
//                                       className="delete-btn"
//                                     >
//                                       <X className="me-1" />
//                                       <span className="d-none d-md-inline">
//                                         Löschen
//                                       </span>
//                                     </Button>
//                                   </td>
//                                 </tr>
//                               )
//                             )}
//                           </tbody>
//                         </Table>
//                       </div>

//                       <div className="event-cards-container d-md-none">
//                         {filteredUnavailabilities.map(
//                           (unavailability, index) => (
//                             <div key={index} className="event-mobile-card">
//                               <div className="event-mobile-header">
//                                 <div className="event-mobile-title">
//                                   {formatDate(unavailability.startDate)} -{" "}
//                                   {formatDate(unavailability.endDate)}
//                                 </div>
//                               </div>
//                               <div className="event-mobile-content">
//                                 <div className="event-mobile-reason">
//                                   <Badge
//                                     bg="light"
//                                     text="dark"
//                                     className="role-badge"
//                                   >
//                                     {getReasonIcon()}
//                                     <span className="ms-2">
//                                       {unavailability.details}
//                                     </span>
//                                   </Badge>
//                                 </div>
//                                 <div className="event-mobile-actions">
//                                   <Button
//                                     variant="outline-info"
//                                     size="sm"
//                                     className="me-2"
//                                     onClick={() => {
//                                       console.log(unavailability.htmlLink);
//                                       if (unavailability.htmlLink) {
//                                         window.open(
//                                           `${unavailability.htmlLink}`,
//                                           "_blank"
//                                         );
//                                       } else {
//                                         toast.error(
//                                           "Kein Kalenderlink für dieses Ereignis verfügbar"
//                                         );
//                                       }
//                                     }}
//                                   >
//                                     Details
//                                   </Button>

//                                   <Button
//                                     variant="outline-danger"
//                                     size="sm"
//                                     onClick={() => {
//                                       setSelectedUnavailability(unavailability);
//                                       setShowDeleteModal(true);
//                                     }}
//                                     className="delete-btn"
//                                   >
//                                     <X className="me-1" />
//                                     Löschen
//                                   </Button>
//                                 </div>
//                               </div>
//                             </div>
//                           )
//                         )}
//                       </div>
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Add Modal */}
//       <Modal
//         show={showFormModal}
//         onHide={() => {
//           if (!isSubmitting) {
//             setShowFormModal(false);
//             resetForm();
//           }
//         }}
//         size="lg"
//         centered
//         backdrop={isSubmitting ? "static" : true}
//         keyboard={!isSubmitting}
//       >
//         <Modal.Header closeButton={!isSubmitting}>
//           <Modal.Title>Sperrtermin eintragen</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {submitSuccess ? (
//             <div className="text-center p-4">
//               <div className="text-success mb-3">
//                 <Check size={48} />
//               </div>
//               <h4>Sperrtermin erfolgreich gespeichert!</h4>
//               <p>Die Liste wird automatisch aktualisiert...</p>
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit}>
//               {/* Start Date */}
//               <div className="form-group mb-3">
//                 <label className="form-label">Von (Startdatum)</label>
//                 <div className="input-group">
//                   <span className="input-group-text">
//                     <CalendarEvent />
//                   </span>
//                   <DatePicker
//                     selected={startDate}
//                     onChange={(date) => {
//                       setStartDate(date);
//                       setEndDate(null);
//                     }}
//                     selectsStart
//                     startDate={startDate}
//                     endDate={endDate}
//                     minDate={new Date()}
//                     dateFormat="dd.MM.yyyy"
//                     className="form-control"
//                     placeholderText="Startdatum auswählen"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* End Date */}
//               <div className="form-group mb-3">
//                 <label className="form-label">Bis (Enddatum)</label>
//                 <div className="input-group">
//                   <span className="input-group-text">
//                     <CalendarEvent />
//                   </span>
//                   <DatePicker
//                     selected={endDate}
//                     onChange={(date) => setEndDate(date)}
//                     selectsEnd
//                     startDate={startDate}
//                     endDate={endDate}
//                     minDate={startDate}
//                     disabled={!startDate}
//                     dateFormat="dd.MM.yyyy"
//                     className="form-control"
//                     placeholderText={
//                       startDate
//                         ? "Enddatum auswählen"
//                         : "Bitte zuerst Startdatum wählen"
//                     }
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Buttons */}
//               <div className="d-flex justify-content-end">
//                 <Button
//                   variant="secondary"
//                   className="me-2"
//                   onClick={() => {
//                     setShowFormModal(false);
//                     resetForm();
//                   }}
//                   disabled={isSubmitting}
//                 >
//                   Abbrechen
//                 </Button>
//                 <Button variant="primary" type="submit" disabled={isSubmitting}>
//                   {isSubmitting ? (
//                     <>
//                       <Spinner
//                         as="span"
//                         animation="border"
//                         size="sm"
//                         role="status"
//                         aria-hidden="true"
//                         className="me-2"
//                       />
//                       Speichern...
//                     </>
//                   ) : (
//                     "Speichern"
//                   )}
//                 </Button>
//               </div>
//             </form>
//           )}
//         </Modal.Body>
//       </Modal>

//       {/* Repeat Modal */}
//       <Modal
//         show={showRepeatModal}
//         onHide={() => {
//           if (!isSubmitting) {
//             setShowRepeatModal(false);
//             resetForm();
//           }
//         }}
//         size="lg"
//         centered
//         backdrop={isSubmitting ? "static" : true}
//         keyboard={!isSubmitting}
//       >
//         <Modal.Header closeButton={!isSubmitting}>
//           <Modal.Title>
//             {getRepeatLabel(repeatType)} Sperrtermin eintragen
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <form>
//             <div className="form-group mb-3">
//               <label className="form-label">Datum auswählen</label>
//               <div className="input-group">
//                 <span className="input-group-text">
//                   <CalendarEvent />
//                 </span>
//                 <DatePicker
//                   selected={repeatDate}
//                   onChange={(date) => setRepeatDate(date)}
//                   minDate={new Date()}
//                   dateFormat="dd.MM.yyyy"
//                   className="form-control"
//                   placeholderText="Datum auswählen"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="d-flex justify-content-end">
//               <Button
//                 variant="secondary"
//                 className="me-2"
//                 onClick={() => {
//                   setShowRepeatModal(false);
//                   resetForm();
//                 }}
//                 disabled={isSubmitting}
//               >
//                 Abbrechen
//               </Button>
//               <Button
//                 variant="primary"
//                 onClick={() => setShowRepeatConfirmation(true)}
//                 disabled={!repeatDate || isSubmitting}
//               >
//                 Weiter
//               </Button>
//             </div>
//           </form>
//         </Modal.Body>
//       </Modal>

//       {/* Repeat Confirmation Modal */}
//       <Modal
//         show={showRepeatConfirmation}
//         onHide={() => {
//           if (!isSubmitting) {
//             setShowRepeatConfirmation(false);
//           }
//         }}
//         centered
//         backdrop={isSubmitting ? "static" : true}
//         keyboard={!isSubmitting}
//       >
//         <Modal.Header closeButton={!isSubmitting}>
//           <Modal.Title>Bestätigung</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <p>
//             Möchten Sie wirklich einen {getRepeatLabel(repeatType)} wiederholenden Sperrtermin für den{" "}
//             {repeatDate?.toLocaleDateString("de-DE", {
//               day: "2-digit",
//               month: "long",
//               year: "numeric",
//             })} erstellen?
//           </p>
//           <p className="text-muted small">
//             Dieser Termin wird {repeatType === 'weekly' ? 'wöchentlich' : 
//                              repeatType === 'monthly' ? 'monatlich' : 
//                              'jährlich'} wiederholt.
//           </p>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="secondary"
//             onClick={() => setShowRepeatConfirmation(false)}
//             disabled={isSubmitting}
//           >
//             Abbrechen
//           </Button>
//           <Button
//             variant="primary"
//             onClick={handleRepeatSubmit}
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? (
//               <>
//                 <Spinner
//                   as="span"
//                   animation="border"
//                   size="sm"
//                   role="status"
//                   aria-hidden="true"
//                   className="me-2"
//                 />
//                 Speichern...
//               </>
//             ) : (
//               "Bestätigen"
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Custom Repeat Modal */}
//       <Modal
//         show={showCustomRepeatModal}
//         onHide={() => {
//           if (!isSubmitting) {
//             setShowCustomRepeatModal(false);
//             resetCustomRepeatForm();
//           }
//         }}
//         size="lg"
//         centered
//         backdrop={isSubmitting ? "static" : true}
//         keyboard={!isSubmitting}
//       >
//         <Modal.Header closeButton={!isSubmitting}>
//           <Modal.Title>Benutzerdefinierte Wiederholung</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {/* Date Selection */}
//           <div className="form-group mb-4">
//             <label className="form-label">Startdatum</label>
//             <div className="input-group">
//               <span className="input-group-text">
//                 <CalendarEvent />
//               </span>
//               <DatePicker
//                 selected={repeatDate}
//                 onChange={(date) => setRepeatDate(date)}
//                 minDate={new Date()}
//                 dateFormat="dd.MM.yyyy"
//                 className="form-control"
//                 placeholderText="Datum auswählen"
//                 required
//               />
//             </div>
//           </div>

//           {/* Repeat Every */}
//           <div className="d-flex align-items-center mb-3">
//             <span className="me-2">Wiederhole alle</span>
//             <input
//               type="number"
//               min="1"
//               value={repeatEvery}
//               onChange={(e) => setRepeatEvery(e.target.value)}
//               className="form-control w-25 me-2"
//             />
//             <select
//               value={repeatUnit}
//               onChange={(e) => {
//                 setRepeatUnit(e.target.value);
//                 if (e.target.value !== "week") setSelectedDays([]);
//               }}
//               className="form-select w-50"
//             >
//               <option value="day">Tage</option>
//               <option value="week">Wochen</option>
//               <option value="month">Monate</option>
//               <option value="year">Jahre</option>
//             </select>
//           </div>

//           {/* Repeat On - Only show for weekly */}
//           {repeatUnit === "week" && (
//             <div className="mb-3">
//               <span className="d-block mb-2">Wiederhole an</span>
//               <div className="d-flex flex-wrap gap-2">
//                 {days.map((day, index) => (
//                   <button
//                     key={index}
//                     type="button"
//                     className={`btn btn-sm ${
//                       selectedDays.includes(day.value)
//                         ? "btn-primary"
//                         : "btn-outline-primary"
//                     }`}
//                     onClick={() => toggleDay(day.value)}
//                   >
//                     {day.label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Ends Section */}
//           <div className="mb-3">
//             <span className="d-block mb-2">Endet</span>
//             <div className="form-check">
//               <input
//                 type="radio"
//                 id="never"
//                 name="ends"
//                 value="never"
//                 checked={endOption === "never"}
//                 onChange={() => setEndOption("never")}
//                 className="form-check-input"
//               />
//               <label htmlFor="never" className="form-check-label">
//                 Nie
//               </label>
//             </div>

//             <div className="form-check mt-2">
//               <input
//                 type="radio"
//                 id="on"
//                 name="ends"
//                 value="on"
//                 checked={endOption === "on"}
//                 onChange={() => setEndOption("on")}
//                 className="form-check-input"
//               />
//               <label htmlFor="on" className="form-check-label">
//                 Am
//               </label>
//               {endOption === "on" && (
//                 <input
//                   type="date"
//                   value={endDateCustom}
//                   onChange={(e) => setEndDateCustom(e.target.value)}
//                   className="form-control mt-2"
//                   min={new Date().toISOString().split("T")[0]}
//                 />
//               )}
//             </div>

//             <div className="form-check mt-2">
//               <input
//                 type="radio"
//                 id="after"
//                 name="ends"
//                 value="after"
//                 checked={endOption === "after"}
//                 onChange={() => setEndOption("after")}
//                 className="form-check-input"
//               />
//               <label htmlFor="after" className="form-check-label">
//                 Nach
//               </label>
//               {endOption === "after" && (
//                 <div className="d-flex align-items-center mt-2">
//                   <input
//                     type="number"
//                     min="1"
//                     value={occurrences}
//                     onChange={(e) => setOccurrences(e.target.value)}
//                     className="form-control w-25 me-2"
//                   />
//                   <span>Wiederholungen</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="secondary"
//             onClick={() => {
//               setShowCustomRepeatModal(false);
//               resetCustomRepeatForm();
//             }}
//             disabled={isSubmitting}
//           >
//             Abbrechen
//           </Button>
//           <Button
//             variant="primary"
//             onClick={handleCustomRepeatSubmit}
//             disabled={isSubmitting || !repeatDate}
//           >
//             {isSubmitting ? (
//               <>
//                 <Spinner
//                   as="span"
//                   animation="border"
//                   size="sm"
//                   role="status"
//                   aria-hidden="true"
//                   className="me-2"
//                 />
//                 Speichern...
//               </>
//             ) : (
//               "Speichern"
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Busy Artist Modal */}
//       <Modal
//         show={showBusyArtistModal}
//         onHide={() => {
//           if (!isBusySubmitting) {
//             setShowBusyArtistModal(false);
//             setSelectedMonth("");
//             setSelectedDays([]);
//           }
//         }}
//         size="lg"
//         centered
//         backdrop={isBusySubmitting ? "static" : true}
//         keyboard={!isBusySubmitting}
//       >
//         <Modal.Header closeButton={!isBusySubmitting}>
//           <Modal.Title>Ausgebucht eintragen</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <form onSubmit={handleBusyArtistSubmit}>
//             {/* Month Selection */}
//             <div className="form-group mb-3">
//               <label className="form-label">Monat auswählen</label>
//               {selectedMonth === currentMonthName && (
//                 <div className="alert alert-info small mb-2">
//                   Für den aktuellen Monat ({currentMonthName}) beginnt die
//                   Sperrung ab heute.
//                 </div>
//               )}
//               <Form.Select
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(e.target.value)}
//                 required
//               >
//                 <option value="">-- Monat auswählen --</option>
//                 {monthsFromCurrent.map((month) => (
//                   <option key={month} value={month}>
//                     {month}{" "}
//                     {month === currentMonthName ? "(Aktueller Monat)" : ""}
//                   </option>
//                 ))}
//               </Form.Select>
//             </div>

//             {/* Days of Week Selection */}
//             <div className="form-group mb-3">
//               <label className="form-label">Wochentage auswählen</label>
//               <div className="days-selection-container">
//                 {daysOfWeek.map((day) => (
//                   <Button
//                     key={day.id}
//                     variant={
//                       selectedDays.includes(day.id)
//                         ? "primary"
//                         : "outline-primary"
//                     }
//                     onClick={() => toggleDaySelection(day.id)}
//                     className="day-button"
//                     type="button"
//                   >
//                     {day.label}
//                   </Button>
//                 ))}
//               </div>
//             </div>

//             {/* Buttons */}
//             <div className="d-flex justify-content-end">
//               <Button
//                 variant="secondary"
//                 className="me-2"
//                 onClick={() => {
//                   setShowBusyArtistModal(false);
//                   setSelectedMonth("");
//                   setSelectedDays([]);
//                 }}
//                 disabled={isBusySubmitting}
//               >
//                 Abbrechen
//               </Button>
//               <Button
//                 variant="warning"
//                 type="submit"
//                 disabled={
//                   isBusySubmitting ||
//                   !selectedMonth ||
//                   selectedDays.length === 0
//                 }
//               >
//                 {isBusySubmitting ? (
//                   <>
//                     <Spinner
//                       as="span"
//                       animation="border"
//                       size="sm"
//                       role="status"
//                       aria-hidden="true"
//                       className="me-2"
//                     />
//                     Speichern...
//                   </>
//                 ) : (
//                   "Ausgebucht eintragen"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </Modal.Body>
//       </Modal>

//       {/* Delete Modal */}
//       <Modal
//         show={showDeleteModal}
//         onHide={() => {
//           if (!isDeleting) {
//             setShowDeleteModal(false);
//           }
//         }}
//         centered
//         backdrop={isDeleting ? "static" : true}
//         keyboard={!isDeleting}
//       >
//         <Modal.Header closeButton={!isDeleting}>
//           <Modal.Title>Delete Unavailability</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {isDeleting ? (
//             <div className="text-center py-3">
//               <Spinner animation="border" role="status" className="me-2" />
//               Deleting event...
//             </div>
//           ) : (
//             <p>Are you sure you want to delete this unavailability?</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button
//             variant="secondary"
//             onClick={() => setShowDeleteModal(false)}
//             disabled={isDeleting}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="danger"
//             onClick={handleDeleteConfirm}
//             disabled={isDeleting}
//           >
//             {isDeleting ? (
//               <>
//                 <Spinner animation="border" size="sm" className="me-2" />
//                 Deleting...
//               </>
//             ) : (
//               "Delete"
//             )}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </DashboardLayout>
//   );
// };

// export default UnavailabilityDashboard;

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

const UnavailabilityDashboard = ({ setAuth, handleLogout }) => {
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showBusyArtistModal, setShowBusyArtistModal] = useState(false);
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
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatType, setRepeatType] = useState(null);
  const [repeatDate, setRepeatDate] = useState(null);
  const [showRepeatConfirmation, setShowRepeatConfirmation] = useState(false);

  // Busy artist state
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [isBusySubmitting, setIsBusySubmitting] = useState(false);

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

      const calendarName = "Sperrtermine";
      setJoinedCalendars([{ Calendar: calendarName }]);

      const payload = {
        user: {
          name: userFromApi.Name,
          email: userFromApi["E-Mail"],
          calendars: calendarName,
        },
      };
      console.log("Fetching unavailabilities with payload:", payload);

      const unavailabilityRes = await axios.post(
        `${UNAVAILABLE_API_URL}/getUnavailabilities`,
        payload
      );
      console.log("Unavailability data fetched:", unavailabilityRes.data);

      const fetched = (unavailabilityRes.data || []).map((event) => {
        const berlinStart = new Date(event.start.dateTime || event.start.date);
        const berlinEnd = new Date(event.end.dateTime || event.end.date);
        berlinEnd.setDate(berlinEnd.getDate() - 1);

        return {
          id:
            event.id ||
            event.iCalUID ||
            event.uid ||
            `${berlinStart.getTime()}-${Math.random()}`,
          startDate: berlinStart.toISOString().split("T")[0],
          endDate: berlinEnd.toISOString().split("T")[0],
          details: "Nicht verfügbar",
          uid: event.extendedProperties?.private?.uid || event.id || "",
          htmlLink: event.htmlLink || "",
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
        },
      };
      console.log("Unavailability data to submit:", unavailabilityData);

      await axios.post(
        `${UNAVAILABLE_API_URL}/unavailabilities`,
        unavailabilityData
      );

      toast.success("Sperrtermin erfolgreich hinzugefügt");

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

  const handleRepeatSubmit = async () => {
    if (!repeatDate) {
      toast.error("Bitte wählen Sie ein gültiges Datum.");
      return;
    }

    setIsSubmitting(true);

    try {
      const calendarNames = "Sperrtermine";
      const formattedDate = formatDateNoTZ(repeatDate);

      const unavailabilityData = {
        user: {
          name: currentUser.Name,
          email: currentUser["E-Mail"],
          calendars: calendarNames,
        },
        unavailability: {
          startDate: formattedDate,
          endDate: formattedDate,
          veryBusy: false,
          reason: "Nicht verfügbar",
          details: "Nicht verfügbar",
          repeat: repeatType,
        },
      };
      console.log("Repeating unavailability data:", unavailabilityData);

      await axios.post(
        `${UNAVAILABLE_API_URL}/repeating-unavailabilities`,
        unavailabilityData
      );

      toast.success(`Wiederholender Sperrtermin (${getRepeatLabel(repeatType)}) erfolgreich hinzugefügt`);
      setShowRepeatConfirmation(false);
      setShowRepeatModal(false);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Error creating repeating unavailability:", error);
      toast.error("Fehler beim Erstellen des wiederholenden Sperrtermins");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRepeatLabel = (type) => {
    switch (type) {
      case 'weekly':
        return 'Wöchentlich';
      case 'monthly':
        return 'Monatlich';
      case 'annually':
        return 'Jährlich';
      default:
        return '';
    }
  };

  const handleBusyArtistSubmit = async (e) => {
    e.preventDefault();
    setIsBusySubmitting(true);

    if (!selectedMonth || selectedDays.length === 0) {
      toast.error(
        "Bitte wählen Sie einen Monat und mindestens einen Wochentag aus."
      );
      setIsBusySubmitting(false);
      return;
    }

    try {
      const calendarNames = "Sperrtermine";

      const currentYear = new Date().getFullYear();
      const monthIndex =
        monthsFromCurrent.indexOf(selectedMonth) + currentMonthIndex;

      const today = new Date();
      const startDate =
        monthIndex === today.getMonth()
          ? new Date(today)
          : new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);

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
          details: `Ausgebucht an folgenden Wochentagen: ${selectedDays.join(
            ", "
          )}`,
          daysOfWeek: selectedDays,
        },
      };
      console.log("Unavailability data to submit:", unavailabilityData);

      await axios.post(
        `${UNAVAILABLE_API_URL}/busy-unavailabilities`,
        unavailabilityData
      ); 

      toast.success("Ausbuchung erfolgreich hinzugefügt");
      setShowBusyArtistModal(false);
      setSelectedMonth("");
      setSelectedDays([]);
      fetchUnavailabilities();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Fehler beim Speichern der Ausbuchung");
    } finally {
      setIsBusySubmitting(false);
    }
  };

  const toggleDaySelection = (dayId) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const resetForm = () => {
    setStartDate(null);
    setEndDate(null);
    setSubmitSuccess(false);
    setRepeatDate(null);
    setRepeatType(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUnavailability || !selectedUnavailability.uid) {
      toast.error("Ungültiger Sperrtermin ausgewählt");
      return;
    }

    setIsDeleting(true);
    try {
      const calendarNames = "Sperrtermine";

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

  const handleRepeatOptionSelect = (type) => {
    if (type === 'none') {
      resetForm();
      setShowFormModal(true);
    } else {
      setRepeatType(type);
      setShowRepeatModal(true);
    }
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
          <Dropdown>
            <Dropdown.Toggle variant="primary" className="add-unavailability-btn">
              <Plus className="me-2" />
              Sperrtermin hinzufügen
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleRepeatOptionSelect('none')}>
                Nicht wiederholen
              </Dropdown.Item>
              <Dropdown.Item disabled>Täglich</Dropdown.Item>
              <Dropdown.Item onClick={() => handleRepeatOptionSelect('weekly')}>
                Wöchentlich
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleRepeatOptionSelect('monthly')}>
                Monatlich
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleRepeatOptionSelect('annually')}>
                Jährlich
              </Dropdown.Item>
              <Dropdown.Item disabled>Benutzerdefiniert</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Button
            variant="warning"
            onClick={() => setShowBusyArtistModal(true)}
            className="add-busy-btn"
          >
            <Clock className="me-2" />
            Ausgebucht eintragen
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

      {/* Repeat Modal */}
      <Modal
        show={showRepeatModal}
        onHide={() => {
          if (!isSubmitting) {
            setShowRepeatModal(false);
            resetForm();
          }
        }}
        size="lg"
        centered
        backdrop={isSubmitting ? "static" : true}
        keyboard={!isSubmitting}
      >
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title>
            {getRepeatLabel(repeatType)} Sperrtermin eintragen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <div className="form-group mb-3">
              <label className="form-label">Datum auswählen</label>
              <div className="input-group">
                <span className="input-group-text">
                  <CalendarEvent />
                </span>
                <DatePicker
                  selected={repeatDate}
                  onChange={(date) => setRepeatDate(date)}
                  minDate={new Date()}
                  dateFormat="dd.MM.yyyy"
                  className="form-control"
                  placeholderText="Datum auswählen"
                  required
                />
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  setShowRepeatModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowRepeatConfirmation(true)}
                disabled={!repeatDate || isSubmitting}
              >
                Weiter
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Repeat Confirmation Modal */}
      <Modal
        show={showRepeatConfirmation}
        onHide={() => {
          if (!isSubmitting) {
            setShowRepeatConfirmation(false);
          }
        }}
        centered
        backdrop={isSubmitting ? "static" : true}
        keyboard={!isSubmitting}
      >
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title>Bestätigung</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Möchten Sie wirklich einen {getRepeatLabel(repeatType)} wiederholenden Sperrtermin für den{" "}
            {repeatDate?.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })} erstellen?
          </p>
          <p className="text-muted small">
            Dieser Termin wird {repeatType === 'weekly' ? 'wöchentlich' : 
                             repeatType === 'monthly' ? 'monatlich' : 
                             'jährlich'} wiederholt.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRepeatConfirmation(false)}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleRepeatSubmit}
            disabled={isSubmitting}
          >
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
              "Bestätigen"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Busy Artist Modal */}
      <Modal
        show={showBusyArtistModal}
        onHide={() => {
          if (!isBusySubmitting) {
            setShowBusyArtistModal(false);
            setSelectedMonth("");
            setSelectedDays([]);
          }
        }}
        size="lg"
        centered
        backdrop={isBusySubmitting ? "static" : true}
        keyboard={!isBusySubmitting}
      >
        <Modal.Header closeButton={!isBusySubmitting}>
          <Modal.Title>Ausgebucht eintragen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleBusyArtistSubmit}>
            {/* Month Selection */}
            <div className="form-group mb-3">
              <label className="form-label">Monat auswählen</label>
              {selectedMonth === currentMonthName && (
                <div className="alert alert-info small mb-2">
                  Für den aktuellen Monat ({currentMonthName}) beginnt die
                  Sperrung ab heute.
                </div>
              )}
              <Form.Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                required
              >
                <option value="">-- Monat auswählen --</option>
                {monthsFromCurrent.map((month) => (
                  <option key={month} value={month}>
                    {month}{" "}
                    {month === currentMonthName ? "(Aktueller Monat)" : ""}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Days of Week Selection */}
            <div className="form-group mb-3">
              <label className="form-label">Wochentage auswählen</label>
              <div className="days-selection-container">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.id}
                    variant={
                      selectedDays.includes(day.id)
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => toggleDaySelection(day.id)}
                    className="day-button"
                    type="button"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  setShowBusyArtistModal(false);
                  setSelectedMonth("");
                  setSelectedDays([]);
                }}
                disabled={isBusySubmitting}
              >
                Abbrechen
              </Button>
              <Button
                variant="warning"
                type="submit"
                disabled={
                  isBusySubmitting ||
                  !selectedMonth ||
                  selectedDays.length === 0
                }
              >
                {isBusySubmitting ? (
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
                  "Ausgebucht eintragen"
                )}
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