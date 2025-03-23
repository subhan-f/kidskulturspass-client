import React from 'react';
import { Spinner } from 'react-bootstrap';
import LoadingSpinner from './LoadingSpinner';

function MobileLoadingState({ message = "Wird geladen..." }) {
  // Single consistent implementation using the standard LoadingSpinner
  return (
    <div className="dashboard-loader-container">
      <LoadingSpinner message={message} fullPage={false} />
    </div>
  );
}

export default MobileLoadingState;
