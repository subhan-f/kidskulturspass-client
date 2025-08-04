import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import ArtistsDashboard from './pages/ArtistsDashboard';
import UserDashboard from './pages/UserAssignedDashboard';
import UnassignedEventsDashboard from './pages/UnassignedEventsDashboard';
import EmailListDashboard from './pages/EmailDashboard';
import WhatsAppListDashboard from './pages/WhatsAppListDashboard';
import EmailModal from './components/EmailModel';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Navbar from './components/Navbar';
import UnavailabilityDashboard from './pages/UnavailabilityDashboard'; // Add this import

import { authApi } from './utils/api';
import { initDebug } from './utils/debug';
import LoadingSpinner from './components/LoadingSpinner';

import 'bootstrap/dist/css/bootstrap.min.css';
import UserAssignedDashboard from './pages/UserAssignedDashboard';
import UserUnassignedDashboard from './pages/UserUnassignedDashboard';

// Init debug
initDebug();

// Define artist roles in a constant for easier maintenance
const ARTIST_ROLES = [
  "Geiger*in", 
  "Moderator*in", 
  "Pianist*in", 
  "Instrumentalist*in", 
  "Nikolaus", 
  "Puppenspieler*in", 
  "Detlef", 
  "Sängerin*in"
];

// AuthRoute wrapper component - prevents logged-in users from accessing auth routes
function AuthRoute({ children }) {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authApi.getMe();
        console.log(res.data.user);
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (!authChecked) {
    return <LoadingSpinner message="Authentifizierung wird überprüft..." fullPage />;
  }

  if (user) {
    // Redirect based on user role
    const redirectPath = user.Role === 'Admin' ? '/artists' : '/user-assigned-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

// ProtectedRoute wrapper component
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authApi.getMe();
        const currentUser = res.data.user;
        console.log(res.data.user);
        setUser(currentUser);

        if (!allowedRoles.includes(currentUser.Role)) {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [location.pathname, allowedRoles]);

  if (!authChecked) {
    return <LoadingSpinner message="Authentifizierung wird überprüft..." fullPage />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ArtistOnlyRoute wrapper component - specifically for artist-only routes
function ArtistOnlyRoute({ children }) {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authApi.getMe();
        const currentUser = res.data.user;
        setUser(currentUser);

        // Explicitly check if the user is an admin
        if (currentUser.Role === 'Admin') {
          setUser(null); // Treat admin as unauthorized for artist-only routes
        }
      } catch {
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (!authChecked) {
    return <LoadingSpinner message="Authentifizierung wird überprüft..." fullPage />;
  }

  if (!user || !ARTIST_ROLES.includes(user.Role)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Role-based default redirect component
function RoleBasedRedirect() {
  const [authChecked, setAuthChecked] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/login');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await authApi.getMe();
        const role = res.data.user.Role;
        console.log(res.data.user);
        if (role === 'Admin') {
          setRedirectPath('/artists');
        } else {
          setRedirectPath('/user-assigned-dashboard');
        }
      } catch {
        setRedirectPath('/login');
      } finally {
        setAuthChecked(true);
      }
    };

    checkUser();
  }, []);

  if (!authChecked) {
    return <LoadingSpinner message="Redirecting..." fullPage />;
  }

  return <Navigate to={redirectPath} replace />;
}

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.clear();
      setLoggedInUser(null);
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = '/login'; // Full reload to clear all state
    }
  };

  return (
    <Router>
      <Routes>
        {/* Auth routes - only accessible when NOT logged in */}
        <Route path="/login" element={
          <AuthRoute>
            <Login onLogin={setLoggedInUser} />
          </AuthRoute>
        } />
        <Route path="/forgot-password" element={
          <AuthRoute>
            <ForgotPassword />
          </AuthRoute>
        } />
        <Route path="/reset-password/:resetToken" element={
          <AuthRoute>
            <ResetPassword />
          </AuthRoute>
        } />

        {/* Default route (role-based redirect) */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Admin-only routes */}
        <Route
          path="/artists"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ArtistsDashboard handleLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <EmailListDashboard handleLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/whatsapp"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <WhatsAppListDashboard handleLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/unassigned-events"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UnassignedEventsDashboard handleLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/emails/:id"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <EmailModal />
            </ProtectedRoute>
          }
        />

        {/* Artist-only routes */}
        <Route
          path="/user-assigned-dashboard"
          element={
            <ProtectedRoute allowedRoles={ARTIST_ROLES}>
              <UserAssignedDashboard handleLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-unassigned-dashboard"
          element={
            <ProtectedRoute allowedRoles={ARTIST_ROLES}>
              <UserUnassignedDashboard handleLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/unavailability-form"
          element={
            <ArtistOnlyRoute>
              <UnavailabilityDashboard handleLogout={handleLogout} artistName={loggedInUser?.name} />
            </ArtistOnlyRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;