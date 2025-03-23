import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { ExclamationTriangle } from 'react-bootstrap-icons';

/**
 * Reusable error message component with retry option
 */
function ErrorMessage({ message, retryFn }) {
  return (
    <Alert variant="danger" className="dashboard-alert d-flex align-items-center">
      <ExclamationTriangle className="me-2 flex-shrink-0" size={20} />
      <div className="flex-grow-1">
        {message}
      </div>
      {retryFn && (
        <Button 
          variant="outline-danger" 
          size="sm" 
          onClick={() => retryFn()}
          className="ms-2 flex-shrink-0"
        >
          Erneut versuchen
        </Button>
      )}
    </Alert>
  );
}

export default ErrorMessage;
