
// export default EmailDashboard;
import React, { useState, useEffect, useCallback, useMemo } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBox from "../components/SearchBox";
import DashboardLayout from "../components/DashboardLayout";
import EmailTable from "../components/EmailTable";
import { getEmails } from "../utils/api";

const EmailDashboard = ({ setAuth }) => {
  const [emailData, setEmailData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading emails...");
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch email data from API
  const fetchEmailData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getEmails();
        if (!data) {
        throw new Error(`HTTP error! status: ${data.status}`);
      }
      setEmailData(data);
    } catch (err) {
      console.error("Error fetching email data:", err);
      setError("Failed to load emails. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchEmailData();
  }, [fetchEmailData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setLoadingMessage("Refreshing emails...");
    fetchEmailData();
  }, [fetchEmailData]);

  // Filter emails based on search term
  const filteredEmails = useMemo(() => {
    if (!searchTerm) return emailData;
    return emailData.filter(
      (email) =>
        email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [emailData, searchTerm]);

  // Handle search change
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  if (loading) {
    return (
      <DashboardLayout setAuth={setAuth} pageTitle="Email Dashboard">
        <LoadingSpinner message={loadingMessage} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      setAuth={setAuth} 
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <div className="email-dashboard">
        {/* Header section with title and search bar */}
        <div className="transparent-header-container">
          <h1 className="dashboard-main-title">Email Dashboard</h1>
          <div className="header-search-box">
            <SearchBox
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Suche nach Emails, Empfänger, Betreff oder Typ"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        {error && (
          <div className="dashboard-alert error">
            {error}
          </div>
        )}

        {/* Main content */}
        {filteredEmails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <p className="empty-state-message">
              {searchTerm
                ? "No emails match your search criteria."
                : "No emails found."}
            </p>
          </div>
        ) : (
          <EmailTable emails={filteredEmails.data} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmailDashboard;