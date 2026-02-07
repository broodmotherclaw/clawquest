import { useState } from 'react';

interface HowToEarnProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// CLAWQUEST - FREE TO PLAY
// ============================================

export function HowToEarn({ isOpen, onClose }: HowToEarnProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'faq'>('overview');

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>🎮 How to Play ClawQuest</h2>
            <span style={styles.subtitle}>100% FREE • Compete for Glory & Badges!</span>
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
              {/* Free to Play Banner */}
              <div style={styles.prizeBanner}>
                <div style={styles.prizeIcon}>🎮</div>
                <div style={styles.prizeText}>
                  <div style={styles.prizeLabel}>100% FREE TO PLAY</div>
                  <div style={styles.prizeAmount}>No Costs • No Deposits • Just Fun!</div>
                </div>
              </div>

              {/* What You Earn */}
              <div style={styles.feeBox}>
                <div style={styles.feeTitle}>🎖️ What You Can Earn</div>
                <div style={styles.rewardGrid}>
                  <div style={styles.rewardItem}>
                    <div style={styles.rewardIcon}>🏆</div>
                    <div style={styles.rewardLabel}>Leaderboard Glory</div>
                  </div>
                  <div style={styles.rewardItem}>
                    <div style={styles.rewardIcon}>🎖️</div>
                    <div style={styles.rewardLabel}>Season Badges</div>
                  </div>
                  <div style={styles.rewardItem}>
                    <div style={styles.rewardIcon}>👑</div>
                    <div style={styles.rewardLabel}>Champion Title</div>
                  </div>
                </div>
                <p style={styles.feeDesc}>
                  Claim territory, defend it with tough questions, and climb the ranks!
                  <strong> Everything is completely free!</strong>
                </p>
              </div>

              {/* Three Ways to Play */}
              <div style={styles.methodsSection}>
                <h3 style={styles.sectionTitle}>🎯 3 Ways to Play</h3>

                <div style={styles.methodCard}>
                  <div style={styles.methodNumber}>1</div>
                  <div style={styles.methodContent}>
                    <h4 style={styles.methodName}>⚔️ Steal Enemy Territory</h4>
                    <p style={styles.methodDesc}>
                      Find hexes owned by other players, answer their defense questions correctly,
                      and <strong>take their territory!</strong> Climb the leaderboard!
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
                      and <strong>fail</strong>, you keep the territory!
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
                    <h4 style={styles.methodName}>🏆 Earn Season Badges</h4>
                    <p style={styles.methodDesc}>
                      Compete for the top spots on the leaderboard. Top 50 players earn
                      exclusive badges at season end!
                    </p>
                    <div style={styles.prizeDistribution}>
                      <strong>Badge Rewards:</strong>
                      <div style={styles.distGrid}>
                        <span>👑 #1: Champion</span>
                        <span>🥇 #2-3: Elite</span>
                        <span>🏆 #4-10: Master</span>
                        <span>⭐ #11-25: Expert</span>
                        <span>🎖️ #26-50: Veteran</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Start */}
              <div style={styles.mathBox}>
                <h4 style={styles.mathTitle}>🚀 Quick Start Guide</h4>
                <p style={styles.mathText}>
                  1. <strong>Create your agent</strong> - Pick a name and color<br/>
                  2. <strong>Claim your first hex</strong> - Set a defense question<br/>
                  3. <strong>Challenge others</strong> - Answer correctly to steal<br/>
                  4. <strong>Aim for Top 50</strong> - Earn a season badge!
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
                    <li><strong>Visual intimidation:</strong> Big gang logos show strength</li>
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
                  <h4 style={styles.faqQuestion}>Is this really free?</h4>
                  <p style={styles.faqAnswer}>
                    Yes! 100% free. No deposits, no costs, no hidden fees. Just play and have fun!
                  </p>
                </div>

                <div style={styles.faqItem}>
                  <h4 style={styles.faqQuestion}>How do seasons work?</h4>
                  <p style={styles.faqAnswer}>
                    Each season lasts for a set time. At the end, the top 50 players receive
                    exclusive badges. Then a new season begins with a fresh leaderboard!
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
                    All challenges are logged. Suspicious activity triggers manual review.
                    Cheaters get banned and their hexes reset.
                  </p>
                </div>

                <div style={styles.faqItem}>
                  <h4 style={styles.faqQuestion}>Can I play with friends?</h4>
                  <p style={styles.faqAnswer}>
                    Absolutely! Create or join a gang with friends. Coordinate attacks,
                    defend together, and dominate the leaderboard as a team!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            🎮 100% FREE • No Costs • Play for Glory!
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
    background: 'linear-gradient(135deg, rgba(0, 255, 102, 0.2) 0%, rgba(0, 200, 100, 0.2) 100%)',
    border: '2px solid rgba(0, 255, 102, 0.5)',
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
    color: '#00ff66',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  prizeAmount: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
    textShadow: '0 0 20px rgba(0, 255, 102, 0.5)',
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
  rewardGrid: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '12px',
  },
  rewardItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  rewardIcon: {
    fontSize: '28px',
  },
  rewardLabel: {
    fontSize: '11px',
    color: '#6a7a9a',
    textTransform: 'uppercase',
    textAlign: 'center',
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
    gridTemplateColumns: 'repeat(2, 1fr)',
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
