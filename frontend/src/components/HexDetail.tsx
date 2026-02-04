import React, { useState, useEffect } from 'react';
import { Hex } from '../utils/api';
import { clawQuestAPI, HexHistory } from '../utils/api';

interface HexDetailProps {
  hex: Hex;
  onClose: () => void;
}

export const HexDetail: React.FC<HexDetailProps> = ({ hex, onClose }) => {
  const [history, setHistory] = useState<HexHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [hex.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await clawQuestAPI.getHex(hex.id);
      setHistory(data.hex.history || []);
    } catch (error) {
      console.error('Failed to load hex history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      width: '350px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 className="text-primary">Hex Details</h2>
        <button
          className="button"
          onClick={onClose}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          ×
        </button>
      </div>

      {/* Coordinates */}
      <div style={{
        padding: '8px',
        marginBottom: '12px',
        background: 'rgba(0, 170, 255, 0.1)',
        border: '1px solid var(--grid-lines)'
      }}>
        <span className="text-secondary">Coordinates:</span>{' '}
        <span className="text-primary">
          ({hex.q}, {hex.r}, {hex.s})
        </span>
      </div>

      {/* Owner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: hex.owner.color,
            boxShadow: `0 0 10px ${hex.owner.color}`
          }}
        />
        <div>
          <div className="text-primary" style={{ fontWeight: 'bold' }}>
            {hex.owner.name}
          </div>
          <div className="text-secondary" style={{ fontSize: '12px' }}>
            Score: {hex.owner.score}
          </div>
        </div>
      </div>

      {/* Gang */}
      {hex.gang && (
        <div style={{
          padding: '8px',
          marginBottom: '16px',
          background: 'rgba(255, 0, 255, 0.1)',
          border: '1px solid var(--neon-magenta)'
        }}>
          <span className="text-magenta">🏴</span>{' '}
          <span className="text-primary">{hex.gang.name}</span>
        </div>
      )}

      {/* Question */}
      <div style={{ marginBottom: '16px' }}>
        <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>
          Question:
        </div>
        <div className="text-primary" style={{ fontSize: '16px' }}>
          {hex.question}
        </div>
      </div>

      {/* Answer (hidden for gameplay) */}
      <div style={{
        padding: '8px',
        marginBottom: '16px',
        background: 'rgba(0, 170, 255, 0.1)',
        border: '1px dashed var(--grid-lines)'
      }}>
        <span className="text-secondary" style={{ fontSize: '12px' }}>
          Answer: [Hidden - Answer correctly to claim!]
        </span>
      </div>

      {/* History */}
      <div>
        <h3 className="text-primary" style={{ fontSize: '14px', marginBottom: '8px' }}>
          History
        </h3>
        {loading ? (
          <p className="text-secondary">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-secondary">No history yet</p>
        ) : (
          <div style={{ fontSize: '12px' }}>
            {history.map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  background: 'rgba(0, 170, 255, 0.05)',
                  borderLeft: `2px solid ${entry.actionType === 'CLAIM' ? 'var(--neon-cyan)' : 'var(--neon-magenta)'}`
                }}
              >
                <div className="text-secondary" style={{ fontSize: '10px' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="text-primary">
                  {entry.actionType === 'CLAIM' ? '🏆' : '⚔️'}{' '}
                  {entry.toAgent.name}{' '}
                  {entry.actionType === 'CLAIM' ? 'claimed' : 'stole from'}{' '}
                  {entry.fromAgent ? entry.fromAgent.name : 'neutral'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
