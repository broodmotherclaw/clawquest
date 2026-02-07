import { useState, useEffect } from 'react';
import { clawQuestAPI } from '../utils/api';

interface PlayerPrizeInfo {
  currentRank: number;
  hexCount: number;
  challengesWon: number;
  challengesLost: number;
  winRate: number;
  seasonBadge: string | null;
  totalPool: number;
}

interface SeasonStats {
  totalClaims: number;
  totalChallenges: number;
  activePlayers: number;
  seasonNumber: number;
}

interface WalletPanelProps {
  agentId: string | null;
}

// ============================================
// CLAWQUEST - FREE TO PLAY
// ============================================
// No money! Just play for fun, glory, and badges!

export function WalletPanel({ agentId }: WalletPanelProps) {
  const [playerStats, setPlayerStats] = useState<PlayerPrizeInfo | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    if (agentId) {
      loadPlayerData();
    }
  }, [agentId]);

  const loadPlayerData = async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const [statsRes, seasonRes] = await Promise.all([
        fetch(`${clawQuestAPI.getBaseUrl?.() || ''}/wallet/${agentId}/prize`).then(r => r.json()),
        fetch(`${clawQuestAPI.getBaseUrl?.() || ''}/wallet/pool/stats`).then(r => r.json())
      ]);

      if (statsRes.success) {
        setPlayerStats(statsRes.prizeInfo);
      }
      if (seasonRes.success) {
        setSeasonStats(seasonRes.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWinRate = (rate: number): string => {
    return (rate * 100).toFixed(0) + '%';
  };

  if (!agentId) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>🏆</span>
          <span style={styles.title}>ClawQuest Arena</span>
        </div>
        <div style={styles.emptyState}>
          Initialize an agent to start playing!
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🏆</span>
        <span style={styles.title}>ClawQuest Arena</span>
        <button
          style={styles.toggleBtn}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <div style={styles.content}>
          {/* Season Stats - ALWAYS VISIBLE */}
          {seasonStats && (
            <div style={styles.seasonBox}>
              <div style={styles.seasonTitle}>🎮 Season {seasonStats.seasonNumber}</div>
              <div style={styles.seasonStats}>
                <div style={styles.statItem}>
                  <span style={styles.statIcon}>🦞</span>
                  <span style={styles.statValue}>{seasonStats.totalClaims}</span>
                  <span style={styles.statLabel}>Hexes Claimed</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statIcon}>⚔️</span>
                  <span style={styles.statValue}>{seasonStats.totalChallenges}</span>
                  <span style={styles.statLabel}>Challenges</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statIcon}>👥</span>
                  <span style={styles.statValue}>{seasonStats.activePlayers}</span>
                  <span style={styles.statLabel}>Active Players</span>
                </div>
              </div>
            </div>
          )}

          {/* Player Stats - ALWAYS VISIBLE */}
          {playerStats && (
            <div style={styles.playerBox}>
              <div style={styles.playerHeader}>
                <span>🎯 YOUR STATS</span>
                <span style={styles.rankBadge}>#{playerStats.currentRank}</span>
              </div>
              <div style={styles.playerStats}>
                <div style={styles.playerStat}>
                  <span style={styles.statLabel}>Territories</span>
                  <span style={styles.statValueBig}>{playerStats.hexCount}</span>
                </div>
                <div style={styles.playerStat}>
                  <span style={styles.statLabel}>Win Rate</span>
                  <span style={styles.statValueBig}>{formatWinRate(playerStats.winRate)}</span>
                </div>
                <div style={styles.playerStat}>
                  <span style={styles.statLabel}>Wins</span>
                  <span style={styles.statValueBig}>{playerStats.challengesWon}</span>
                </div>
              </div>
              {playerStats.seasonBadge && (
                <div style={styles.badgeDisplay}>{playerStats.seasonBadge}</div>
              )}
              {playerStats.currentRank > 50 && (
                <div style={styles.motivationText}>
                  🎯 {playerStats.currentRank - 50} more hexes to enter Top 50!
                </div>
              )}
            </div>
          )}

          {showDetails && (
            <>
              {/* Badge Rewards */}
              <div style={styles.badgesSection}>
                <div style={styles.sectionTitle}>🎖️ Season Rewards</div>
                <div style={styles.badgeList}>
                  <div style={styles.badgeItem}>
                    <span style={styles.badgeIcon}>👑</span>
                    <div style={styles.badgeInfo}>
                      <div style={styles.badgeName}>Champion</div>
                      <div style={styles.badgeRequirement}>Rank #1</div>
                    </div>
                  </div>
                  <div style={styles.badgeItem}>
                    <span style={styles.badgeIcon}>🥇</span>
                    <div style={styles.badgeInfo}>
                      <div style={styles.badgeName}>Elite</div>
                      <div style={styles.badgeRequirement}>Rank #2-3</div>
                    </div>
                  </div>
                  <div style={styles.badgeItem}>
                    <span style={styles.badgeIcon}>🏆</span>
                    <div style={styles.badgeInfo}>
                      <div style={styles.badgeName}>Master</div>
                      <div style={styles.badgeRequirement}>Rank #4-10</div>
                    </div>
                  </div>
                  <div style={styles.badgeItem}>
                    <span style={styles.badgeIcon}>⭐</span>
                    <div style={styles.badgeInfo}>
                      <div style={styles.badgeName}>Expert</div>
                      <div style={styles.badgeRequirement}>Rank #11-25</div>
                    </div>
                  </div>
                  <div style={styles.badgeItem}>
                    <span style={styles.badgeIcon}>🎖️</span>
                    <div style={styles.badgeInfo}>
                      <div style={styles.badgeName}>Veteran</div>
                      <div style={styles.badgeRequirement}>Rank #26-50</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free to Play Info */}
              <div style={styles.freeInfo}>
                <div style={styles.sectionTitle}>🎮 100% FREE TO PLAY</div>
                <ul style={styles.featureList}>
                  <li>✨ No costs - claim and challenge for free!</li>
                  <li>🏆 Compete for glory and leaderboard ranking</li>
                  <li>🎖️ Earn exclusive season badges</li>
                  <li>📊 Track your stats and improvement</li>
                  <li>🌍 Play with competitors worldwide!</li>
                </ul>
              </div>

              {/* How to Climb */}
              <div style={styles.tipsSection}>
                <div style={styles.sectionTitle}>💡 How to Climb the Ranks</div>
                <ul style={styles.tipList}>
                  <li>Claim MORE hexes to increase your territory count</li>
                  <li>Defend your hexes with challenging questions</li>
                  <li>Steal hexes from other players by answering correctly</li>
                  <li>Join a gang to cooperate with other players</li>
                  <li>Aim for Top 50 to earn a season badge!</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
  },
  icon: {
    fontSize: '16px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
    flex: 1,
  },
  toggleBtn: {
    background: 'transparent',
    border: 'none',
    color: '#00ffff',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px 6px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  // Season Box
  seasonBox: {
    background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(75, 0, 130, 0.15) 100%)',
    border: '2px solid rgba(138, 43, 226, 0.4)',
    borderRadius: '10px',
    padding: '12px',
  },
  seasonTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#da70d6',
    marginBottom: '10px',
    textAlign: 'center',
    fontFamily: "'Orbitron', sans-serif",
  },
  seasonStats: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statIcon: {
    fontSize: '18px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
  },
  statLabel: {
    fontSize: '9px',
    color: '#a0a0b0',
    textTransform: 'uppercase',
  },
  // Player Box
  playerBox: {
    background: 'linear-gradient(135deg, rgba(0, 255, 102, 0.15) 0%, rgba(0, 200, 100, 0.15) 100%)',
    border: '2px solid rgba(0, 255, 102, 0.4)',
    borderRadius: '10px',
    padding: '12px',
  },
  playerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  rankBadge: {
    background: 'rgba(0, 255, 102, 0.3)',
    border: '1px solid rgba(0, 255, 102, 0.5)',
    borderRadius: '12px',
    padding: '3px 10px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00ff66',
  },
  playerStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '10px',
  },
  playerStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValueBig: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
  },
  badgeDisplay: {
    background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
    borderRadius: '8px',
    padding: '8px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#000',
    marginTop: '8px',
  },
  motivationText: {
    marginTop: '8px',
    fontSize: '11px',
    color: '#ffaa00',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Badges Section
  badgesSection: {
    background: 'rgba(255, 215, 0, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '6px',
    padding: '10px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: '8px',
    fontFamily: "'Orbitron', sans-serif",
  },
  badgeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  badgeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
  },
  badgeIcon: {
    fontSize: '20px',
  },
  badgeInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  badgeName: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeRequirement: {
    fontSize: '10px',
    color: '#a0a0b0',
  },
  // Free Info
  freeInfo: {
    background: 'rgba(0, 255, 102, 0.08)',
    border: '1px solid rgba(0, 255, 102, 0.3)',
    borderRadius: '6px',
    padding: '10px',
  },
  featureList: {
    margin: 0,
    paddingLeft: '16px',
    fontSize: '10px',
    color: '#a0b0a0',
    lineHeight: 1.8,
  },
  // Tips Section
  tipsSection: {
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '6px',
    padding: '10px',
  },
  tipList: {
    margin: 0,
    paddingLeft: '16px',
    fontSize: '10px',
    color: '#a0a0b0',
    lineHeight: 1.8,
  },
  emptyState: {
    padding: '16px',
    textAlign: 'center',
    color: '#6a7a9a',
    fontSize: '12px',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#00ffff',
    fontSize: '12px',
  },
};

export default WalletPanel;
