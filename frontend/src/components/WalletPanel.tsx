import { useState, useEffect } from 'react';
import { clawQuestAPI } from '../utils/api';

interface WalletData {
  address: string;
  balance: number;
  totalDeposited: number;
  totalWon: number;
}

interface PoolStats {
  totalDeposited: number;
  availableForWinners: number;
  platformFees: number;
  totalPaidOut: number;
}

interface PlayerPrizeInfo {
  currentRank: number;
  hexCount: number;
  prizeIfSeasonEndsNow: number;
  prizePercentage: number;
  totalPool: number;
}

interface WalletPanelProps {
  agentId: string | null;
}

// ============================================
// TOURNAMENT ECONOMY MODEL - Season-Based
// ============================================
// Minimal fees (anti-spam), most goes to Prize Pool
// At season end: Top players share the pool!

const CLAIM_COST = 0.001; // 0.001 UDC (1/10 cent) - anti-spam only
const CHALLENGE_FEE = 0.001; // 0.001 UDC - anti-spam only
const PLATFORM_FEE_PERCENT = 1; // 1%

// Format UDC value for display
function toUDC(value: number): string {
  // Handle very small numbers with scientific notation, large numbers with commas
  if (value === 0) return '0.00';
  if (value < 0.001) return value.toExponential(2);
  if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
  if (value >= 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toFixed(2);
}

// Format percentage for display
function toPercent(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

export function WalletPanel({ agentId }: WalletPanelProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [playerPrize, setPlayerPrize] = useState<PlayerPrizeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(true); // Default open for tournament info

  useEffect(() => {
    if (agentId) {
      loadWalletData();
    }
  }, [agentId]);

  const loadWalletData = async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const [walletRes, poolRes, prizeRes] = await Promise.all([
        fetch(`${clawQuestAPI.getBaseUrl?.() || ''}/wallet/${agentId}`).then(r => r.json()),
        fetch(`${clawQuestAPI.getBaseUrl?.() || ''}/wallet/pool/stats`).then(r => r.json()),
        fetch(`${clawQuestAPI.getBaseUrl?.() || ''}/wallet/${agentId}/prize`).then(r => r.json())
      ]);

      if (walletRes.success) {
        setWallet(walletRes.wallet);
      }
      if (poolRes.success) {
        setPoolStats(poolRes.stats);
      }
      if (prizeRes.success) {
        setPlayerPrize(prizeRes.prizeInfo);
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!agentId) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>💰</span>
          <span style={styles.title}>Prize Pool</span>
        </div>
        <div style={styles.emptyState}>
          Initialize an agent to view your wallet
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>💰</span>
        <span style={styles.title}>Prize Pool</span>
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
          {/* Prize Pool Stats - ALWAYS VISIBLE */}
          {poolStats && (
            <div style={styles.poolHighlight}>
              <div style={styles.poolRow}>
                <span style={styles.poolLabel}>🏆 Prize Pool:</span>
                <span style={styles.poolValue}>{toUDC(poolStats.availableForWinners)} UDC</span>
              </div>
              <div style={styles.feeRow}>
                <span style={styles.feeHighlightText}>
                  Only {PLATFORM_FEE_PERCENT}% fee → <strong>99% to PLAYERS!</strong>
                </span>
              </div>
            </div>
          )}

          {/* Player's Prize Info - ALWAYS VISIBLE */}
          {playerPrize && (
            <div style={styles.playerPrizeBox}>
              <div style={styles.prizeHeader}>
                <span>🎯 YOUR PRIZE</span>
                <span style={styles.rankBadge}>#{playerPrize.currentRank}</span>
              </div>
              <div style={styles.prizeAmount}>
                {toUDC(playerPrize.prizeIfSeasonEndsNow)} <span style={styles.currency}>UDC</span>
              </div>
              <div style={styles.prizeDetail}>
                If season ends NOW • {playerPrize.hexCount} hexes • {toPercent(playerPrize.prizePercentage)} of pool
              </div>
              {playerPrize.currentRank > 50 && (
                <div style={styles.warningText}>
                  ⚠️ Not in top 50 - claim more hexes to qualify!
                </div>
              )}
            </div>
          )}

          {wallet && (
            <div style={styles.balanceBox}>
              <div style={styles.balanceLabel}>Your Balance</div>
              <div style={styles.balanceValue}>
                {toUDC(wallet.balance)} <span style={styles.currency}>UDC</span>
              </div>
            </div>
          )}

          {showDetails && (
            <>
              {/* Tournament Distribution */}
              <div style={styles.distributionSection}>
                <div style={styles.sectionTitle}>📊 Prize Distribution</div>
                <div style={styles.distributionList}>
                  <div style={styles.distributionItem}>
                    <span style={styles.rank}>🥇 1st</span>
                    <span style={styles.percent}>25%</span>
                  </div>
                  <div style={styles.distributionItem}>
                    <span style={styles.rank}>🥈 2nd</span>
                    <span style={styles.percent}>15%</span>
                  </div>
                  <div style={styles.distributionItem}>
                    <span style={styles.rank}>🥉 3rd</span>
                    <span style={styles.percent}>10%</span>
                  </div>
                  <div style={styles.distributionItem}>
                    <span style={styles.rank}>4th-10th</span>
                    <span style={styles.percent}>2%-7%</span>
                  </div>
                  <div style={styles.distributionItem}>
                    <span style={styles.rank}>11th-50th</span>
                    <span style={styles.percent}>~1.35% each</span>
                  </div>
                </div>
              </div>

              {/* Minimal Fees Info */}
              <div style={styles.feesSection}>
                <div style={styles.sectionTitle}>💸 Minimal Fees</div>
                <div style={styles.feeItem}>
                  <span>Claim Hex:</span>
                  <span style={styles.feeAmount}>{toUDC(CLAIM_COST)} UDC</span>
                </div>
                <div style={styles.feeItem}>
                  <span>Challenge Hex:</span>
                  <span style={styles.feeAmount}>{toUDC(CHALLENGE_FEE)} UDC</span>
                </div>
                <div style={styles.feeNote}>
                  All fees go to prize pool (99% to players!)
                </div>
              </div>

              {/* How to Earn */}
              <div style={styles.earnSection}>
                <div style={styles.sectionTitle}>💡 How to Win</div>
                <ul style={styles.tipList}>
                  <li>Claim MORE hexes to climb the leaderboard</li>
                  <li>Defend your territory with hard questions</li>
                  <li>Steal hexes from other players</li>
                  <li>Top 50 at season end share the pool!</li>
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
  // Prize Pool Highlight
  poolHighlight: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 153, 0, 0.15) 100%)',
    border: '2px solid rgba(255, 215, 0, 0.5)',
    borderRadius: '10px',
    padding: '12px',
  },
  poolRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  poolLabel: {
    fontSize: '14px',
    color: '#ffd700',
    fontWeight: 'bold',
  },
  poolValue: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
  },
  feeRow: {
    textAlign: 'center',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255, 215, 0, 0.2)',
  },
  feeHighlightText: {
    fontSize: '11px',
    color: '#ff9900',
    fontWeight: 'bold',
  },
  // Player Prize Box
  playerPrizeBox: {
    background: 'linear-gradient(135deg, rgba(0, 255, 102, 0.15) 0%, rgba(0, 200, 100, 0.15) 100%)',
    border: '2px solid rgba(0, 255, 102, 0.4)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
  },
  prizeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  rankBadge: {
    background: 'rgba(0, 255, 102, 0.3)',
    border: '1px solid rgba(0, 255, 102, 0.5)',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#00ff66',
  },
  prizeAmount: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
    marginBottom: '4px',
  },
  prizeDetail: {
    fontSize: '11px',
    color: '#a0b0a0',
  },
  warningText: {
    marginTop: '8px',
    fontSize: '10px',
    color: '#ff6600',
    fontWeight: 'bold',
  },
  // Balance Box
  balanceBox: {
    background: 'rgba(0, 255, 255, 0.1)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center',
  },
  balanceLabel: {
    fontSize: '10px',
    color: '#6a7a9a',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  balanceValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
  },
  currency: {
    fontSize: '12px',
    color: '#00ff99',
  },
  // Distribution Section
  distributionSection: {
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
  distributionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  distributionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#a0a0b0',
  },
  rank: {
    color: '#fff',
  },
  percent: {
    color: '#00ff66',
    fontWeight: 'bold',
  },
  // Fees Section
  feesSection: {
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '6px',
    padding: '10px',
  },
  feeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#a0a0b0',
    marginBottom: '4px',
  },
  feeAmount: {
    color: '#00ffff',
    fontWeight: 'bold',
  },
  feeNote: {
    marginTop: '6px',
    fontSize: '10px',
    color: '#6a7a9a',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Earn Section
  earnSection: {
    background: 'rgba(0, 255, 102, 0.05)',
    border: '1px solid rgba(0, 255, 102, 0.2)',
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
