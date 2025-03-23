import React from 'react';
import { Card as BootstrapCard } from 'react-bootstrap';

/**
 * Simplified Card component that just adds consistent styling classes
 */
function Card({ children, className = '', ...props }) {
  return (
    <BootstrapCard className={`enhanced-card ${className}`} {...props}>
      {children}
    </BootstrapCard>
  );
}

export default React.memo(Card);
