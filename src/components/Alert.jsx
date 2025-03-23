import React from 'react';
import { Alert as BootstrapAlert } from 'react-bootstrap';

/**
 * Simplified Alert component that just adds a consistent styling class
 */
function Alert({ children, className = '', ...props }) {
  return (
    <BootstrapAlert className={`enhanced-alert ${className}`} {...props}>
      {children}
    </BootstrapAlert>
  );
}

export default React.memo(Alert);
