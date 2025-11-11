import React from 'react';
import { Button } from 'react-bootstrap';
import { ExclamationTriangleFill } from 'react-bootstrap-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorDetails: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorDetails: error,
      errorInfo: errorInfo
    });
    
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // You could send this to Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">
              <ExclamationTriangleFill size={64} color="#dc3545" />
            </div>
            <h1>Es ist ein Fehler aufgetreten</h1>
            <p>Es tut uns leid, aber es ist ein Problem aufgetreten. Das Team wurde benachrichtigt.</p>
            <div className="error-actions">
              <Button 
                variant="primary"
                onClick={() => window.location.reload()}
                className="me-3"
              >
                Seite neu laden
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => window.location.href = '/'}
              >
                Zur Startseite
              </Button>
            </div>
            
            {process.env.NODE_ENV !== 'production' && (
              <details className="error-details">
                <summary>Technische Details</summary>
                <pre>{this.state.errorDetails && this.state.errorDetails.toString()}</pre>
                <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
