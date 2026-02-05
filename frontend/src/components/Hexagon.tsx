import React, { useState, useEffect } from 'react';

interface HexagonProps {
  q: number;
  r: number;
  x: number;
  y: number;
  color: string;
  ownerId: string | null;
  gangLogoSvg: string | null;
  isStolen: boolean;
  isClaimed: boolean;
  onClick: () => void;
  selected: boolean;
}

export default function Hexagon({
  q, r, x, y, color, ownerId, gangLogoSvg, isStolen, isClaimed, onClick, selected
}: HexagonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  // Flash animation on claim/steal
  useEffect(() => {
    if (isClaimed || isStolen) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 500); // 500ms flash
    }
  }, [isClaimed, isStolen]);

  // Pulse animation on hover
  useEffect(() => {
    if (isHovered) {
      setShowPulse(true);
      const interval = setInterval(() => {
        setShowPulse(prev => !prev);
      }, 500); // 500ms pulse interval
      return () => clearInterval(interval);
    } else {
      setShowPulse(false);
    }
  }, [isHovered]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const hexagonStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: '30px',
    height: '26px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    filter: `
      ${isHovered || selected ? 'brightness(1.3)' : 'brightness(1)'}
      ${showFlash ? 'drop-shadow(0 0 20px currentColor)' : ''}
      ${showPulse ? 'drop-shadow(0 0 10px currentColor)' : ''}
    `,
  };

  const innerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    backgroundColor: color,
    transition: 'all 0.3s ease',
    boxShadow: selected ? `0 0 15px ${color}, inset 0 0 10px ${color}4d` : 'none',
    border: selected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
    transform: showFlash ? 'scale(1.1)' : 'scale(1)',
  };

  const logoOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  return (
    <div
      style={hexagonStyle}
      className={`hexagon ${isStolen ? 'stolen' : ''} ${isClaimed ? 'claimed' : ''} ${isHovered ? 'hover' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gang Logo Overlay */}
      {gangLogoSvg && (
        <div style={logoOverlayStyle}>
          <div
            style={{
              width: '20px',
              height: '20px',
              filter: 'brightness(1.5) drop-shadow(0 0 3px rgba(0,0,0,0.5))',
            }}
            dangerouslySetInnerHTML={{ __html: gangLogoSvg }}
          />
        </div>
      )}

      {/* Inner Hexagon */}
      <div style={innerStyle} />

      {/* Stolen Indicator */}
      {isStolen && (
        <div className="stolen-indicator">
          <span>⚡</span>
        </div>
      )}
    </div>
  );
}
