import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../utils/api";
import { LoadingSpinner } from "../../components/common";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fullPageLoading, setFullPageLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFullPageLoading(true);
    setError("");
    setSuccess("");

    try {
      // Send password reset request
      const res = await authApi.forgotPassword({ email });
      console.log("Forgot password response:", res);

      if (res.data.status === "success") {
        setSuccess(
          "Eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts wurde gesendet."
        );
        setEmail(""); // Clear the email field
      }
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data.message ||
            "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
        );
      } else if (err.request) {
        setError(
          "Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung."
        );
      } else {
        setError(
          "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
        );
      }
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

  return (
    <div className="login-page bb">
      <div className={`login-container ${mounted ? "login-mounted" : ""}`}>
        <div className="login-content">
          <div className="login-header">
            <div className="login-logo-container">
              <img
                src="https://eor5ian77se.exactdn.com/wp-content/uploads/elementor/thumbs/Logo-pwgenx7648rlkrgzrcnygabjyp4ih47iofjornqrvq.webp?lossy=0&ssl=1"
                alt="KidsKulturSpass Logo"
                className="login-logo"
              />
            </div>
            <h1>Passwort vergessen</h1>
            <p className="login-subtitle">
              Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen
              Ihres Passworts zu erhalten
            </p>
          </div>
          {error && (
            <div className="login-alert error">
              <div className="login-alert-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                </svg>
              </div>
              <p>{error}</p>
            </div>
          )}
 
          {success && (
            <div className="login-alert success">
              <div className="login-alert-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                </svg>
              </div>
              <p style={{color:"green"}}>{success}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="email">E-Mail-Adresse</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ihre E-Mail-Adresse"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  <span>Wird gesendet...</span>
                </>
              ) : (
                "Passwort zurücksetzen"
              )}
            </button>
          </form>
          <div className="forgot-password-link">
            <a
              href="/login"
              className="text-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Zurück zur Anmeldung
            </a>
          </div>
          <div className="login-footer">
            <p>KidsKulturSpass Management Dashboard</p>
            <p className="copyright">
              &copy; {new Date().getFullYear()} KidsKulturSpass
            </p>
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

export default ForgotPassword;
