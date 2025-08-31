import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import SearchBox from "../components/SearchBox";
import DashboardLoader from "../components/DashboardLoader";
import {
  Table,
  Button,
  Badge,
  Alert,
  Nav,
} from "react-bootstrap";
import {
  ChevronDown,
  ChevronUp,
  X,
  CalendarEvent,
} from "react-bootstrap-icons";

// ✅ Mock Data
const mockEvents = {
  open: [
    {
      id: 1,
      date: "2025-09-08",
      event: "Kindervilla Farbenzauber – Violin Concert",
      format: "Concert",
      location: "Frankfurt",
      fee: 110,
      status: "Open",
    },
    {
      id: 2,
      date: "2025-09-12",
      event: "City of Zella-Mehlis – Lantern Parade",
      format: "Parade",
      location: "Thüringen",
      fee: 150,
      status: "Open",
    },
  ],
  completed: [
    {
      id: 3,
      date: "2025-07-01",
      event: "Kita Sonnenblume – Violin Concert",
      format: "Concert",
      location: "Frankfurt",
      fee: 110,
      status: "Completed",
    },
    {
      id: 4,
      date: "2025-07-15",
      event: "Kita Regenbogen – Lantern Parade",
      format: "Parade",
      location: "Bad Vilbel",
      fee: 150,
      status: "Completed",
    },
  ],
  paid: [
    {
      id: 5,
      date: "2025-06-05",
      event: "Kita Glückspilz – Violin Concert",
      format: "Concert",
      location: "Offenbach",
      fee: 110,
      status: "Paid",
    },
    {
      id: 6,
      date: "2025-06-10",
      event: "Kita Kleiner Bär – Lantern Parade",
      format: "Parade",
      location: "Frankfurt",
      fee: 150,
      status: "Paid",
    },
  ],
};

function MyBalanceDashboard({ setAuth, fetchUnavailabilities, handleLogout }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const toggleExpand = () => setExpanded(!expanded);

  // ✅ Summary Calculation
  const summary = {
    open: mockEvents.open.reduce((sum, e) => sum + e.fee, 0),
    completed: mockEvents.completed.reduce((sum, e) => sum + e.fee, 0),
    paid: mockEvents.paid.reduce((sum, e) => sum + e.fee, 0),
  };

  const filteredEvents = mockEvents[activeTab].filter((event) =>
    event.event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Title mapping
  const tabTitles = {
    open: "Open Events",
    completed: "Completed Events",
    paid: "Paid Events",
  };

  return (
    <DashboardLayout
      setAuth={setAuth}
      onRefresh={fetchUnavailabilities}
      handleLogout={handleLogout}
    >
      <div className="unavailability-dashboard">
        {!loading && (
          <div className="transparent-header-container">
            <h1 className="dashboard-main-title">My Balance</h1>
            <div className="header-search-box">
              <SearchBox
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
              />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="dashboard-alert">
            {error}
          </Alert>
        )}

        {/* ✅ Summary Box */}
        <div className="summary-box-container">
          <div className="summary-box open-box">
            <h5>Open</h5>
            <p>{summary.open} €</p>
          </div>
          <div className="summary-box completed-box">
            <h5>Completed</h5>
            <p>{summary.completed} €</p>
          </div>
          <div className="summary-box paid-box">
            <h5>Paid</h5>
            <p>{summary.paid} €</p>
          </div>
        </div>

        {/* ✅ Tab Navigation */}
        <Nav
          variant="tabs"
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
        >
          <Nav.Item>
            <Nav.Link eventKey="open">Open Events</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="completed">Completed Events</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="paid">Paid Events</Nav.Link>
          </Nav.Item>
        </Nav>

        {/* ✅ Events Section */}
        <div className="events-container">
          {loading ? (
            <DashboardLoader message="Loading events..." />
          ) : (
            <div className="event-calendar-card">
              <div className="calendar-header" onClick={toggleExpand}>
                <div className="header-content">
                  <div className="title-with-icon">
                    <h5 className="calendar-title">{tabTitles[activeTab]}</h5>
                    <div className="dropdown-toggle-icon">
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                  <span className="events-count">
                    <Badge bg="primary" className="enhanced-badge capsule-badge">
                      Total <span className="badge-count">{filteredEvents.length}</span>
                    </Badge>
                  </span>
                </div>
              </div>

              {expanded && (
                <div className="calendar-content">
                  {filteredEvents.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <CalendarEvent size={48} />
                      </div>
                      <h4>No Events Found</h4>
                      <p>Try another search or wait for updates.</p>
                    </div>
                  ) : (
                    <>
                      {/* 💻 Desktop Table */}
                      <div className="table-responsive d-none d-md-block">
                        <Table className="events-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Event</th>
                              <th>Format</th>
                              <th>Location</th>
                              <th>Fee (€)</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEvents.map((event) => (
                              <tr key={event.id} className="event-row">
                                <td>
                                  {new Date(event.date).toLocaleDateString("de-DE")}
                                </td>
                                <td>{event.event}</td>
                                <td>{event.format}</td>
                                <td>{event.location}</td>
                                <td>{event.fee}</td>
                                <td>
                                  <Badge
                                    bg={
                                      event.status === "Open"
                                        ? "primary"
                                        : event.status === "Completed"
                                        ? "warning"
                                        : "success"
                                    }
                                  >
                                    {event.status}
                                  </Badge>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                  >
                                    Details
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>

                      {/* 📱 Mobile Cards */}
                      <div className="custom-mobile-cards-container d-md-none">
                        {filteredEvents.map((event) => (
                          <div key={event.id} className="custom-mobile-card">
                            <div className="custom-mobile-header">
                              <span className="custom-mobile-date">
                                {new Date(event.date).toLocaleDateString("de-DE")}
                              </span>
                              <Badge
                                bg={
                                  event.status === "Open"
                                    ? "primary"
                                    : event.status === "Completed"
                                    ? "warning"
                                    : "success"
                                }
                                className="custom-badge"
                              >
                                {event.status}
                              </Badge>
                            </div>
                            <div className="custom-mobile-body">
                              <h6>{event.event}</h6>
                              <p>
                                {event.format} • {event.location}
                              </p>
                              <p className="fw-bold">{event.fee} €</p>
                              <div className="custom-mobile-actions">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="custom-btn me-2"
                                >
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default MyBalanceDashboard;
