import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../utils/api";
import { LoadingSpinner } from "../components/common";
import { Eye, EyeSlash } from "react-bootstrap-icons"; // 👈 Eye icons
import { Spinner } from "react-bootstrap";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fullPageLoading, setFullPageLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 👈 New state for submission
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  // setLoading(true);
  setError("");
  setIsSubmitting(true);

  try {
    const res = await authApi.login({ username, password });
    
    // Get user info after successful login
    const userRes = await authApi.getMe();
    const user = userRes.data.user;

    if (onLogin) onLogin(user);
    
    // Redirect based on role
    const role = user.Role;
    console.log('Logged in user:', user);
    navigate(role === "Admin" ? "/artists" : "/user-assigned-dashboard");
  } catch (err) {
    console.error('Login error:', err);
    setError(
      err.response?.data?.message ||
      "Ungültige Anmeldeinformationen. Bitte überprüfen Sie Ihre Anmeldedaten."
    );
  } finally {
    setLoading(false);
    setIsSubmitting(false);
  }
};



  if (fullPageLoading) {
    return (
      <div className="page-container login-loading">
        <LoadingSpinner message="Anmeldung..." fullPage={true} />
      </div>
    );
  }

  return (
    <div className="login-page">
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
            <h1>Willkommen zurück</h1>
            <p className="login-subtitle">
              Melden Sie sich an, um auf das KidsKulturSpass Dashboard
              zuzugreifen
            </p>
          </div>

          {error && (
            <div className="login-alert">
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

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="username">E-Mail-Adresse</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ihre E-Mail-Adresse"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Passwort</label>
              <div
                className="input-wrapper password-wrapper"
                style={{ position: "relative" }}
              >
                <div className="input-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-icon"
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevents focus loss
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="forgot-password-link">
                <a
                  href="/forgot-password"
                  className="text-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/forgot-password");
                  }}
                >
                  Passwort vergessen?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${isSubmitting ? "loading" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Anmeldung...
                </>
              ) : (
                "Anmelden"
              )}
            </button>
          </form>

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

export default Login;
