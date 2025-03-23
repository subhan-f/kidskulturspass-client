import React, { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { ArrowRepeat } from 'react-bootstrap-icons';

function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  
  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      let refreshing = false;
      
      // Handle new updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      
      // Check for updates
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (!registration) return;
          
          // Check if update is available
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          });
          
          // Trigger update check
          registration.update();
        } catch (error) {
          console.error('Service worker update check error:', error);
        }
      };
      
      // Initial check and periodic check
      checkForUpdates();
      const interval = setInterval(checkForUpdates, 60 * 60 * 1000); // Check hourly
      
      return () => clearInterval(interval);
    }
  }, []);
  
  const handleUpdate = () => {
    window.location.reload();
  };
  
  if (!showUpdate) return null;
  
  return (
    <Alert variant="info" className="update-notification">
      <div className="update-content">
        <span>Eine neue Version ist verfügbar</span>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={handleUpdate}
          className="update-button"
        >
          <ArrowRepeat size={16} className="me-1" />
          Aktualisieren
        </Button>
      </div>
    </Alert>
  );
}

export default UpdateNotification;
