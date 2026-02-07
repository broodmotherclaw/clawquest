import { useState } from 'react';

interface HowToEarnProps {
  isOpen: boolean;
  onClose: () => void;
}

// Prize constants - UDC only (in-game currency)
const BASE_PRIZE_UDC = 0.1; // 0.1 UDC per win - sustainable economy
const PLATFORM_FEE = 1; // 1%
const PLAYER_SHARE = 99; // 99%

export function HowToEarn({ isOpen, onClose }: HowToEarnProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'faq'>('overview');

  const prizePerWin = BASE_PRIZE_UDC;

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>💰 How to Earn Money</h2>
            <span style={styles.subtitle}>Player-First Economy: You keep 99%!</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'strategies' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('strategies')}
          >
            🧠 Strategies
          </button>
          <button
            style={{...styles.tab, ...(activeTab === 'faq' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('faq')}
          >
            ❓ FAQ
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'overview' && (
            <>
              {/* Prize Banner */}
              <div style={styles.prizeBanner}>
                <div style={styles.prizeIcon}>🏆</div>
                <div style={styles.prizeText}>
                  <div style={styles.prizeLabel}>Prize Per Win</div>
                  <div style={styles.prizeAmount}>{prizePerWin} UDC</div>

                </div>
              </div>

              {/* Fee Structure */}
              <div style={styles.feeBox}>
                <div style={styles.feeTitle}>💎 Industry-Lowest Fees</div>
                <div style={styles.feeGrid}>
                  <div style={styles.feeItem}>
                    <div style={styles.feeValue}>{PLATFORM_FEE}%</div>
                    <div style={styles.feeLabel}>Platform Fee</div>
                  </div>
                  <div style={styles.feeArrow}>→</div>
                  <div style={styles.feeItem}>
                    <div style={styles.feeValue}>{PLAYER_SHARE}%</div>
                    <div style={styles.feeLabel}>To YOU!</div>
                  </div>
                </div>
                <p style={styles.feeDesc}>
                  Most platforms take 5-20%. We take only 1% because we believe in 
                  <strong> rewarding players!</strong>
                </p>
              </div>

              {/* Three Ways to Earn */}
              <div style={styles.methodsSection}>
                <h3 style={styles.sectionTitle}>🎯 3 Ways to Make Money</h3>
                
                <div style={styles.methodCard}>
                  <div style={styles.methodNumber}>1</div>
                  <div style={styles.methodContent}>
                    <h4 style={styles.methodName}>⚔️ Steal Enemy Territory</h4>
                    <p style={styles.methodDesc}>
                      Find hexes owned by other players, answer their defense questions correctly, 
                      and <strong>instantly win {prizePerWin} UDC</strong>!
                    </p>
                    <div style={styles.proTip}>
                      <strong>💡 Pro Tip:</strong> Look for questions in your expertise area. 
                      Failed attempts are logged, so choose wisely!
                    </div>
                  </div>
                </div>

                <div style={styles.methodCard}>
                  <div style={styles.methodNumber}>2</div>
                  <div style={styles.methodContent}>
                    <h4 style={styles.methodName}>🏴 Claim & Defend Territory</h4>
                    <p style={styles.methodDesc}>
                      Claim unclaimed hexes with defense questions. When others try to steal 
                      and <strong>fail</strong>, you earn passive income!
                    </p>
                    <div style={styles.proTip}>
                      <strong>💡 Pro Tip:</strong> Create questions that are hard but fair. 
                      Too easy = stolen quickly. Too hard = no one tries.
                    </div>
                  </div>
                </div>

                <div style={styles.methodCard}>
                  <div style={styles.methodNumber}>3</div>
                  <div style={styles.methodContent}>
                    <h4 style={styles.methodName}>🏆 Win Tournaments</h4>
                    <p style={styles.methodDesc}>
                      Compete for the top spots on the leaderboard. Top 5 players share 
                      99% of the prize pool every season!
                    </p>
                    <div style={styles.prizeDistribution}>
                      <strong>Prize Split:</strong>
                      <div style={styles.distGrid}>
                        <span>🥇 1st: 40%</span>
                        <span>🥈 2nd: 25%</span>
                        <span>🥉 3rd: 15%</span>
                        <span>4th: 10%</span>
                        <span>5th: 5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Math */}
              <div style={styles.mathBox}>
                <h4 style={styles.mathTitle}>📈 Earnings Example</h4>
                <p style={styles.mathText}>
                  If you win <strong>10 challenges</strong> per day:<br/>
                  10 × {prizePerWin} UDC = <strong>{prizePerWin * 10} UDC/day</strong><br/>
                  = { (prizePerWin * 10) } UDC per day potential!
                </p>
              </div>
            </>
          )}

          {activeTab === 'strategies' && (
            <>
              <div style={styles.strategySection}>
                <h3 style={styles.sectionTitle}>🧠 Winning Strategies</h3>

                <div style={styles.strategyCard}>
                  <h4 style={styles.strategyTitle}>🎯 Offense: Smart Attacks</h4>
                  <ul style={styles.strategyList}>
                    <li><strong>Specialize:</strong> Focus on questions in your knowledge domain</li>
                    <li><strong>Scout first:</strong> Check questions before attacking</li>
                    <li><strong>Build momentum:</strong> Steal adjacent hexes for territory clusters</li>
                    <li><strong>Learn patterns:</strong> Study what types of answers AI accepts</li>
                  </ul>
                </div>

                <div style={styles.strategyCard}>
                  <h4 style={styles.strategyTitle}>🛡️ Defense: Impenetrable Questions</h4>
                  <ul style={styles.strategyList}>
                    <li><strong>Be specific:</strong> "Who invented X in 1928?" beats "Who invented X?"</li>
                    <li><strong>Use numbers:</strong> Dates, statistics, coordinates are harder to guess</li>
                    <li><strong>Domain knowledge:</strong> Niche topics in your expertise</li>
                    <li><strong>Avoid trivia:</strong> Easy Wikipedia facts get stolen quickly</li>
                  </ul>
                </div>

                <div style={styles.strategyCard}>
                  <h4 style={styles.strategyTitle}>👥 Gang Strategy</h4>
                  <ul style={styles.strategyList}>
                    <li><strong>Join early:</strong> Gangs with more territory attract more members</li>
                    <li><strong>Coordinate:</strong> Work with gang members to defend territory</li>
                    <li><strong>Visual intimidation:</strong> Big gang logos scare off attackers</li>
                    <li><strong>Share intel:</strong> Tell allies about weak enemy hexes</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {activeTab === 'faq' && (
            <>
              <div style={styles.faqSection}>
                <h3 style={styles.sectionTitle}>❓ Frequently Asked Questions</h3>

                <div style={styles.faqItem}>
                  <h4 style={styles.faqQuestion}>How do I withdraw my earnings?</h4>
                  <p style={styles.faqAnswer}>
                    Contact the admin with your wallet address and desired amount. 
                    Withdrawals are processed within 24 hours to your wallet.
                  </p>
                </div>

                <div style={styles.faqItem}>
                  <h4 style={styles.faqQuestion}>Is there a minimum deposit?</h4>
                  <p style={styles.faqAnswer}>
                    No minimum! You can start with any amount. However, you need 
                    enough balance to cover potential tournament entry fees (if enabled).
                  </p>
                </div>

                <div style={styles.faqItem}>
                  <h4 style={styles.faqQuestion}>How is the AI validation fair?</h4>
                  <p style={styles.faqAnswer}>
                    We use GLM-4 AI with semantic similarity. It accepts answers that are 
                    factually correct even if worded differently. Misspellings are tolerated 
                    if the meaning is clear. The threshold is 70% similarity.
                  </p>
                </div>

                <div style={styles.faqItem}>
                  <h4 style={styles.faqQuestion}>What if someone cheats?</h4>
                  <p style={styles.faqAnswer}>
                    All challenges are logged. Suspicious activity (e.g., perfect answer rates) 
                    triggers manual review. Cheaters lose all earnings and get banned.
                  </p>
                </div>

                <div style={styles.faqItem}>
                  <h4 style={styles.faqQuestion}>Why only 1% fee?</h4>
                  <p style={styles.faqAnswer}>
                    We believe in rewarding players, not extracting value. The 1% covers 
                    server costs and AI validation. Our goal is a sustainable player-first economy.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            💎 99% to Players • 1% Platform Fee • Play Smart, Earn More!
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(5px)',
  },
  modal: {
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    background: 'rgba(5, 5, 20, 0.98)',
    border: '2px solid #00ff66',
    borderRadius: '16px',
    boxShadow: '0 0 60px rgba(0, 255, 102, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0, 255, 102, 0.2)',
    background: 'rgba(0, 255, 102, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontFamily: "'Orbitron', sans-serif",
    color: '#00ff66',
    textShadow: '0 0 10px rgba(0, 255, 102, 0.5)',
  },
  subtitle: {
    display: 'block',
    marginTop: '4px',
    fontSize: '13px',
    color: '#6a7a9a',
  },
  closeBtn: {
    width: '36px',
    height: '36px',
    background: 'transparent',
    border: '1px solid rgba(255, 0, 0, 0.5)',
    borderRadius: '50%',
    color: '#ff6666',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(0, 255, 102, 0.2)',
  },
  tab: {
    flex: 1,
    padding: '14px',
    background: 'transparent',
    border: 'none',
    color: '#6a7a9a',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  tabActive: {
    color: '#00ff66',
    background: 'rgba(0, 255, 102, 0.1)',
    borderBottom: '2px solid #00ff66',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  prizeBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '24px',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 153, 0, 0.2) 100%)',
    border: '2px solid rgba(255, 215, 0, 0.5)',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  prizeIcon: {
    fontSize: '48px',
  },
  prizeText: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: '14px',
    color: '#ffd700',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  prizeAmount: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
    textShadow: '0 0 20px rgba(0, 255, 102, 0.5)',
  },
  prizeUsd: {
    fontSize: '14px',
    color: '#6a7a9a',
  },
  feeBox: {
    padding: '16px',
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '10px',
    marginBottom: '24px',
  },
  feeTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: '12px',
    textAlign: 'center',
  },
  feeGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '12px',
  },
  feeItem: {
    textAlign: 'center',
  },
  feeValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
  },
  feeLabel: {
    fontSize: '11px',
    color: '#6a7a9a',
    textTransform: 'uppercase',
  },
  feeArrow: {
    fontSize: '24px',
    color: '#00ffff',
  },
  feeDesc: {
    fontSize: '12px',
    color: '#a0a0b0',
    textAlign: 'center',
    margin: 0,
  },
  methodsSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
    marginBottom: '16px',
  },
  methodCard: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(0, 255, 255, 0.15)',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  methodNumber: {
    width: '36px',
    height: '36px',
    background: 'rgba(0, 255, 102, 0.2)',
    border: '2px solid #00ff66',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#00ff66',
    flexShrink: 0,
  },
  methodContent: {
    flex: 1,
  },
  methodName: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 8px 0',
  },
  methodDesc: {
    fontSize: '13px',
    color: '#a0a0b0',
    lineHeight: 1.6,
    margin: '0 0 10px 0',
  },
  proTip: {
    padding: '10px',
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px dashed rgba(255, 215, 0, 0.3)',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#ffd700',
  },
  prizeDistribution: {
    padding: '10px',
    background: 'rgba(255, 153, 0, 0.1)',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#ff9900',
  },
  distGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    marginTop: '6px',
  },
  mathBox: {
    padding: '16px',
    background: 'rgba(0, 255, 102, 0.1)',
    border: '1px solid rgba(0, 255, 102, 0.3)',
    borderRadius: '10px',
  },
  mathTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ff66',
    margin: '0 0 10px 0',
  },
  mathText: {
    fontSize: '13px',
    color: '#a0a0b0',
    lineHeight: 1.8,
    margin: 0,
  },
  strategySection: {
    marginBottom: '20px',
  },
  strategyCard: {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0, 255, 255, 0.15)',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  strategyTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ffff',
    margin: '0 0 12px 0',
    fontFamily: "'Orbitron', sans-serif",
  },
  strategyList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#a0a0b0',
    lineHeight: 1.8,
  },
  faqSection: {
    marginBottom: '20px',
  },
  faqItem: {
    padding: '14px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0, 255, 255, 0.1)',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  faqQuestion: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ffff',
    margin: '0 0 8px 0',
  },
  faqAnswer: {
    fontSize: '12px',
    color: '#a0a0b0',
    lineHeight: 1.6,
    margin: 0,
  },
  footer: {
    padding: '14px 24px',
    borderTop: '1px solid rgba(0, 255, 102, 0.2)',
    background: 'rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  footerText: {
    color: '#00ff66',
    fontSize: '12px',
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 'bold',
  },
};

export default HowToEarn;
