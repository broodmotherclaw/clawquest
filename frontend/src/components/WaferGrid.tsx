import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Wafer {
  id: number;
  value: number;
  x: number;
  y: number;
}

interface WaferGridProps {
  wafers: Wafer[];
  onWaferClick: (wafer: Wafer) => void;
  selectedWafer: Wafer | null;
  wafersPerRow: number;
}

const GRID_SIZE = 75; // 75x75 = 5625 Wafer (genug für 5000+)

export default function WaferGrid({ wafers, onWaferClick, selectedWafer, wafersPerRow }: WaferGridProps) {
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  // Navigationsfunktionen
  const navigate = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 5; // Pixel pro Schritt
    setViewportOffset(prev => {
      const newOffset = { ...prev };
      
      switch (direction) {
        case 'up':
          newOffset.y = Math.max(0, prev.y - step);
          break;
        case 'down':
          newOffset.y = Math.min(GRID_SIZE * 30 - 600, prev.y + step); // Max Scroll
          break;
        case 'left':
          newOffset.x = Math.max(0, prev.x - step);
          break;
        case 'right':
          newOffset.x = Math.min(GRID_SIZE * 30 - 800, prev.x + step); // Max Scroll
          break;
      }
      
      return newOffset;
    });
  };

  // Scroll mit Mausrad
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scrollSpeed = 0.5;
    
    setViewportOffset(prev => ({
      x: Math.max(0, Math.min(GRID_SIZE * 30 - 800, prev.x - e.deltaX * scrollSpeed)),
      y: Math.max(0, Math.min(GRID_SIZE * 30 - 600, prev.y - e.deltaY * scrollSpeed))
    }));
  };

  // Drag handling
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setViewportOffset(prev => ({
      x: Math.max(0, Math.min(GRID_SIZE * 30 - 800, prev.x + dx)),
      y: Math.max(0, Math.min(GRID_SIZE * 30 - 600, prev.y + dy))
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          navigate('up');
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          navigate('down');
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          navigate('left');
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          navigate('right');
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Generate grid
  const generateGrid = () => {
    const grid: React.ReactNode[] = [];
    const chipSize = 24;
    const gap = 4;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const wafer = wafers[row * wafersPerRow + col];
        
        if (!wafer) continue;
        
        const x = col * (chipSize + gap);
        const y = row * (chipSize + gap);
        
        const isSelected = selectedWafer?.id === wafer.id;
        
        grid.push(
          <motion.div
            key={wafer.id}
            className={`wafer ${isSelected ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: chipSize,
              height: chipSize,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onWaferClick(wafer)}
          >
            <motion.div
              className={`wafer-inner ${wafer.value > 0 ? 'active' : ''}`}
              animate={{
                scale: wafer.value > 0 ? [1, 0.9, 1] : [1],
                opacity: wafer.value > 0 ? 1 : 0.3
              }}
              transition={{
                duration: 0.5,
                repeat: wafer.value > 0 ? Infinity : 0
              }}
            />
          </motion.div>
        );
      }
    }
    
    return grid;
  };

  return (
    <div className="wafer-grid-container">
      {/* Header */}
      <div className="wafer-grid-header">
        <h2 className="neon-text">🌟 Wafer Vault</h2>
        <div className="wafer-stats">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{wafers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Value</span>
            <span className="stat-value">{wafers.reduce((sum, w) => sum + w.value, 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active</span>
            <span className="stat-value">{wafers.filter(w => w.value > 0).length}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div 
        ref={gridRef}
        className={`wafer-grid ${isDragging ? 'dragging' : ''}`}
        style={{
          width: GRID_SIZE * 30,
          height: GRID_SIZE * 30,
          transform: `translate(${-viewportOffset.x}px, ${-viewportOffset.y}px)`
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {generateGrid()}
      </div>

      {/* Controls */}
      <div className="wafer-grid-controls">
        <button onClick={() => navigate('up')} className="control-btn">↑</button>
        <button onClick={() => navigate('down')} className="control-btn">↓</button>
        <button onClick={() => navigate('left')} className="control-btn">←</button>
        <button onClick={() => navigate('right')} className="control-btn">→</button>
        
        <button 
          onClick={() => setViewportOffset({ x: 0, y: 0 })}
          className="control-btn reset-btn"
        >
          ↺
        </button>
      </div>

      {/* Scrollbar */}
      <div className="wafer-scrollbar">
        <div className="scrollbar-vertical">
          <div 
            className="scrollbar-thumb"
            style={{
              top: `${(viewportOffset.y / (GRID_SIZE * 30 - 600)) * 100}%`
            }}
          />
        </div>
        <div className="scrollbar-horizontal">
          <div 
            className="scrollbar-thumb"
            style={{
              left: `${(viewportOffset.x / (GRID_SIZE * 30 - 800)) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Selected Wafer Info */}
      {selectedWafer && (
        <div className="wafer-info-panel">
          <h3 className="neon-text">Wafer #{selectedWafer.id}</h3>
          <div className="wafer-details">
            <div className="detail-item">
              <span className="detail-label">Value:</span>
              <span className="detail-value">{selectedWafer.value}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Position:</span>
              <span className="detail-value">({selectedWafer.x}, {selectedWafer.y})</span>
            </div>
          </div>
          <div className="wafer-actions">
            <button className="btn-primary">Collect</button>
            <button className="btn-secondary">Transfer</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .wafer-grid-container {
          width: 100%;
          height: calc(100vh - 60px);
          background: #050510;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .wafer-grid-header {
          padding: 15px 20px;
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .neon-text {
          color: #00ffff;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          font-weight: bold;
        }

        .wafer-stats {
          display: flex;
          gap: 20px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .stat-label {
          color: #00ff99;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .stat-value {
          color: #fff;
          font-size: 18px;
          font-weight: bold;
        }

        .wafer-grid {
          position: relative;
          flex: 1;
          margin: 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
          cursor: grab;
          transition: border-color 0.3s ease;
        }

        .wafer-grid.dragging {
          cursor: grabbing;
          border-color: rgba(0, 255, 255, 0.3);
        }

        .wafer {
          position: absolute;
          transition: all 0.2s ease;
        }

        .wafer-inner {
          width: 100%;
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%);
          border: 1px solid rgba(0, 255, 255, 0.3);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5),
                      0 0 20px rgba(0, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .wafer-inner.active {
          background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%);
          border-color: rgba(0, 255, 102, 0.5);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5),
                      0 0 20px rgba(0, 255, 102, 0.3);
        }

        .wafer.selected {
          z-index: 10;
        }

        .wafer.selected .wafer-inner {
          border-color: #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
          animation: pulse-glow 1s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
          50% { box-shadow: 0 0 25px rgba(0, 255, 255, 0.8); }
        }

        .wafer-grid-controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          background: rgba(0, 0, 0, 0.8);
          padding: 10px;
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 255, 0.2);
          backdrop-filter: blur(10px);
        }

        .control-btn {
          width: 40px;
          height: 40px;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 8px;
          color: #00ffff;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover {
          background: rgba(0, 255, 255, 0.2);
          border-color: #00ffff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .control-btn.reset-btn {
          background: rgba(255, 102, 0, 0.1);
          border-color: rgba(255, 102, 0, 0.3);
          color: #ff6666;
        }

        .control-btn.reset-btn:hover {
          background: rgba(255, 102, 0, 0.2);
          border-color: #ff6666;
          box-shadow: 0 0 15px rgba(255, 102, 0, 0.3);
        }

        .wafer-scrollbar {
          position: absolute;
          right: 20px;
          top: 20px;
          bottom: 20px;
          width: 10px;
        }

        .scrollbar-vertical {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
          overflow: hidden;
        }

        .scrollbar-horizontal {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
          overflow: hidden;
        }

        .scrollbar-thumb {
          position: absolute;
          background: #00ffff;
          border-radius: 3px;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .scrollbar-thumb:hover {
          background: #00ff99;
          box-shadow: 0 0 15px rgba(0, 255, 153, 0.5);
        }

        .wafer-info-panel {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(5, 5, 16, 0.95);
          border: 2px solid #00ffff;
          border-radius: 10px;
          padding: 20px;
          min-width: 280px;
          backdrop-filter: blur(10px);
          animation: modal-enter 0.3s ease;
          z-index: 1000;
        }

        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .wafer-info-panel h3 {
          color: #00ffff;
          font-size: 20px;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
          padding-bottom: 10px;
        }

        .wafer-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-label {
          color: #00ff99;
          font-size: 14px;
        }

        .detail-value {
          color: #fff;
          font-size: 16px;
          font-weight: bold;
        }

        .wafer-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 12px;
          border: 2px solid;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-primary {
          background: rgba(0, 255, 255, 0.2);
          border-color: #00ffff;
        }

        .btn-primary:hover {
          background: rgba(0, 255, 255, 0.3);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
        }

        .btn-secondary {
          background: transparent;
          border-color: rgba(0, 255, 153, 0.5);
          color: #00ff99;
        }

        .btn-secondary:hover {
          background: rgba(0, 255, 153, 0.1);
          border-color: #00ff99;
        }
      `}</style>
    </div>
  );
}
