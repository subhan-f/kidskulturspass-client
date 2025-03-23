import React from 'react';
import { createRoot } from 'react-dom/client';
import './scss/main.scss'; // Import main.scss first to ensure variables are loaded before Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import App from './App';
import ErrorBoundary from './ErrorBoundary';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Add global error handler for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});
