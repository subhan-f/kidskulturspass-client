import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

function ResetPassword() {
  const { resetToken } = useParams();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullPageLoading, setFullPageLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFullPageLoading(true);
    setError('');

    if (password !== passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      setLoading(false);
      setFullPageLoading(false);
      return;
    }

    try {
      await authApi.resetPassword(resetToken, { password, passwordConfirm });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Passwort zurücksetzen fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
      setFullPageLoading(false);
    }
  };

  if (fullPageLoading) {
    return (
      <div className="page-container login-loading">
        <LoadingSpinner message="Anfrage wird verarbeitet..." fullPage={true} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className={`login-container ${mounted ? 'login-mounted' : ''}`}>
          <div className="login-content">
            <div className="login-header">
              <div className="login-logo-container">
                <img
                  src="https://eor5ian77se.exactdn.com/wp-content/uploads/elementor/thumbs/Logo-pwgenx7648rlkrgzrcnygabjyp4ih47iofjornqrvq.webp?lossy=0&ssl=1"
                  alt="KidsKulturSpass Logo"
                  className="login-logo"
                />
              </div>
              <h1>Passwort erfolgreich zurückgesetzt!</h1>
              <p className="login-subtitle">
                Ihr Passwort wurde erfolgreich aktualisiert. Sie werden zur Anmeldeseite weitergeleitet...
              </p>
            </div>

            <div className="login-alert success">
              <div className="login-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
              </div>
              <p>Ihr Passwort wurde erfolgreich aktualisiert!</p>
            </div>

            <div className="login-footer">
              <p>KidsKulturSpass Management Dashboard</p>
              <p className="copyright">&copy; {new Date().getFullYear()} KidsKulturSpass</p>
            </div>
          </div>
        </div>

        <div className="login-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
          <div className="decoration-pattern"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className={`login-container ${mounted ? 'login-mounted' : ''}`}>
        <div className="login-content">
          <div className="login-header">
            <div className="login-logo-container">
              <img
                src="https://eor5ian77se.exactdn.com/wp-content/uploads/elementor/thumbs/Logo-pwgenx7648rlkrgzrcnygabjyp4ih47iofjornqrvq.webp?lossy=0&ssl=1"
                alt="KidsKulturSpass Logo"
                className="login-logo"
              />
            </div>
            <h1>Passwort zurücksetzen</h1>
            <p className="login-subtitle">
              Bitte geben Sie Ihr neues Passwort unten ein
            </p>
          </div>

          {error && (
            <div className="login-alert error">
              <div className="login-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
              </div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="password">Neues Passwort</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Neues Passwort"
                  required
                  minLength="8"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="passwordConfirm">Passwort bestätigen</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  </svg>
                </div>
                <input
                  type="password"
                  id="passwordConfirm"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Passwort bestätigen"
                  required
                  minLength="8"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  <span>Wird verarbeitet...</span>
                </>
              ) : (
                'Passwort zurücksetzen'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>KidsKulturSpass Management Dashboard</p>
            <p className="copyright">&copy; {new Date().getFullYear()} KidsKulturSpass</p>
          </div>
        </div>
      </div>

      <div className="login-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
        <div className="decoration-pattern"></div>
      </div>
    </div>
  );
}

export default ResetPassword;