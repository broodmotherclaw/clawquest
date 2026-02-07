import React from 'react';

interface ZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

export const ZoomControl: React.FC<ZoomControlProps> = ({
  onZoomIn,
  onZoomOut,
  zoom
}) => {
  return (
    <div className="panel" style={{
      position: 'absolute',
      bottom: '10px',
      right: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <button
        className="button"
        onClick={onZoomIn}
        disabled={zoom >= 3}
        title="Zoom In"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          opacity: zoom >= 3 ? 0.5 : 1
        }}
      >
        +
      </button>
      <div className="text-primary" style={{ textAlign: 'center', fontSize: '12px' }}>
        {Math.round(zoom * 100)}%
      </div>
      <button
        className="button"
        onClick={onZoomOut}
        disabled={zoom <= 0.3}
        title="Zoom Out"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          opacity: zoom <= 0.5 ? 0.5 : 1
        }}
      >
        −
      </button>
    </div>
  );
};
