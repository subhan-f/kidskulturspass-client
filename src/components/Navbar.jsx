import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar as BootstrapNavbar, Nav } from 'react-bootstrap';
import { BoxArrowRight } from 'react-bootstrap-icons';
import api from '../utils/api';

function Navbar({ setAuth }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      setAuth(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };
  
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
              to="/history" 
              active={location.pathname === '/history'}
              onClick={() => setExpanded(false)}
            >
              Verlauf
            </Nav.Link>
          </Nav>
          
          <button 
            className="logout-button" 
            onClick={handleLogout}
          >
            <BoxArrowRight className="me-2" />
            <span>Abmelden</span>
          </button>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;