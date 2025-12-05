// components/CustomTooltip.js
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const CustomTooltip = ({
  show,
  target,
  children,
  placement = "top",
  variant = "dark",
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef();

  useEffect(() => {
    if (show && target) {
      const rect = target.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current
        ? tooltipRef.current.offsetHeight
        : 0;

      let top = 0;
      let left = rect.left + rect.width / 2;

      if (placement === "top") {
        top = rect.top - tooltipHeight - 8;
      } else if (placement === "bottom") {
        top = rect.bottom + 8;
      }

      setPosition({ top, left });
    }
  }, [show, target, placement]);

  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      className={`custom-tooltip custom-tooltip-${variant}`}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
    >
      {children}
      <div className="custom-tooltip-arrow"></div>
    </div>,
    document.body
  );
};

export default CustomTooltip;