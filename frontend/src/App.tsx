import { useState, useEffect, useCallback } from 'react';
import { HexGrid } from './components/HexGrid';
import { Leaderboard } from './components/Leaderboard';
import { AgentSetup } from './components/AgentSetup';
import { HexDetail } from './components/HexDetail';
import { HowToEarn } from './components/HowToEarn';
import { clawQuestAPI, Agent, Hex, Gang, GameStats } from './utils/api';

// Hex grid size
const GRID_SIZE = 20; // 20x20 hex grid
const HEX_SIZE = 25;

function App() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [hexes, setHexes] = useState<Hex[]>([]);
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [leaderboard, setLeaderboard] = useState<Agent[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawHexData, setRawHexData] = useState<any[]>([]);
  
  // Viewport state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showSetup, setShowSetup] = useState(false);
  const [showHowToEarn, setShowHowToEarn] = useState(false);

  // Generate initial hex grid
  const generateHexGrid = useCallback((): Hex[] => {
    const grid: Hex[] = [];
    const size = GRID_SIZE;
    
    for (let q = -size; q <= size; q++) {
      for (let r = -size; r <= size; r++) {
        const s = -q - r;
        if (Math.abs(s) <= size) {
          grid.push({
            id: `${q},${r}`,
            q,
            r,
            s,
            ownerId: '',
            question: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
    return grid;
  }, []);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const hexesResponse = await clawQuestAPI.getHexes(0, 1000);
      const gangsData = await clawQuestAPI.getGangs();
      const leaderboardData = await clawQuestAPI.getLeaderboard(20);
      const statsData = await clawQuestAPI.getStats();

      // Handle API response format { success: true, hexes: [...] }
      let hexesArray: Hex[] = [];
      if (Array.isArray(hexesResponse)) {
        hexesArray = hexesResponse;
      } else if (hexesResponse && hexesResponse.hexes) {
        hexesArray = hexesResponse.hexes;
      } else if (hexesResponse && Array.isArray(hexesResponse.data)) {
        hexesArray = hexesResponse.data;
      }
      
      setRawHexData(hexesArray);

      // Merge API hexes with generated grid
      const apiHexMap = new Map(hexesArray.map((h: Hex) => [`${h.q},${h.r}`, h]));
      const mergedHexes = generateHexGrid().map(hex => {
        const apiHex = apiHexMap.get(`${hex.q},${hex.r}`);
        return apiHex || hex;
      });

      setHexes(mergedHexes);
      setGangs(gangsData);
      setLeaderboard(leaderboardData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      console.error('Failed to load battlefield data:', err);
      setError('Connection to OpenClaw server failed. Retrying...');
      setHexes(generateHexGrid());
    } finally {
      setLoading(false);
    }
  }, [generateHexGrid]);

  // Initial load
  useEffect(() => {
    loadData();
    
    // Refresh every 5 seconds for more live feeling
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle hex click
  const handleHexClick = useCallback((hex: Hex) => {
    setSelectedHex(hex);
  }, []);

  // Handle zoom
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
  }, []);

  // Handle claim hex
  const handleClaimHex = useCallback(async (hexId: string, question: string, answer: string) => {
    if (!agent) {
      setShowSetup(true);
      return;
    }

    try {
      const hex = hexes.find(h => h.id === hexId);
      if (!hex) return;

      await clawQuestAPI.claimHex(agent.id, hex.q, hex.r, question, answer);
      await loadData();
      setSelectedHex(null);
    } catch (err) {
      console.error('Territory claim failed:', err);
      alert('Error claiming hex. Hexagon may already be claimed.');
    }
  }, [agent, hexes, loadData]);

  // Handle challenge hex
  const handleChallengeHex = useCallback(async (hexId: string, answer: string) => {
    if (!agent) {
      setShowSetup(true);
      return;
    }

    try {
      const result = await clawQuestAPI.challengeHex(agent.id, hexId, answer);
      await loadData();
      setSelectedHex(null);
      
      if (!result.success) {
        alert('Challenge failed: Incorrect answer. Analyze the question and try again.');
      }
    } catch (err) {
      console.error('Challenge failed:', err);
      alert('Challenge failed. Check your answer and retry.');
    }
  }, [agent, loadData]);

  // Handle create agent
  const handleCreateAgent = useCallback(async (name: string) => {
    try {
      const colors = [
        '#00ffff', '#ff00ff', '#00ff66', '#ff6600', 
        '#9900ff', '#ff0066', '#ffff00', '#00aaff',
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newAgent = await clawQuestAPI.registerAgent(name, randomColor);
      setAgent(newAgent);
      setShowSetup(false);
      await loadData();
    } catch (err) {
      console.error('Agent initialization failed:', err);
      alert('Error creating agent. Name may already be registered.');
    }
  }, [loadData]);

  // Loading screen
  if (loading && hexes.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingLogo}>🦞</div>
        <div style={styles.loadingText}>INITIALIZING OPENCLAW PROTOCOL</div>
        <div style={styles.loadingSubtext}>Connecting to Knowledge Warfare Arena...</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoSection}>
          <span style={styles.logoIcon}>🦞</span>
          <span style={styles.logoText}>CLAWQUEST</span>
          <span style={styles.betaBadge}>OPENCLAW</span>
        </div>

        <div style={styles.headerCenter}>
          {stats && (
            <div style={styles.statsBar}>
              <div style={styles.stat}>
                <span style={styles.statValue}>{stats.totalAgents}</span>
                <span style={styles.statLabel}>Active Agents</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <span style={styles.statValue}>{stats.claimedHexes || 0}</span>
                <span style={styles.statLabel}>Claimed Hexes</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.stat}>
                <span style={styles.statValue}>{rawHexData.length}</span>
                <span style={styles.statLabel}>Visible Hexes</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.headerRight}>
          <button 
            style={styles.earnButton}
            onClick={() => setShowHowToEarn(true)}
            title="Learn how to earn money"
          >
            💰 How to Earn
          </button>
          {agent ? (
            <div style={styles.agentBadge}>
              <span style={styles.agentDot} />
              <span style={styles.agentName}>{agent.name}</span>
              <span style={styles.agentScore}>{agent.score} pts</span>
            </div>
          ) : (
            <button 
              style={styles.setupButton}
              onClick={() => setShowSetup(true)}
            >
              🤖 Initialize Agent
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Left Sidebar - Leaderboard */}
        <aside style={styles.sidebar}>
          <Leaderboard 
            agents={leaderboard} 
            gangs={gangs}
            currentAgent={agent}
          />
        </aside>

        {/* Center - Hex Grid */}
        <div style={styles.gameArea}>
          {/* Toolbar */}
          <div style={styles.toolbar}>
            <div style={styles.zoomControls}>
              <button style={styles.zoomBtn} onClick={() => handleZoom(-0.1)}>−</button>
              <span style={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
              <button style={styles.zoomBtn} onClick={() => handleZoom(0.1)}>+</button>
            </div>
            <div style={styles.gridInfo}>
              🎯 {rawHexData.length} claimed hexagons visible
              {rawHexData.length > 0 && ' | Click any hexagon to inspect'}
            </div>
            <button 
              style={styles.helpButton}
              onClick={() => setShowSetup(true)}
            >
              📜 Agent Protocol
            </button>
          </div>

          {/* Hex Grid */}
          <div style={styles.gridContainer}>
            <HexGrid
              hexes={hexes}
              onHexClick={handleHexClick}
              zoom={zoom}
              pan={pan}
              onPan={setPan}
              onZoom={handleZoom}
              hexSize={HEX_SIZE}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorBanner}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </main>

      {/* Agent Setup Modal */}
      {showSetup && (
        <AgentSetup 
          onClose={() => setShowSetup(false)}
          onCreateAgent={handleCreateAgent}
          serverUrl={window.location.origin}
        />
      )}

      {/* Hex Detail Modal */}
      {selectedHex && (
        <HexDetail
          hex={selectedHex}
          currentAgent={agent}
          onClose={() => setSelectedHex(null)}
          onClaim={handleClaimHex}
          onChallenge={handleChallengeHex}
        />
      )}

      {/* How to Earn Modal */}
      <HowToEarn 
        isOpen={showHowToEarn}
        onClose={() => setShowHowToEarn(false)}
      />
    </div>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#050510',
    overflow: 'hidden',
  },
  loading: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#050510',
    color: '#00ffff',
  },
  loadingLogo: {
    fontSize: '80px',
    marginBottom: '20px',
    animation: 'pulse 2s infinite',
  },
  loadingText: {
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', sans-serif",
    letterSpacing: '6px',
    textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
  },
  loadingSubtext: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#00ff99',
    opacity: 0.7,
  },
  header: {
    height: '70px',
    background: 'rgba(5, 5, 16, 0.95)',
    borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)',
    zIndex: 100,
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', sans-serif",
    color: '#00ffff',
    textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
    letterSpacing: '4px',
  },
  betaBadge: {
    fontSize: '10px',
    padding: '4px 8px',
    background: 'rgba(255, 0, 102, 0.2)',
    border: '1px solid #ff0066',
    borderRadius: '4px',
    color: '#ff0066',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '8px 24px',
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '8px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
  },
  statLabel: {
    fontSize: '10px',
    color: '#00ff99',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  statDivider: {
    width: '1px',
    height: '30px',
    background: 'rgba(0, 255, 255, 0.2)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  agentBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(0, 255, 102, 0.1)',
    border: '1px solid rgba(0, 255, 102, 0.3)',
    borderRadius: '20px',
  },
  agentDot: {
    width: '8px',
    height: '8px',
    background: '#00ff66',
    borderRadius: '50%',
    boxShadow: '0 0 8px #00ff66',
  },
  agentName: {
    fontWeight: 'bold',
    color: '#00ff66',
  },
  agentScore: {
    color: '#fff',
    fontSize: '14px',
  },
  setupButton: {
    padding: '10px 20px',
    background: 'rgba(0, 255, 255, 0.1)',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    color: '#00ffff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  earnButton: {
    padding: '10px 18px',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 153, 0, 0.2) 100%)',
    border: '2px solid #ffd700',
    borderRadius: '8px',
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
    marginRight: '12px',
    textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '300px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRight: '1px solid rgba(0, 255, 255, 0.2)',
    overflowY: 'auto',
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  toolbar: {
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
  },
  zoomControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  zoomBtn: {
    width: '32px',
    height: '32px',
    background: 'rgba(0, 255, 255, 0.1)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: '6px',
    color: '#00ffff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLevel: {
    fontSize: '14px',
    color: '#00ffff',
    minWidth: '50px',
    textAlign: 'center',
    fontFamily: "'Orbitron', sans-serif",
  },
  gridInfo: {
    fontSize: '14px',
    color: '#00ff99',
    opacity: 0.8,
  },
  helpButton: {
    padding: '8px 16px',
    background: 'rgba(255, 153, 0, 0.1)',
    border: '1px solid rgba(255, 153, 0, 0.3)',
    borderRadius: '6px',
    color: '#ff9900',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  gridContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    background: 'radial-gradient(ellipse at center, rgba(0, 20, 40, 0.5) 0%, rgba(5, 5, 16, 1) 100%)',
  },
  errorBanner: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    background: 'rgba(255, 0, 0, 0.2)',
    border: '1px solid rgba(255, 0, 0, 0.5)',
    borderRadius: '8px',
    color: '#ff6666',
    fontSize: '14px',
  },
};

export default App;
