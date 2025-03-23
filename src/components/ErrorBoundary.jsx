import React, { Component } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { ArrowClockwise } from 'react-bootstrap-icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <Alert variant="danger">
            <Alert.Heading>Etwas ist schief gelaufen</Alert.Heading>
            <p>Es ist ein Fehler aufgetreten. Bitte versuchen Sie, die Seite neu zu laden.</p>
            {this.state.error && (
              <details>
                <summary>Fehlerdetails</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <hr />
            <div className="d-flex justify-content-end">
              <Button 
                variant="outline-danger"
                onClick={this.resetError}
              >
                <ArrowClockwise className="me-1" /> Neu laden
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
