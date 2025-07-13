import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar as BootstrapNavbar, Nav } from 'react-bootstrap';
import { BoxArrowRight } from 'react-bootstrap-icons';
import { authApi } from '../utils/api';

function Navbar({ setAuth }) {
  const [expanded, setExpanded] = useState(false);
  const [userRole, setUserRole] = useState(null);
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
    try {
      const res= await setAuth();
      consol.log('Logout response:', res);
    } catch (error) {
      console.error('Logout error', error);
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
                to="/user-dashboard"
                active={location.pathname === '/user-dashboard'}
                onClick={() => setExpanded(false)}
              >
                User Dashboard
              </Nav.Link>
            )}
          </Nav>

          <button className="logout-button" onClick={handleLogout}>
            <BoxArrowRight className="me-2" />
            <span>Abmelden</span>
          </button>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;
