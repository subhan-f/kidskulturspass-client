import React from 'react';

function LoadingSpinner({ 
  fullPage = true, 
  message = "Wird geladen...",
  progress = null,
  progressMessage = null
}) {
  const spinnerContent = (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
      
      {progress !== null && (
        <div className="polling-info mt-3" style={{ width: '100%', maxWidth: '300px' }}>
          <div className="progress mb-2" style={{ height: '8px' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
              role="progressbar" 
              style={{ width: `${Math.min(progress, 100)}%` }} 
              aria-valuenow={Math.min(progress, 100)}
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          {progressMessage && (
            <small className="text-muted">{progressMessage}</small>
          )}
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="loading-overlay">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

export default React.memo(LoadingSpinner);
