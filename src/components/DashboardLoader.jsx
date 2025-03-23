import React from 'react';
import LoadingSpinner from './LoadingSpinner'; // Changed from destructured import

/**
 * Standardized dashboard loading component to ensure consistent loading UI
 * across all dashboard pages
 */
function DashboardLoader({ 
  message = "Wird geladen...", 
  progress = null, 
  progressMessage = null,
  fullPage = false
}) {
  return (
    <div className="dashboard-loader-container">
      <LoadingSpinner
        message={message}
        progress={progress}
        progressMessage={progressMessage}
        fullPage={fullPage}
      />
    </div>
  );
}

export default DashboardLoader;
