import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ArtistsDashboard from './pages/ArtistsDashboard';
import UnassignedEventsDashboard from './pages/UnassignedEventsDashboard';
import HistoryDashboard from './pages/HistoryDashboard';
import { initDebug } from './utils/debug';
import 'bootstrap/dist/css/bootstrap.min.css';

// Initialize debug utilities only in development
initDebug();

function App() {
  // Simplified dummy logout function that does nothing
  const handleLogout = () => {
    console.log('Logout clicked (disabled in demo mode)');
  };
  
  
  return (
    <Router>
      <Routes>
        {/* Direct access to all routes without authentication */}
        <Route path="/" element={<ArtistsDashboard setAuth={handleLogout} />} />
        <Route path="/unassigned-events" element={<UnassignedEventsDashboard setAuth={handleLogout} />} />
        <Route path="/history" element={<HistoryDashboard setAuth={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
