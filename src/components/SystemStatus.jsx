import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SystemStatus.css';

function SystemStatus() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/system', { withCredentials: true });
        setSystemInfo(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load system information');
        console.error('Error fetching system info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="system-status loading">Loading system information...</div>;
  if (error) return <div className="system-status error">{error}</div>;
  if (!systemInfo) return null;

  return (
    <div className="system-status">
      <h2>System Status</h2>
      
      <div className="status-grid">
        <div className="status-card">
          <h3>Server</h3>
          <p><strong>Version:</strong> {systemInfo.version}</p>
          <p><strong>Environment:</strong> {systemInfo.env}</p>
          <p><strong>Uptime:</strong> {systemInfo.uptime}</p>
        </div>
        
        <div className="status-card">
          <h3>Platform</h3>
          <p><strong>Node.js:</strong> {systemInfo.node}</p>
          <p><strong>OS:</strong> {systemInfo.platform} ({systemInfo.arch})</p>
        </div>
        
        <div className="status-card">
          <h3>Resources</h3>
          <p><strong>CPU Model:</strong> {systemInfo.cpu.model}</p>
          <p><strong>CPU Cores:</strong> {systemInfo.cpu.cores}</p>
          <p><strong>Memory Total:</strong> {systemInfo.memory.total}</p>
          <p><strong>Memory Free:</strong> {systemInfo.memory.free}</p>
          <p><strong>Memory Usage:</strong> {systemInfo.memory.usage}</p>
        </div>
      </div>
    </div>
  );
}

export default SystemStatus;
