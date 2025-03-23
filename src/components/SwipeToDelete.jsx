import React, { useState, useRef, useEffect } from 'react';
import { Trash } from 'react-bootstrap-icons';

function SwipeToDelete({ onDelete, children, threshold = 100 }) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const elementRef = useRef(null);
  
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };
  
  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    
    const x = e.touches[0].clientX;
    const diff = x - startX;
    
    // Only allow swipe left (negative direction)
    if (diff < 0) {
      // Add resistance to make swipe feel more natural
      const resistance = 0.8;
      const resistedDiff = diff * resistance;
      
      setCurrentX(resistedDiff);
      
      if (elementRef.current) {
        elementRef.current.style.transform = `translateX(${resistedDiff}px)`;
      }
    }
  };
  
  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (Math.abs(currentX) > threshold) {
      // Swipe threshold met, trigger delete with animation
      if (elementRef.current) {
        // Apply 3D transform for GPU acceleration
        elementRef.current.style.transform = `translate3d(-100%, 0, 0)`;
        elementRef.current.style.opacity = '0';
        
        // Add haptic feedback if available
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
        
        // Add a small delay for animation to complete
        setTimeout(() => {
          onDelete();
        }, 300);
      }
    } else {
      // Reset position with animation
      if (elementRef.current) {
        elementRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
    }
    
    setCurrentX(0);
  };
  
  // Reset on unmount
  useEffect(() => {
    return () => {
      setIsSwiping(false);
      setCurrentX(0);
    };
  }, []);
  
  return (
    <div className="swipe-container">
      <div
        ref={elementRef}
        className="swipe-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: 'translate3d(0, 0, 0)', // Initial 3D transform for GPU acceleration
          transition: isSwiping ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        }}
      >
        {children}
      </div>
      
      <div 
        className="swipe-action delete-action"
        style={{
          opacity: Math.min(Math.abs(currentX) / threshold, 1),
          transform: 'translate3d(0, 0, 0)' // 3D transform for GPU acceleration
        }}
      >
        <Trash size={20} />
        <span>Löschen</span>
      </div>
    </div>
  );
}

export default SwipeToDelete;
