import React, { useEffect, useRef, useState } from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import ArtistsDashboard from './pages/ArtistsDashboard';
import UnassignedEventsDashboard from './pages/UnassignedEventsDashboard';
import UserAssignedDashboard from './pages/UserAssignedDashboard';
import UserUnassignedDashboard from './pages/UserUnassignedDashboard';
import EmailListDashboard from './pages/EmailDashboard';
import WhatsAppListDashboard from './pages/WhatsAppListDashboard';
import EmailModal from './components/EmailModel';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import UnavailabilityDashboard from './pages/UnavailabilityDashboard';

import { authApi } from './utils/api';
import { initDebug } from './utils/debug';
import { LoadingSpinner } from './components/common';

import 'bootstrap/dist/css/bootstrap.min.css';
import { ARTIST_ROLES, ARTIST_DASHBOARD_ROUTES, ADMIN_DASHBOARD_ROUTES } from './constants/app.contants'


// Init debug
initDebug();

// Component that tracks first dashboard visit
function DashboardVisitTracker({ user }) {
  const location = useLocation();
  const visitTracked = useRef(false);

  useEffect(() => {
    if (!user) return;

    const path = location.pathname;

    const isArtistDashboard = ARTIST_DASHBOARD_ROUTES.some(route => path.startsWith(route));
    const isAdminDashboard = ADMIN_DASHBOARD_ROUTES.some(route => path.startsWith(route));

    if ((isArtistDashboard || isAdminDashboard) && !visitTracked.current) {
      authApi.trackVisit(user._id);
      visitTracked.current = true;
    }
  }, [location.pathname, user]);

  return null;
}

// AuthRoute wrapper
function AuthRoute({ children }) {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authApi.getMe();
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
    const redirectPath = user.Role === 'Admin' ? '/artists' : '/user-assigned-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

// ProtectedRoute wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authApi.getMe();
        const currentUser = res.data.user;
        if (allowedRoles.includes(currentUser.Role)) {
          setUser(currentUser);
        } else {
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

  return (
    <>
      <DashboardVisitTracker user={user} /> {/* 🔹 Track visit here */}
      {children}
    </>
  );
}

// ArtistOnlyRoute wrapper
function ArtistOnlyRoute({ children }) {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authApi.getMe();
        const currentUser = res.data.user;
        if (currentUser.Role !== 'Admin') {
          setUser(currentUser);
        } else {
          setUser(null);
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

  return (
    <>
      <DashboardVisitTracker user={user} />
      {children}
    </>
  );
}

// Role-based redirect
function RoleBasedRedirect() {
  const [authChecked, setAuthChecked] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/login');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await authApi.getMe();
        const role = res.data.user.Role;
        setRedirectPath(role === 'Admin' ? '/artists' : '/user-assigned-dashboard');
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
      window.location.href = '/login';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={
          <AuthRoute>
            <Login onLogin={setLoggedInUser} />
          </AuthRoute>
        } />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
        <Route path="/reset-password/:resetToken" element={<AuthRoute><ResetPassword /></AuthRoute>} />

        {/* Default route */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Admin-only routes */}
        <Route path="/artists" element={<ProtectedRoute allowedRoles={['Admin']}><ArtistsDashboard handleLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/emails" element={<ProtectedRoute allowedRoles={['Admin']}><EmailListDashboard handleLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/whatsapp" element={<ProtectedRoute allowedRoles={['Admin']}><WhatsAppListDashboard handleLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/unassigned-events" element={<ProtectedRoute allowedRoles={['Admin']}><UnassignedEventsDashboard handleLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/emails/:id" element={<ProtectedRoute allowedRoles={['Admin']}><EmailModal /></ProtectedRoute>} />

        {/* Artist-only routes */}
        <Route path="/user-assigned-dashboard" element={<ProtectedRoute allowedRoles={ARTIST_ROLES}><UserAssignedDashboard handleLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/user-unassigned-dashboard" element={<ProtectedRoute allowedRoles={ARTIST_ROLES}><UserUnassignedDashboard handleLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/unavailability-form" element={<ArtistOnlyRoute><UnavailabilityDashboard handleLogout={handleLogout} artistName={loggedInUser?.name} /></ArtistOnlyRoute>} />


        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
