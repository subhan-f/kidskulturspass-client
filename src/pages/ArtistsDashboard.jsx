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
import AddArtistModal from '../components/AddArtistModal';

const ArtistsDashboard = ({ setAuth }) => {
  // State for artists and UI
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCalendars, setExpandedCalendars] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCalendarForModal, setSelectedCalendarForModal] = useState('');
  const [openAddForms, setOpenAddForms] = useState({});
  const [calendars, setCalendars] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [newArtistForms, setNewArtistForms] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const fetchCalendars = useCallback(async () => {
    try {
      const response = await api.get('/calendars');
      setCalendars(response.data || []);
    } catch (err) {
      console.error('Error fetching calendars:', err);
      setCalendars([]);
    }
  }, []);

  const fetchRoleOptions = useCallback(async () => {
    try {
      const response = await api.get('/roleOptions');
      setRoleOptions(response.data || []);
    } catch (err) {
      console.error('Error fetching role options:', err);
      setRoleOptions([]);
    }
  }, []);

  const fetchArtists = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/artists');
      response.data = response.data.map(artist => ({
        name: artist.Name,
        calendar: artist.Calendar,
        email: artist["E-Mail"],
        role: artist.Role
      }));
      
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
          const uniqueCalendars = [...new Set(artistData.map(artist => artist.calendar))];
          const initialExpandState = {};
          uniqueCalendars.forEach(cal => {
            initialExpandState[cal] = true;
          });
          setExpandedCalendars(initialExpandState);
          
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

  useEffect(() => {
    fetchArtists();
    fetchCalendars();
    fetchRoleOptions();
  }, [fetchArtists, fetchCalendars, fetchRoleOptions]);

  const toggleCalendarExpand = useCallback((calendar) => {
    setExpandedCalendars(prev => ({
      ...prev,
      [calendar]: !prev[calendar]
    }));
  }, []);

  const artistsByCalendar = useMemo(() => {
    const filtered = searchTerm.trim() === '' 
      ? artists 
      : artists.filter(artist => 
          (artist.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (artist.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (artist.calendar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (artist.role || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        
    return filtered.reduce((acc, artist) => {
      const calendar = artist.calendar || 'Unbekannt';
      if (!acc[calendar]) {
        acc[calendar] = [];
      }
      acc[calendar].push(artist);
      return acc;
    }, {});
  }, [artists, searchTerm]);

  const calendarsWithArtists = useMemo(() => 
    Object.keys(artistsByCalendar).sort()
  , [artistsByCalendar]);

  const getRoleCounts = useMemo(() => {
    return artists.reduce((acc, artist) => {
      if (!artist.role) return acc;
      acc[artist.role] = (acc[artist.role] || 0) + 1;
      return acc;
    }, {});
  }, [artists]);

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

  const calendarHasMatch = useCallback((calendar) => {
    return artistsByCalendar[calendar] && artistsByCalendar[calendar].length > 0;
  }, [artistsByCalendar]);

  const totalFilteredArtists = useMemo(() => 
    Object.values(artistsByCalendar).flat().length
  , [artistsByCalendar]);

  const toggleAddForm = useCallback((calendar, e) => {
    if (e) e.stopPropagation();
    setSelectedCalendarForModal(calendar);
    setTimeout(() => setShowAddModal(true), 0);
    setSelectedRoles([...new Set(artistsByCalendar[calendar].map(artist => artist.role))]);
  }, [artistsByCalendar]);

  const handleAddArtistFromModal = async (artistData) => {
    try {
      if (!artistData.name || !artistData.role || !artistData.email) {
        toast.error('Bitte füllen Sie alle Felder aus');
        return;
      }
      artistData = {
        Calendar: artistData.calendar,
        Name: artistData.name,
        Role: artistData.role,
        email: artistData.email
      };
      
      const response = await api.post('/artist', artistData);
      setShowAddModal(false);
      fetchArtists(true);
      
      if (response.data.status === 'success') {
        toast.success('Künstler erfolgreich hinzugefügt');
      } else {
        toast.error(response.data.message || 'Fehler beim Hinzufügen des Künstlers');
      }
    } catch (error) {
      console.error('Error adding artist:', error);
      toast.error('Fehler beim Hinzufügen des Künstlers: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!selectedArtist || isDeleting) return;
      
      setIsDeleting(true);
      const response = await api.delete('/artist', {
        data: {
          calendar: selectedArtist.calendar,
          email: selectedArtist.email
        }
      });
      
      fetchArtists(true);
      setShowDeleteModal(false);
      setSelectedArtist(null);
      if (response.data.status === 'success') {
        toast.success('Künstler erfolgreich gelöscht');
      } else {
        toast.error(response.data.message || 'Fehler beim Löschen des Künstlers');
      }
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast.error('Fehler beim Löschen des Künstlers: ' + (error.response?.data?.message || error.message));
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
    >
      <div className="artists-dashboard">
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

        {error && (
          <div className="alert alert-danger mb-4">{error}</div>
        )}

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
                        
                        {getRoleCountsByCalendar[calendar] && Object.entries(getRoleCountsByCalendar[calendar]).length > 0 && (
                          <div className="calendar-role-badges d-none d-md-flex">
                            {Object.entries(getRoleCountsByCalendar[calendar])
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3)
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
                      onClick={(e) => {
                        setSelectedRoles([...new Set(artistsByCalendar[calendar].map(artist => artist.role))]);
                        toggleAddForm(calendar, e);
                      }}
                      title="Künstler hinzufügen"
                    >
                      <PersonPlus size={16} />
                    </Button>
                  </div>
                  
                  {expandedCalendars[calendar] && (
                    <div className="calendar-content">
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

      <AddArtistModal
        fetchArtists={fetchArtists}
        showModal={showAddModal}
        setShowModal={setShowAddModal}
        roles={selectedRoles}
        selectedRoles={selectedRoles}
        selectedCalendar={selectedCalendarForModal}
        handleAddArtist={handleAddArtistFromModal}
        roleOptions={roleOptions}
      />

      <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Löschen bestätigen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Sind Sie sicher, dass Sie den Künstler "{selectedArtist?.name}" löschen möchten?
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
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Löschen...</span>
              </>
            ) : 'Löschen'}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default ArtistsDashboard;