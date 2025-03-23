import React from 'react';
import { Table as BootstrapTable } from 'react-bootstrap';

/**
 * Simplified Table component that just adds consistent styling
 */
function Table({ children, className = '', ...props }) {
  return (
    <div className="table-container">
      <BootstrapTable className={`enhanced-table ${className}`} {...props}>
        {children}
      </BootstrapTable>
    </div>
  );
}

export default React.memo(Table);
