import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'react-bootstrap-icons';

function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      // Show a brief "back online" message that auto-dismisses
      setTimeout(() => {
        setShowOffline(false);
      }, 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!showOffline) return null;
  
  return (
    <div className={`network-status-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="network-status-content">
        {isOnline ? (
          <>
            <Wifi size={16} className="network-icon" />
            <span>Wieder online</span>
          </>
        ) : (
          <>
            <WifiOff size={16} className="network-icon" />
            <span>Keine Internetverbindung</span>
          </>
        )}
      </div>
    </div>
  );
}

export default NetworkStatusIndicator;
