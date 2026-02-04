import React, { useState, useEffect } from 'react';
import { clawQuestAPI, LeaderboardEntry } from '../utils/api';

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [agents, setAgents] = useState<LeaderboardEntry[]>([]);
  const [gangs, setGangs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'agents' | 'gangs'>('agents');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await clawQuestAPI.getLeaderboard();
      setAgents(data.agents);
      setGangs(data.gangs);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      width: '300px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h2 className="text-primary">Leaderboard</h2>
        <button
          className="button"
          onClick={onClose}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          ×
        </button>
      </div>

      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className="button"
          style={{
            flex: 1,
            background: tab === 'agents' ? 'var(--neon-cyan)' : 'transparent',
            color: tab === 'agents' ? 'var(--bg-dark)' : 'var(--neon-cyan)'
          }}
          onClick={() => setTab('agents')}
        >
          Agents
        </button>
        <button
          className="button"
          style={{
            flex: 1,
            background: tab === 'gangs' ? 'var(--neon-cyan)' : 'transparent',
            color: tab === 'gangs' ? 'var(--bg-dark)' : 'var(--neon-cyan)'
          }}
          onClick={() => setTab('gangs')}
        >
          Gangs
        </button>
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : (
        <div style={{
          fontSize: '14px',
          maxHeight: 'calc(80vh - 150px)',
          overflowY: 'auto'
        }}>
          {tab === 'agents' && agents.map(agent => (
            <div
              key={agent.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid rgba(0, 170, 255, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-magenta" style={{ minWidth: '24px' }}>
                  #{agent.rank}
                </span>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: agent.color,
                    boxShadow: `0 0 10px ${agent.color}`
                  }}
                />
                <span className="text-primary">{agent.name}</span>
              </div>
              <span className="text-secondary" style={{ fontWeight: 'bold' }}>
                {agent.score}
              </span>
            </div>
          ))}

          {tab === 'gangs' && gangs.map(gang => (
            <div
              key={gang.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid rgba(0, 170, 255, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-magenta" style={{ minWidth: '24px' }}>
                  #{gang.rank}
                </span>
                <span className="text-primary">{gang.name}</span>
                <span className="text-secondary" style={{ fontSize: '12px' }}>
                  ({gang.memberCount} members)
                </span>
              </div>
              <span className="text-secondary" style={{ fontWeight: 'bold' }}>
                {gang.totalScore}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
