import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Table, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { ChevronDown, ChevronUp, PersonPlus, Trash, X } from 'react-bootstrap-icons';
import DashboardLayout from '../components/DashboardLayout';
import PullToRefresh from '../components/PullToRefresh';
import SearchBox from '../components/SearchBox';
import { useMediaQuery } from 'react-responsive';
import api from '../utils/api';
import DashboardLoader from '../components/DashboardLoader';
import AddArtistModal from '../components/AddArtistModal'; // Import the AddArtistModal component

const ArtistsDashboard = ({ setAuth }) => {
  // State for artists and UI
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCalendars, setExpandedCalendars] = useState({});
  
  // Add the missing state variables
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCalendarForModal, setSelectedCalendarForModal] = useState('');
  
  // Track which calendar's add form is open
  const [openAddForms, setOpenAddForms] = useState({});
  
  // Initialize these states with empty arrays instead of null
  const [calendars, setCalendars] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);

  // Form state for each calendar
  const [newArtistForms, setNewArtistForms] = useState({});

  // Check if on mobile device
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  // Fetch calendars and roles
  const fetchCalendars = useCallback(async () => {
    try {
      const response = await api.get('/calendars');
      setCalendars(response.data || []);
    } catch (err) {
      console.error('Error fetching calendars:', err);
      setCalendars([]); // Set to empty array on error
    }
  }, []);

  const fetchRoleOptions = useCallback(async () => {
    try {
      const response = await api.get('/roleOptions');
      setRoleOptions(response.data || []);
    } catch (err) {
      console.error('Error fetching role options:', err);
      setRoleOptions([]); // Set to empty array on error
    }
  }, []);

  // Fetch artists
  const fetchArtists = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/artists');
      
      if (response.data.error) {
        setError(response.data.error);
        toast.error(`Error: ${response.data.error}`);
        setArtists([]);
        setFilteredArtists([]);
      } else {
        const artistData = response.data || [];
        setArtists(artistData);
        setFilteredArtists(artistData);
        
        // Initialize expanded calendars state
        if (artistData.length > 0) {
          const uniqueCalendars = [...new Set(artistData.map(artist => artist.calendar))];
          const initialExpandState = {};
          uniqueCalendars.forEach(cal => {
            initialExpandState[cal] = true; // Default to expanded
          });
          setExpandedCalendars(initialExpandState);
          
          // Initialize form state for each calendar
          const initialFormState = {};
          uniqueCalendars.forEach(cal => {
            initialFormState[cal] = {
              calendar: cal,
              name: '',
              role: '',
              email: ''
            };
          });
          setNewArtistForms(initialFormState);
        }
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError('Failed to load artists. Please try again later.');
      toast.error('Failed to load artists');
      setArtists([]);
      setFilteredArtists([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchArtists();
    fetchCalendars();
    fetchRoleOptions();
  }, [fetchArtists, fetchCalendars, fetchRoleOptions]);

  // Toggle calendar expansion
  const toggleCalendarExpand = useCallback((calendar) => {
    setExpandedCalendars(prev => ({
      ...prev,
      [calendar]: !prev[calendar]
    }));
  }, []);

  // Group artists by calendar
  const artistsByCalendar = useMemo(() => {
    const filtered = searchTerm.trim() === '' 
      ? artists 
      : artists.filter(artist => 
          (artist.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (artist.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (artist.calendar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (artist.role || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.log(filtered);
        
    return filtered.reduce((acc, artist) => {
      const calendar = artist.calendar || 'Unbekannt';
      if (!acc[calendar]) {
        acc[calendar] = [];
      }
      acc[calendar].push(artist);
      return acc;
    }, {});
  }, [artists, searchTerm]);

  // Get all calendars with artists
  const calendarsWithArtists = useMemo(() => 
    Object.keys(artistsByCalendar).sort()
  , [artistsByCalendar]);

  // Count artists by role type
  const getRoleCounts = useMemo(() => {
    return artists.reduce((acc, artist) => {
      if (!artist.role) return acc;
      acc[artist.role] = (acc[artist.role] || 0) + 1;
      return acc;
    }, {});
  }, [artists]);

  // Count roles per calendar - new function
  const getRoleCountsByCalendar = useMemo(() => {
    return artists.reduce((acc, artist) => {
      if (!artist.calendar || !artist.role) return acc;
      
      if (!acc[artist.calendar]) {
        acc[artist.calendar] = {};
      }
      
      acc[artist.calendar][artist.role] = (acc[artist.calendar][artist.role] || 0) + 1;
      return acc;
    }, {});
  }, [artists]);

  // Check if a calendar has a match with the search term
  const calendarHasMatch = useCallback((calendar) => {
    return artistsByCalendar[calendar] && artistsByCalendar[calendar].length > 0;
  }, [artistsByCalendar]);

  // Get total filtered artists count
  const totalFilteredArtists = useMemo(() => 
    Object.values(artistsByCalendar).flat().length
  , [artistsByCalendar]);

  // Toggle add form for a specific calendar - updated to use the modal
  const toggleAddForm = useCallback((calendar, e) => {
    if (e) e.stopPropagation(); // Prevent calendar expansion toggle
    
    // Set the selected calendar and show the modal
    setSelectedCalendarForModal(calendar);
    setShowAddModal(true);
  }, []);

  // Add artist handler for the modal
  const handleAddArtistFromModal = async (artistData) => {
    try {
      // Validate form data
      if (!artistData.name || !artistData.role || !artistData.email) {
        toast.error('Bitte füllen Sie alle Felder aus');
        return;
      }
      
      const response = await api.post('/artist', artistData);
      
      if (response.data.status === 'success') {
        toast.success('Künstler erfolgreich hinzugefügt');
        setShowAddModal(false); // Close the modal
        fetchArtists(true); // Refresh the artists list
      } else {
        toast.error(response.data.message || 'Fehler beim Hinzufügen des Künstlers');
      }
    } catch (error) {
      console.error('Error adding artist:', error);
      toast.error('Fehler beim Hinzufügen des Künstlers: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete artist
  const handleDeleteConfirm = async () => {
    try {
      if (!selectedArtist) return;
      
      const response = await api.delete('/artist', {
        data: {
          calendar: selectedArtist.calendar,
          email: selectedArtist.email
        }
      });
      
      if (response.data.status === 'success') {
        setShowDeleteModal(false);
        toast.success('Künstler erfolgreich gelöscht');
        fetchArtists(true);
        setSelectedArtist(null);
      } else {
        toast.error(response.data.message || 'Fehler beim Löschen des Künstlers');
      }
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast.error('Fehler beim Löschen des Künstlers: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <DashboardLayout 
      setAuth={setAuth} 
      onRefresh={() => fetchArtists(true)}
    >
      <div className="artists-dashboard">
        {/* Header section with vertically centered heading and search bar */}
        <div className="transparent-header-container">
          <h1 className="dashboard-main-title">Künstler Management</h1>
          <div className="header-search-box">
            <SearchBox 
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Name, E-Mail, Rolle oder Kalender suchen..."
            />
          </div>
        </div>

        {/* Display error message if any */}
        {error && (
          <div className="alert alert-danger mb-4">{error}</div>
        )}

        {/* Artists Container */}
        <div className="artists-container">
          {loading ? (
            <DashboardLoader message="Künstler werden geladen..." />
          ) : totalFilteredArtists === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <i className="bi bi-person-x"></i>
              </div>
              <h4>{searchTerm ? 'Keine Ergebnisse gefunden.' : 'Keine Künstler gefunden.'}</h4>
              <p>{searchTerm ? 'Versuchen Sie einen anderen Suchbegriff.' : 'Klicken Sie auf "Künstler hinzufügen", um einen neuen Künstler hinzuzufügen.'}</p>
              {!searchTerm && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowAddModal(true)}
                >
                  Künstler hinzufügen
                </Button>
              )}
            </div>
          ) : (
            <PullToRefresh onRefresh={() => fetchArtists(true)} isPullable={isMobile}>
              {calendarsWithArtists.map((calendar) => (
                <div 
                  key={calendar} 
                  className={`artist-calendar-card ${!calendarHasMatch(calendar) && searchTerm ? 'filtered-out' : ''}`}
                >
                  <div 
                    className="calendar-header"
                    onClick={() => toggleCalendarExpand(calendar)}
                  >
                    <div className="header-content">
                      <div className="title-with-icon">
                        <h5 className="calendar-title">{calendar}</h5>
                        
                        <div className="dropdown-toggle-icon">
                          {expandedCalendars[calendar] ? 
                            <ChevronUp size={14} /> : 
                            <ChevronDown size={14} />
                          }
                        </div>
                        
                        {/* Role count badges after dropdown icon with spacing - hidden on mobile */}
                        {getRoleCountsByCalendar[calendar] && Object.entries(getRoleCountsByCalendar[calendar]).length > 0 && (
                          <div className="calendar-role-badges d-none d-md-flex">
                            {Object.entries(getRoleCountsByCalendar[calendar])
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3) // Show only top 3 roles
                              .map(([role, count]) => (
                                <Badge 
                                  key={role}
                                  bg={count > 5 ? "primary" : count > 2 ? "info" : "success"}
                                  className="enhanced-badge capsule-badge"
                                >
                                  {role} <span className="badge-count">{count}</span>
                                </Badge>
                              ))}
                            {Object.keys(getRoleCountsByCalendar[calendar]).length > 3 && (
                              <Badge bg="secondary" className="enhanced-badge capsule-badge">
                                +{Object.keys(getRoleCountsByCalendar[calendar]).length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <span className="artists-count d-none d-md-inline-block">
                        <span className="count-number">{artistsByCalendar[calendar].length}</span>
                        <span className="count-label">{artistsByCalendar[calendar].length === 1 ? ' Künstler' : ' Künstler'}</span>
                      </span>
                    </div>
                    
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="add-calendar-artist-btn"
                      onClick={(e) => toggleAddForm(calendar, e)}
                      title="Künstler hinzufügen"
                    >
                      <PersonPlus size={16} />
                    </Button>
                  </div>
                  
                  {expandedCalendars[calendar] && (
                    <div className="calendar-content">
                      {/* Calendar-specific add artist form */}
                      {openAddForms[calendar] && (
                        <div className="calendar-add-form">
                          <div className="form-header">
                            <h6>Neuen Künstler für {calendar} hinzufügen</h6>
                            <Button 
                              variant="link" 
                              className="close-form-btn"
                              onClick={(e) => toggleAddForm(calendar, e)}
                            >
                              <X size={20} />
                            </Button>
                          </div>
                          <Form className="calendar-artist-form">
                            <Form.Group className="mb-3">
                              <Form.Label>Name *</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Name des Künstlers eingeben"
                                value={newArtistForms[calendar]?.name || ''}
                                onChange={(e) => handleCalendarInputChange(calendar, 'name', e.target.value)}
                                required
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Rolle *</Form.Label>
                              <Form.Select
                                value={newArtistForms[calendar]?.role || ''}
                                onChange={(e) => handleCalendarInputChange(calendar, 'role', e.target.value)}
                                required
                              >
                                <option value="">Rolle auswählen</option>
                                {roleOptions && roleOptions.map((role, index) => (
                                  <option key={index} value={role}>{role}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>E-Mail *</Form.Label>
                              <Form.Control
                                type="email"
                                placeholder="E-Mail eingeben"
                                value={newArtistForms[calendar]?.email || ''}
                                onChange={(e) => handleCalendarInputChange(calendar, 'email', e.target.value)}
                                required
                              />
                            </Form.Group>
                            <div className="form-actions">
                              <Button 
                                variant="secondary" 
                                onClick={(e) => toggleAddForm(calendar, e)}
                                className="me-2"
                              >
                                Abbrechen
                              </Button>
                              <Button 
                                variant="primary" 
                                onClick={() => handleAddCalendarArtist(calendar)}
                              >
                                Hinzufügen
                              </Button>
                            </div>
                          </Form>
                        </div>
                      )}
                      
                      {/* Regular table for desktop */}
                      <div className="table-responsive d-none d-md-block">
                        <Table className="artists-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>E-Mail</th>
                              <th>Rolle</th>
                              <th>Aktion</th>
                            </tr>
                          </thead>
                          <tbody>
                            {artistsByCalendar[calendar].map((artist, index) => (
                              <tr key={index} className="artist-row">
                                <td className="artist-name">{artist.name}</td>
                                <td className="artist-email">{artist.email}</td>
                                <td className="artist-role">
                                  <Badge bg="light" text="dark" className="role-badge">
                                    {artist.role}
                                  </Badge>
                                </td>
                                <td className="artist-actions">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedArtist(artist);
                                      setShowDeleteModal(true);
                                    }}
                                    className="delete-btn"
                                  >
                                    <Trash className="me-1" />
                                    <span className="d-none d-lg-inline">Entfernen</span>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                      
                      {/* Mobile cards */}
                      <div className="artist-cards-container d-md-none">
                        {artistsByCalendar[calendar].map((artist, index) => (
                          <div key={index} className="artist-mobile-card">
                            <div className="artist-mobile-header">
                              <div className="artist-mobile-title">
                                {artist.name}
                              </div>
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
                              </div>
                              
                              <div className="artist-mobile-actions">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedArtist(artist);
                                    setShowDeleteModal(true);
                                  }}
                                  className="w-100"
                                >
                                  <Trash className="me-2" />
                                  Entfernen
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

      {/* Add the full-screen modal component */}
      <AddArtistModal
        showModal={showAddModal}
        setShowModal={setShowAddModal}
        selectedCalendar={selectedCalendarForModal}
        roleOptions={roleOptions}
        handleAddArtist={handleAddArtistFromModal}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Sind Sie sicher, dass Sie den Künstler "{selectedArtist?.name}" löschen möchten?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Abbrechen
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Löschen
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default ArtistsDashboard;