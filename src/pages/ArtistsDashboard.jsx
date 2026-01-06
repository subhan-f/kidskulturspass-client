import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { toast } from "react-toastify";
import { Table, Button, Modal, Spinner, Badge } from "react-bootstrap";
import {
  ChevronDown,
  ChevronUp,
  PersonPlus,
  Trash,
  X,
  Eye,
  EyeSlash,
  Pencil,
} from "react-bootstrap-icons";
import { DashboardLayout } from "../components/layout";
import { PullToRefresh, SearchBox, DashboardLoader } from "../components/common";
import AddArtistModal from "../components/AddArtistModal";

import { useMediaQuery } from "react-responsive";
import api, { authApi } from "../utils/api";
import { useNavigate } from "react-router-dom";

const ArtistsDashboard = ({ setAuth, handleLogout }) => {
  // State for artists and UI
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCalendarForModal, setSelectedCalendarForModal] = useState("");
  const [openAddForms, setOpenAddForms] = useState({});
  const [calendars, setCalendars] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [newArtistForms, setNewArtistForms] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [loggingIn, setLoggingIn] = useState({});
  const [showTooltip, setShowTooltip] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [openTooltips, setOpenTooltips] = useState({});
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [artistToEdit, setArtistToEdit] = useState(null);

  // ✅ NEW: Details popup states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsArtist, setDetailsArtist] = useState(null);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const navigate = useNavigate();

  const fetchCalendars = useCallback(async () => {
    try {
      const response = await api.get("/calendars");
      setCalendars(response.data || []);
    } catch (err) {
      console.error("Error fetching calendars:", err);
      setCalendars([]);
    }
  }, []);

  const fetchRoleOptions = useCallback(async () => {
    try {
      const response = await api.get("/roleOptions");
      setRoleOptions(response.data || []);
    } catch (err) {
      console.error("Error fetching role options:", err);
      setRoleOptions([]);
    }
  }, []);

  const fetchArtists = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/artists");
      response.data = response.data.map((artist) => {
        // If individual address fields exist but combined doesn't, create it
        const street = artist.Street || artist.street || "";
        const houseNumber = artist.HouseNumber || artist.houseNumber || "";
        const city = artist.City || artist.city || "";
        const postalCode = artist.PostalCode || artist.postalCode || "";
        const state = artist.State || artist.state || "";

        let combinedAddress = artist.Address || "";

        // Create combined address if we have individual fields but no combined address
        if (!combinedAddress && (street || city || postalCode || state)) {
          combinedAddress =
            `${street} ${houseNumber}, ${postalCode} ${city}, ${state}`.trim();
          combinedAddress = combinedAddress
            .replace(/\s*,\s*$/g, "")
            .replace(/,\s*,/g, ",");
        }

        return {
          name: artist.Name,
          calendar: artist.Calendar,
          email: artist["E-Mail"],
          role: artist.Role,
          password: artist.password,
          dashboardVisits: artist.dashboardVisits || [],
          firstName: artist.FirstName || "",
          lastName: artist.LastName || "",
          phone: artist.Phone || "",
          address: combinedAddress,
          // Individual address fields
          street: street,
          houseNumber: houseNumber,
          city: city,
          postalCode: postalCode,
          state: state,
        };
      });

      if (response.data.error) {
        setError(response.data.error);
        toast.error(`Error: ${response.data.error}`);
        setArtists([]);
        setFilteredArtists([]);
      } else {
        const artistData = response.data || [];
        setArtists(artistData);
        setFilteredArtists(artistData);

        if (artistData.length > 0) {
          const uniqueCalendars = [
            ...new Set(artistData.map((artist) => artist.calendar)),
          ];
          const initialExpandState = {};
          uniqueCalendars.forEach((cal) => {
            initialExpandState[cal] = true;
          });
          setExpandedCalendars(initialExpandState);

          const initialFormState = {};
          uniqueCalendars.forEach((cal) => {
            initialFormState[cal] = {
              calendar: cal,
              name: "",
              role: "",
              email: "",
              password: "",
            };
          });
          setNewArtistForms(initialFormState);
        }
      }
    } catch (err) {
      console.error("Error fetching artists:", err);
      setError("Failed to load artists. Please try again later.");
      toast.error("Failed to load artists");
      setArtists([]);
      setFilteredArtists([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const useClickOutside = (ref, callback) => {
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (ref.current && !ref.current.contains(event.target)) {
          callback();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, callback]);
  };

  useEffect(() => {
    fetchArtists();
    fetchCalendars();
    fetchRoleOptions();
  }, [fetchArtists, fetchCalendars, fetchRoleOptions]);

  const toggleCalendarExpand = useCallback((calendar) => {
    setExpandedCalendars((prev) => ({
      ...prev,
      [calendar]: !prev[calendar],
    }));
  }, []);

  const toggleTooltip = (email, event) => {
    if (event) {
      event.stopPropagation();
    }
    setOpenTooltips((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  const closeAllTooltips = () => {
    setOpenTooltips({});
  };

  const TooltipComponent = ({ artist, onClose }) => {
    const tooltipRef = useRef(null);

    useClickOutside(tooltipRef, () => {
      onClose(artist.email);
    });

    return (
      <div ref={tooltipRef} className="visits-tooltip">
        <div className="tooltip-header">
          <h6>Dashboard-Besuche</h6>
          <Button
            variant="link"
            size="sm"
            onClick={() => onClose(artist.email)}
            className="tooltip-close"
          >
            <X size={12} />
          </Button>
        </div>
        {artist.dashboardVisits.length === 0 ? (
          <p className="text-muted">Keine Besuche</p>
        ) : (
          <ul className="visits-list">
            {artist.dashboardVisits.map((visit, idx) => (
              <li key={idx}>{new Date(visit).toLocaleString("de-DE")}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const MobileTooltipComponent = ({ artist, onClose }) => {
    const tooltipRef = useRef(null);

    useClickOutside(tooltipRef, () => {
      onClose(artist.email);
    });

    return (
      <div ref={tooltipRef} className="mobile-visits-tooltip">
        <div className="tooltip-header">
          <h6>Dashboard-Besuche</h6>
          <Button
            variant="link"
            size="sm"
            onClick={() => onClose(artist.email)}
            className="tooltip-close"
          >
            <X size={12} />
          </Button>
        </div>
        {artist.dashboardVisits.length === 0 ? (
          <p className="text-muted">Keine Besuche</p>
        ) : (
          <ul className="visits-list">
            {artist.dashboardVisits.map((visit, idx) => (
              <li key={idx}>{new Date(visit).toLocaleString("de-DE")}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const togglePasswordVisibility = (email) => {
    setShowPasswords((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  // ✅ NEW: open/close details modal
  const openDetails = (artist, e) => {
    if (e) e.stopPropagation();
    setDetailsArtist(artist);
    setShowDetailsModal(true);
    closeAllTooltips();
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setDetailsArtist(null);
  };

  const artistsByCalendar = useMemo(() => {
    const filtered =
      searchTerm.trim() === ""
        ? artists
        : artists.filter((artist) => {
            const searchLower = searchTerm.toLowerCase();

            return (
              (artist.name || "").toLowerCase().includes(searchLower) ||
              (artist.email || "").toLowerCase().includes(searchLower) ||
              (artist.calendar || "").toLowerCase().includes(searchLower) ||
              (artist.role || "").toLowerCase().includes(searchLower) ||
              (artist.password || "").toLowerCase().includes(searchLower) ||
              (artist.firstName || "").toLowerCase().includes(searchLower) ||
              (artist.lastName || "").toLowerCase().includes(searchLower) ||
              (artist.phone || "").toLowerCase().includes(searchLower) ||
              (artist.address || "").toLowerCase().includes(searchLower) ||
              (artist.street || "").toLowerCase().includes(searchLower) ||
              (artist.houseNumber || "").toLowerCase().includes(searchLower) ||
              (artist.city || "").toLowerCase().includes(searchLower) ||
              (artist.postalCode || "").toLowerCase().includes(searchLower) ||
              (artist.state || "").toLowerCase().includes(searchLower) ||
              `${artist.street || ""} ${artist.houseNumber || ""} ${
                artist.city || ""
              } ${artist.postalCode || ""} ${artist.state || ""}`
                .toLowerCase()
                .includes(searchLower)
            );
          });

    return filtered.reduce((acc, artist) => {
      const calendar = artist.calendar || "Unbekannt";
      if (!acc[calendar]) {
        acc[calendar] = [];
      }
      acc[calendar].push(artist);
      return acc;
    }, {});
  }, [artists, searchTerm]);

  const calendarsWithArtists = useMemo(
    () => Object.keys(artistsByCalendar).sort(),
    [artistsByCalendar]
  );

  const getRoleCountsByCalendar = useMemo(() => {
    return artists.reduce((acc, artist) => {
      if (!artist.calendar || !artist.role) return acc;

      if (!acc[artist.calendar]) {
        acc[artist.calendar] = {};
      }

      acc[artist.calendar][artist.role] =
        (acc[artist.calendar][artist.role] || 0) + 1;
      return acc;
    }, {});
  }, [artists]);

  const calendarHasMatch = useCallback(
    (calendar) => {
      return (
        artistsByCalendar[calendar] && artistsByCalendar[calendar].length > 0
      );
    },
    [artistsByCalendar]
  );

  const totalFilteredArtists = useMemo(
    () => Object.values(artistsByCalendar).flat().length,
    [artistsByCalendar]
  );

  const toggleAddForm = useCallback(
    (calendar, e) => {
      if (e) e.stopPropagation();
      setModalMode("add");
      setSelectedCalendarForModal(calendar);
      setTimeout(() => setShowAddModal(true), 0);
      setSelectedRoles([
        ...new Set(artistsByCalendar[calendar].map((artist) => artist.role)),
      ]);
    },
    [artistsByCalendar]
  );

  const handleEditClick = useCallback((artist, e) => {
    if (e) e.stopPropagation();
    setModalMode("edit");
    setArtistToEdit(artist);
    setSelectedCalendarForModal(artist.calendar);
    setTimeout(() => setShowAddModal(true), 0);
    closeAllTooltips();
  }, []);

  const handleAddArtistFromModal = async (artistData) => {
    try {
      if (
        !artistData.calendar ||
        !artistData.firstName ||
        !artistData.lastName ||
        !artistData.phone ||
        !artistData.street ||
        !artistData.houseNumber ||
        !artistData.city ||
        !artistData.postalCode ||
        !artistData.state ||
        !artistData.role ||
        !artistData.email
      ) {
        toast.error("Bitte füllen Sie alle Pflichtfelder aus");
        return;
      }

      const capitalizeName = (name) => {
        return name
          .trim()
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      const capitalizeAddressPart = (text) => {
        return text
          .trim()
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      const combinedAddress = `${artistData.street.trim()} ${artistData.houseNumber.trim()}, ${artistData.postalCode.trim()} ${artistData.city.trim()}, ${artistData.state.trim()}`;

      const processedData = {
        Calendar: artistData.calendar.trim(),
        Name: `${capitalizeName(artistData.firstName)} ${capitalizeName(
          artistData.lastName
        )}`,
        FirstName: capitalizeName(artistData.firstName),
        LastName: capitalizeName(artistData.lastName),
        Role: artistData.role.trim(),
        email: artistData.email.trim().toLowerCase(),
        Phone: artistData.phone.trim().replace(/\s/g, ""),
        Address: combinedAddress,
        Street: capitalizeAddressPart(artistData.street),
        HouseNumber: artistData.houseNumber.trim(),
        City: capitalizeAddressPart(artistData.city),
        PostalCode: artistData.postalCode.trim(),
        State: artistData.state.trim(),
      };

      const response = await api.post("/artist", processedData);

      if (response.data.status === "success") {
        toast.success("Künstler erfolgreich hinzugefügt");
        setShowAddModal(false);
        fetchArtists(true);
      } else {
        toast.error(
          response.data.message || "Fehler beim Hinzufügen des Künstlers"
        );
      }
    } catch (error) {
      console.error("Error adding artist:", error);
      toast.error(
        "Fehler beim Hinzufügen des Künstlers: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleUpdateArtistFromModal = async (updatedData) => {
    try {
      if (
        !updatedData.calendar ||
        !updatedData.firstName ||
        !updatedData.lastName ||
        !updatedData.phone ||
        !updatedData.street ||
        !updatedData.houseNumber ||
        !updatedData.city ||
        !updatedData.postalCode ||
        !updatedData.state ||
        !updatedData.role ||
        !updatedData.email
      ) {
        toast.error("Bitte füllen Sie alle Pflichtfelder aus");
        return;
      }

      const capitalizeName = (name) => {
        return name
          .trim()
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      const capitalizeAddressPart = (text) => {
        return text
          .trim()
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      const combinedAddress = `${updatedData.street.trim()} ${updatedData.houseNumber.trim()}, ${updatedData.postalCode.trim()} ${updatedData.city.trim()}, ${updatedData.state.trim()}`;

      const updatePayload = {
        Calendar: updatedData.calendar.trim(),
        Name: `${capitalizeName(updatedData.firstName)} ${capitalizeName(
          updatedData.lastName
        )}`,
        FirstName: capitalizeName(updatedData.firstName),
        LastName: capitalizeName(updatedData.lastName),
        Role: updatedData.role.trim(),
        email: updatedData.email.trim().toLowerCase(),
        Phone: updatedData.phone.trim().replace(/\s/g, ""),
        Address: combinedAddress,
        Street: capitalizeAddressPart(updatedData.street),
        HouseNumber: updatedData.houseNumber.trim(),
        City: capitalizeAddressPart(updatedData.city),
        PostalCode: updatedData.postalCode.trim(),
        State: updatedData.state.trim(),
        originalEmail: artistToEdit?.email?.trim()?.toLowerCase(),
      };

      const response = await api.put("/artist", updatePayload);

      if (response.data.status === "success") {
        toast.success("Künstler erfolgreich aktualisiert");
        setShowAddModal(false);
        fetchArtists(true);
      } else {
        toast.error(
          response.data.message || "Fehler beim Aktualisieren des Künstlers"
        );
      }
    } catch (error) {
      console.error("Error updating artist:", error);
      toast.error(
        "Fehler beim Aktualisieren des Künstlers: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleAdminLoginAsArtist = async (artist) => {
    if (loggingIn[artist.email]) return;

    setLoggingIn((prev) => ({ ...prev, [artist.email]: true }));

    try {
      const res = await authApi.login({
        username: artist.email,
        password: artist.password,
      });

      const userRes = await authApi.getMe();
      const user = userRes.data.user;

      if (user.Role === "Admin") {
        toast.warning("You just logged in again as Admin.");
        navigate("/artists");
      } else {
        toast.success(`Logged in as ${user.Name || user.email}`);
        navigate("/user-assigned-dashboard");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Login failed. Please check the credentials."
      );
    } finally {
      setLoggingIn((prev) => ({ ...prev, [artist.email]: false }));
    }
  };

  const handleDeleteClick = (artist) => {
    setSelectedArtist(artist);
    setShowDeleteModal(true);
    closeAllTooltips();
  };

  const handleLoginClick = (artist) => {
    closeAllTooltips();
    handleAdminLoginAsArtist(artist);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!selectedArtist || isDeleting) return;

      setIsDeleting(true);
      const response = await api.delete("/artist", {
        data: {
          calendar: selectedArtist.calendar,
          email: selectedArtist.email,
        },
      });

      fetchArtists(true);
      setShowDeleteModal(false);
      setSelectedArtist(null);

      if (response.data.status === "success") {
        console.log("Artist deleted successfully");
      } else {
        console.error(
          response.data.message || "Error deleting the artist"
        );
      }
    } catch (error) {
      console.error("Error deleting artist:", error);
      console.error(
        "Error deleting artist: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <DashboardLayout
      setAuth={setAuth}
      onRefresh={() => fetchArtists(true)}
      handleLogout={handleLogout}
    >
      <div className="artists-dashboard">
        {!loading && (
          <div className="transparent-header-container">
            <h1 className="dashboard-main-title">Artist Management</h1>
            <div className="header-search-box">
              <SearchBox
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search name, city, state, zip, role..."
              />
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <div className="artists-container">
          {loading ? (
            <DashboardLoader message="Loading artists..." />
          ) : totalFilteredArtists === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="bi bi-person-x"></i>
              </div>
              <h4>{searchTerm ? "No results found." : "No artists found."}</h4>
              <p>
                {searchTerm
                  ? "Try a different search term."
                  : 'Click "Add Artist" to create a new artist.'}
              </p>
              {!searchTerm && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setModalMode("add");
                    setShowAddModal(true);
                  }}
                >
                  Add Artist
                </Button>
              )}
            </div>
          ) : (
            <PullToRefresh
              onRefresh={() => fetchArtists(true)}
              isPullable={isMobile}
            >
              {calendarsWithArtists.map((calendar) => (
                <div
                  key={calendar}
                  className={`artist-calendar-card ${
                    !calendarHasMatch(calendar) && searchTerm ? "filtered-out" : ""
                  }`}
                >
                  <div
                    className="calendar-header"
                    onClick={() => toggleCalendarExpand(calendar)}
                  >
                    <div className="header-content">
                      <div className="title-with-icon">
                        <h5 className="calendar-title">{calendar}</h5>

                        <div className="dropdown-toggle-icon">
                          {expandedCalendars[calendar] ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </div>

                        {getRoleCountsByCalendar[calendar] &&
                          Object.entries(getRoleCountsByCalendar[calendar]).length > 0 && (
                            <div className="calendar-role-badges d-none d-md-flex">
                              {Object.entries(getRoleCountsByCalendar[calendar])
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([role, count]) => (
                                  <Badge
                                    key={role}
                                    bg={
                                      count > 5
                                        ? "primary"
                                        : count > 2
                                        ? "info"
                                        : "success"
                                    }
                                    className="enhanced-badge capsule-badge"
                                  >
                                    {role}{" "}
                                    <span className="badge-count">{count}</span>
                                  </Badge>
                                ))}
                              {Object.keys(getRoleCountsByCalendar[calendar]).length > 3 && (
                                <Badge
                                  bg="secondary"
                                  className="enhanced-badge capsule-badge"
                                >
                                  +
                                  {Object.keys(getRoleCountsByCalendar[calendar]).length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>

                      <span className="artists-count d-none d-md-inline-block">
                        <span className="count-number">
                          {artistsByCalendar[calendar].length}
                        </span>
                        <span className="count-label"> Artists</span>
                      </span>
                    </div>

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="add-calendar-artist-btn"
                      onClick={(e) => {
                        setSelectedRoles([
                          ...new Set(
                            artistsByCalendar[calendar].map((artist) => artist.role)
                          ),
                        ]);
                        toggleAddForm(calendar, e);
                      }}
                      title="Add artist"
                    >
                      <PersonPlus size={16} />
                    </Button>
                  </div>

                  {expandedCalendars[calendar] && (
                    <div className="calendar-content">
                      {/* ✅ Desktop table: only Name, City, State, Zip, Role + More icon */}
                      <div className="table-responsive d-none d-md-block">
                        <Table className="artists-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>City</th>
                              <th>State</th>
                              <th>Zip</th>
                              <th>Role</th>
                              <th>More</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {artistsByCalendar[calendar].map((artist, index) => (
                              <tr key={index} className="artist-row">
                                <td className="artist-name">{artist.name}</td>
                                <td>{artist.city || "-"}</td>
                                <td>{artist.state || "-"}</td>
                                <td>{artist.postalCode || "-"}</td>
                                <td className="artist-role">
                                  <Badge bg="light" text="dark" className="role-badge">
                                    {artist.role || "-"}
                                  </Badge>
                                </td>

                                <td>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={(e) => openDetails(artist, e)}
                                    title="Show details"
                                  >
                                    <Eye size={16} />
                                  </Button>
                                </td>

                                <td className="artist-actions d-flex gap-1">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={(e) => handleEditClick(artist, e)}
                                    className="edit-btn"
                                    title="Edit artist"
                                  >
                                    <Pencil size={16} />
                                  </Button>

                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteClick(artist)}
                                    className="delete-btn"
                                    title="Delete artist"
                                  >
                                    <Trash size={16} />
                                  </Button>

                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleLoginClick(artist)}
                                    className="login-btn"
                                    disabled={loggingIn[artist.email]}
                                    title="Login as artist"
                                  >
                                    {loggingIn[artist.email] ? (
                                      <Spinner animation="border" size="sm" />
                                    ) : (
                                      <i className="bi bi-box-arrow-in-right"></i>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>

                      {/* Mobile cards (unchanged) */}
                      <div className="artist-cards-container d-md-none">
                        {artistsByCalendar[calendar].map((artist, index) => (
                          <div key={index} className="artist-mobile-card">
                            <div className="artist-mobile-header">
                              <div className="artist-mobile-title">{artist.name}</div>
                            </div>

                            <div className="artist-mobile-content">
                              <div className="artist-mobile-role">
                                <Badge bg="light" text="dark" className="role-badge">
                                  {artist.role}
                                </Badge>
                              </div>

                              <div className="artist-mobile-details">
                                <div className="artist-mobile-email">
                                  <i className="bi bi-envelope"></i> {artist.email}
                                </div>
                                <div className="artist-mobile-password">
                                  <i className="bi bi-key"></i>{" "}
                                  {showPasswords[artist.email]
                                    ? artist.password
                                    : "••••••••"}
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="password-toggle"
                                    onClick={() => togglePasswordVisibility(artist.email)}
                                    title={
                                      showPasswords[artist.email]
                                        ? "Hide password"
                                        : "Show password"
                                    }
                                  >
                                    {showPasswords[artist.email] ? (
                                      <EyeSlash size={14} />
                                    ) : (
                                      <Eye size={14} />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="artist-mobile-visits">
                                <Button
                                  variant="link"
                                  className="visits-icon p-1"
                                  onClick={(e) => toggleTooltip(artist.email, e)}
                                  title="Show dashboard visits"
                                >
                                  <i
                                    className="bi bi-bar-chart-fill"
                                    style={{ fontSize: "1.1rem" }}
                                  ></i>
                                  {artist.dashboardVisits.length > 0 && (
                                    <span
                                      className="visits-count"
                                      style={{
                                        fontSize: "0.6rem",
                                        width: "16px",
                                        height: "16px",
                                      }}
                                    >
                                      {artist.dashboardVisits.length}
                                    </span>
                                  )}
                                </Button>
                              </div>

                              {openTooltips[artist.email] && (
                                <MobileTooltipComponent
                                  artist={artist}
                                  onClose={toggleTooltip}
                                />
                              )}

                              <div className="artist-mobile-actions">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => handleEditClick(artist, e)}
                                  className="w-auto"
                                  title="Edit artist"
                                >
                                  <Pencil size={16} />
                                </Button>

                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(artist)}
                                  className="w-auto"
                                  title="Delete artist"
                                >
                                  <Trash size={16} />
                                </Button>

                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  className="w-auto"
                                  onClick={() => handleLoginClick(artist)}
                                  disabled={loggingIn[artist.email]}
                                  title="Login as artist"
                                >
                                  {loggingIn[artist.email] ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : (
                                    <i className="bi bi-box-arrow-in-right"></i>
                                  )}
                                </Button>

                                {/* Optional: open details on mobile too */}
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="w-auto"
                                  onClick={(e) => openDetails(artist, e)}
                                  title="Show details"
                                >
                                  <Eye size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </PullToRefresh>
          )}
        </div>
      </div>

      <AddArtistModal
        fetchArtists={fetchArtists}
        showModal={showAddModal}
        setShowModal={setShowAddModal}
        roles={selectedRoles}
        selectedRoles={selectedRoles}
        selectedCalendar={selectedCalendarForModal}
        handleAddArtist={handleAddArtistFromModal}
        handleUpdateArtist={handleUpdateArtistFromModal}
        roleOptions={roleOptions}
        mode={modalMode}
        artistToEdit={artistToEdit}
      />

      {/* ✅ NEW: Details Modal */}
      <Modal show={showDetailsModal} onHide={closeDetails} centered>
        <Modal.Header closeButton>
          <Modal.Title>Artist Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {!detailsArtist ? (
            <div className="text-muted">No details</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <div>
                <strong>Name:</strong> {detailsArtist.name || "-"}
              </div>
              <div>
                <strong>Email:</strong> {detailsArtist.email || "-"}
              </div>
              <div>
                <strong>Phone:</strong> {detailsArtist.phone || "-"}
              </div>
              <div>
                <strong>Calendar:</strong> {detailsArtist.calendar || "-"}
              </div>
              <div>
                <strong>Role:</strong> {detailsArtist.role || "-"}
              </div>

              <hr />

              <div>
                <strong>Street:</strong> {detailsArtist.street || "-"}
              </div>
              <div>
                <strong>House Number:</strong> {detailsArtist.houseNumber || "-"}
              </div>
              <div>
                <strong>City:</strong> {detailsArtist.city || "-"}
              </div>
              <div>
                <strong>Zip:</strong> {detailsArtist.postalCode || "-"}
              </div>
              <div>
                <strong>State:</strong> {detailsArtist.state || "-"}
              </div>

              <hr />

              <div>
                <strong>Password:</strong>{" "}
                {showPasswords[detailsArtist.email]
                  ? detailsArtist.password
                  : "••••••••"}
                <Button
                  variant="link"
                  size="sm"
                  className="ms-2"
                  onClick={() => togglePasswordVisibility(detailsArtist.email)}
                >
                  {showPasswords[detailsArtist.email] ? (
                    <EyeSlash size={14} />
                  ) : (
                    <Eye size={14} />
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={closeDetails}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal (existing) */}
      <Modal
        show={showDeleteModal}
        onHide={() => !isDeleting && setShowDeleteModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{selectedArtist?.name}"?
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
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Deleting...</span>
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

export default ArtistsDashboard;
