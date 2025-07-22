import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar as BootstrapNavbar, Nav, Spinner } from 'react-bootstrap';
import { BoxArrowRight } from 'react-bootstrap-icons';
import { authApi } from '../utils/api';

function Navbar({ setAuth }) {
  const [expanded, setExpanded] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state for logout loading
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch user role on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getMe();
        setUserRole(res.data.user.Role);
      } catch (error) {
        console.error('Failed to get user info:', error);
        setAuth(false);
        navigate('/login');
      }
    };

    fetchUser();
  }, [setAuth, navigate]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double click
    
    setIsLoggingOut(true); // Set loading state
    try {
      await authApi.logout(); // Make sure to call the actual logout API
      setAuth(false);
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Logout error', error);
      // Even if logout fails, we should still clear auth state
      setAuth(false);
      localStorage.clear();
      navigate('/login');
    } finally {
      setIsLoggingOut(false); // Reset loading state
    }
  };

  const isAdmin = userRole === 'Admin';

  return (
    <BootstrapNavbar expanded={expanded} expand="lg" fixed="top" bg="white" className="navbar-main">
      <Container className="d-flex align-items-center">
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="https://eor5ian77se.exactdn.com/wp-content/uploads/elementor/thumbs/Logo-pwgenx7648rlkrgzrcnygabjyp4ih47iofjornqrvq.webp?lossy=0&ssl=1"
            alt="KidsKulturSpass Logo"
            className="navbar-logo"
          />
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(!expanded)} 
        />

        <BootstrapNavbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          <Nav className="mr-auto">
            {isAdmin && (
              <>
                <Nav.Link
                  as={Link}
                  to="/"
                  active={location.pathname === '/'}
                  onClick={() => setExpanded(false)}
                >
                  Künstler
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/unassigned-events"
                  active={location.pathname === '/unassigned-events'}
                  onClick={() => setExpanded(false)}
                >
                  Veranstaltungen
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/emails"
                  active={location.pathname === '/emails'}
                  onClick={() => setExpanded(false)}
                >
                  Email Versand
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/whatsapp"
                  active={location.pathname === '/whatsapp'}
                  onClick={() => setExpanded(false)}
                >
                  Whatsapp Versand
                </Nav.Link>
              </>
            )}

            {!isAdmin && (
              <Nav.Link
                as={Link}
                to="/user-assigned-dashboard"
                active={location.pathname === '/user-assigned-dashboard'}
                onClick={() => setExpanded(false)}
              >
                Meine Events
              </Nav.Link>
            )}
            {!isAdmin && (
              <Nav.Link
                as={Link}
                to="/user-unassigned-dashboard"
                active={location.pathname === '/user-unassigned-dashboard'}
                onClick={() => setExpanded(false)}
              >
                Neue Jobs
              </Nav.Link>
            )}
          </Nav>

          <button 
            className="logout-button" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                <span>Abmeldung...</span>
              </>
            ) : (
              <>
                <BoxArrowRight className="me-2" />
                <span>Abmelden</span>
              </>
            )}
          </button>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;