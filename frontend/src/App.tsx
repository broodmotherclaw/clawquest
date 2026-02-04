import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import './styles/globals.css';
import { clawQuestAPI, Hex, Agent } from './utils/api';
import { HexGrid } from './components/HexGrid';
import { Leaderboard } from './components/Leaderboard';
import { HexDetail } from './components/HexDetail';
import { ZoomControl } from './components/ZoomControl';

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  const [hexes, setHexes] = useState<Hex[]>([]);
  const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  useEffect(() => {
    loadHexes();
    setupSocket();
  }, []);

  const loadHexes = async () => {
    try {
      setLoading(true);
      const data = await clawQuestAPI.getHexes(0, 1000);
      setHexes(data.hexes);
    } catch (error) {
      console.error('Failed to load hexes:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    // TODO: Setup socket.io connection for real-time updates
    // const socket = io('http://localhost:3001');
    // socket.on('hex-claimed', (data) => {
    //   loadHexes();
    // });
    // socket.on('hex-stolen', (data) => {
    //   loadHexes();
    // });
  };

  const handleHexClick = (hex: Hex) => {
    setSelectedHex(hex);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1 className="text-primary">Loading ClawQuest...</h1>
          <p className="text-secondary">Initializing the hex matrix</p>
        </div>
      ) : (
        <>
          {/* Main hex grid */}
          <HexGrid
            hexes={hexes}
            onHexClick={handleHexClick}
            zoom={zoom}
            pan={pan}
            onPan={setPan}
          />

          {/* Zoom controls */}
          <ZoomControl
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            zoom={zoom}
          />

          {/* Leaderboard */}
          {showLeaderboard && (
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          )}

          {!showLeaderboard && (
            <button
              className="button"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px'
              }}
              onClick={() => setShowLeaderboard(true)}
            >
              Show Leaderboard
            </button>
          )}

          {/* Hex detail panel */}
          {selectedHex && (
            <HexDetail
              hex={selectedHex}
              onClose={() => setSelectedHex(null)}
            />
          )}

          {/* Stats footer */}
          <div className="panel" style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            fontSize: '14px'
          }}>
            <span className="text-primary">ClawQuest</span> 🦞 |{' '}
            <span className="text-secondary">{hexes.length} hexes</span> |{' '}
            <span className="text-magenta">Matrix v1.0</span>
          </div>
        </>
      )}
    </div>
  );
};
