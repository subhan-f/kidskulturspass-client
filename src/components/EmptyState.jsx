import React from 'react';

/**
 * Reusable empty state component
 */
function EmptyState({ 
  icon, 
  title, 
  message, 
  action, 
  className = '' 
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <i className={icon}></i>
      </div>
      <h4>{title}</h4>
      <p>{message}</p>
      {action}
    </div>
  );
}

export default EmptyState;
