import React, { useState, useEffect } from 'react';
import { ArrowClockwise } from 'react-bootstrap-icons';

function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  
  const handleTouchStart = (e) => {
    // Only enable pull to refresh at the top of the page
    if (window.scrollY <= 5) {
      setStartY(e.touches[0].clientY);
    }
  };
  
  const handleTouchMove = (e) => {
    if (startY > 0 && window.scrollY <= 5) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;
      
      // Only allow pulling down
      if (distance > 0) {
        setPullDistance(Math.min(distance, 80));
        
        // Prevent default scrolling when pulling down
        if (distance > 10) {
          e.preventDefault();
        }
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      // Threshold met, trigger refresh
      setRefreshing(true);
      
      const refreshPromise = onRefresh();
      if (refreshPromise && typeof refreshPromise.then === 'function') {
        refreshPromise.finally(() => {
          setRefreshing(false);
          setPullDistance(0);
          setStartY(0);
        });
      } else {
        // If no promise returned, reset state after a timeout
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
          setStartY(0);
        }, 1000);
      }
    } else {
      setPullDistance(0);
      setStartY(0);
    }
  };
  
  useEffect(() => {
    // Add non-passive event listener to allow preventDefault
    const handleTouchMoveEvent = (e) => {
      if (startY > 0) {
        handleTouchMove(e);
      }
    };
    
    // Use passive: false to allow preventDefault in modern browsers
    document.addEventListener('touchmove', handleTouchMoveEvent, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMoveEvent, { passive: false });
      // Reset state to prevent memory leaks
      setRefreshing(false);
      setPullDistance(0);
      setStartY(0);
    };
  }, [startY]);
  
  return (
    <div
      id="pull-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {pullDistance > 0 && (
        <div 
          className="pull-to-refresh-indicator"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance / 80
          }}
        >
          <ArrowClockwise 
            className={refreshing ? 'spin' : ''} 
            size={24}
          />
          <span>{refreshing ? 'Wird aktualisiert...' : 'Zum Aktualisieren loslassen'}</span>
        </div>
      )}
      {children}
    </div>
  );
}

export default PullToRefresh;
