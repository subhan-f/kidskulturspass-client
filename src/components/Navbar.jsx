import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar as BootstrapNavbar, Nav, Spinner } from 'react-bootstrap';
import { BoxArrowRight } from 'react-bootstrap-icons';
import { authApi } from '../utils/api';

function Navbar({ handleLogout }) {
  const [expanded, setExpanded] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch user role on mount and when location changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await authApi.getMe();
        if (isMounted) {
          setUserRole(res.data.user.Role);
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
        navigate('/login');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [navigate, location.pathname]);

  const handleLogoutClick = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await handleLogout();
  };

  // Don't render anything until we know the user role
  if (loading) {
    return null;
  }

  const isAdmin = userRole === 'Admin';

  return (
    <BootstrapNavbar expanded={expanded} expand="lg" fixed="top" bg="white" className="navbar-main">
      <Container className="d-flex align-items-center">
        <BootstrapNavbar.Brand as={Link} to={isAdmin ? "/" : "/user-assigned-dashboard"} className="d-flex align-items-center">
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
            {isAdmin ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/artists"
                  active={location.pathname === '/artists'}
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
            ) : (
              <>
                <Nav.Link
                  as={Link}
                  to="/user-assigned-dashboard"
                  active={location.pathname === '/user-assigned-dashboard'}
                  onClick={() => setExpanded(false)}
                >
                  Meine Events
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/user-unassigned-dashboard"
                  active={location.pathname === '/user-unassigned-dashboard'}
                  onClick={() => setExpanded(false)}
                >
                  Neue Jobs
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/unavailability-form"
                  active={location.pathname === '/unavailability-form'}
                  onClick={() => setExpanded(false)}
                >
                  Sperrtermine
                </Nav.Link>
              </>
            )}
          </Nav>

          <button 
            className="logout-button" 
            onClick={handleLogoutClick}
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