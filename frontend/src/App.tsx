import { useState, useEffect } from 'react';
import {
  createAgent,
  getAgents,
  getAgentQuestions,
  submitAnswer,
  claimHex,
  getHexes,
  getLeaderboard,
  getStats,
  createGang,
  joinGang,
  getGang,
  getGangs,
} from './utils/api';
import { Agent, Hex, Question, Gang } from './types';
import GangFilter from './components/GangFilter';
import GangDetail from './components/GangDetail';
import Hexagon from './components/Hexagon';

const HEX_RADIUS = 26;
const HEX_WIDTH = HEX_RADIUS * Math.sqrt(3);
const HEX_HEIGHT = HEX_RADIUS * 2;

function App() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [hexes, setHexes] = useState<Hex[]>([]);
  const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [selectedGangId, setSelectedGangId] = useState<string | null>(null);
  const [selectedGang, setSelectedGang] = useState<Gang | null>(null);
  const [leaderboard, setLeaderboard] = useState<Agent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showGangCreate, setShowGangCreate] = useState(false);
  const [gangName, setGangName] = useState('');

  // Initialize agent
  useEffect(() => {
    initializeAgent();
  }, []);

  // Load hexes and leaderboard
  useEffect(() => {
    loadHexes();
    loadLeaderboard();
    loadGangs();
    loadStats();
  }, []);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');

    socket.onopen = () => {
      console.log('Connected to WebSocket');
      socket.send(JSON.stringify({ type: 'join-hex-updates' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'hex-updated' || data.type === 'hex-claimed') {
        loadHexes();
      }
      if (data.type === 'gang-created' || data.type === 'gang-joined') {
        loadGangs();
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  const initializeAgent = async () => {
    const colors = ['#00ffff', '#ff00ff', '#00aaff', '#9900ff', '#00ff66', '#ff6600', '#ff0066', '#66ff00'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomName = `Agent-${Math.floor(Math.random() * 10000)}`;

    try {
      const newAgent = await createAgent(randomName, randomColor);
      setAgent(newAgent);
      loadQuestions(newAgent.id);
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const loadQuestions = async (agentId: string) => {
    try {
      const loadedQuestions = await getAgentQuestions(agentId);
      setQuestions(loadedQuestions);
      setCurrentQuestion(loadedQuestions[0]);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const loadHexes = async () => {
    try {
      const loadedHexes = await getHexes();
      setHexes(loadedHexes);
    } catch (error) {
      console.error('Failed to load hexes:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const loadedLeaderboard = await getLeaderboard(20);
      setLeaderboard(loadedLeaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const loadGangs = async () => {
    try {
      const loadedGangs = await getGangs(50);
      setGangs(loadedGangs);
    } catch (error) {
      console.error('Failed to load gangs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const loadedStats = await getStats();
      setStats(loadedStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !agent) return;

    try {
      const result = await submitAnswer(agent.id, currentQuestion.id, answer);
      
      // Find next unanswered question
      const nextQuestion = questions.find((q, index) => {
        if (q.id === currentQuestion.id && index + 1 < questions.length) {
          return !leaderboard.some(l => l.score > 0);
        }
        return false;
      });

      setCurrentQuestion(nextQuestion || null);
      setAnswer('');

      // Update leaderboard
      loadLeaderboard();
      loadStats();
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleHexClick = async (hex: Hex) => {
    if (!agent) return;
    setSelectedHex(hex);
  };

  const handleClaimHex = async () => {
    if (!selectedHex || !agent) return;

    try {
      await claimHex(agent.id, selectedHex.q, selectedHex.r);
      await loadHexes();
      await loadStats();
      setSelectedHex(null);
    } catch (error) {
      console.error('Failed to claim hex:', error);
    }
  };

  const handleCreateGang = async () => {
    if (!agent || !gangName) return;

    try {
      const gang = await createGang(agent.id, gangName);
      setShowGangCreate(false);
      setGangName('');
      loadGangs();
    } catch (error) {
      console.error('Failed to create gang:', error);
    }
  };

  const handleJoinGang = async (gangId: string) => {
    if (!agent) return;

    try {
      const gang = await joinGang(agent.id, gangId);
      loadGangs();
      loadHexes();
    } catch (error) {
      console.error('Failed to join gang:', error);
    }
  };

  // Filter hexes by selected gang
  const filteredHexes = selectedGangId
    ? hexes.filter(hex => hex.gangId === selectedGangId)
    : hexes;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="logo">🦞 CLAWQUEST</div>
        <div className="agent-info">
          {agent && (
            <>
              <div className="agent-name" style={{ color: agent.color }}>
                {agent.name}
              </div>
              <div className="agent-score">Score: {agent.score}</div>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {/* Gang Filter Sidebar */}
        <aside className="gang-sidebar">
          <GangFilter
            gangs={gangs}
            selectedGangId={selectedGangId}
            onGangSelect={setSelectedGangId}
          />

          {!agent?.gangId && (
            <button
              className="btn-create-gang"
              onClick={() => setShowGangCreate(true)}
            >
              Create Gang
            </button>
          )}

          {showGangCreate && (
            <div className="create-gang-form">
              <input
                type="text"
                placeholder="Gang name"
                value={gangName}
                onChange={(e) => setGangName(e.target.value)}
                maxLength={30}
              />
              <button onClick={handleCreateGang}>Create</button>
              <button onClick={() => setShowGangCreate(false)}>Cancel</button>
            </div>
          )}
        </aside>

        {/* Hex Grid */}
        <div className="hex-grid-container">
          <div className="hex-grid">
            {filteredHexes.map(hex => (
              <Hexagon
                key={`${hex.q},${hex.r}`}
                q={hex.q}
                r={hex.r}
                x={hex.x}
                y={hex.y}
                color={hex.color}
                ownerId={hex.ownerId}
                gangLogoSvg={hexes.find(h => h.gangId === hex.gangId)?.logoSvg || null}
                isStolen={hex.gangId && hex.gangId !== agent?.gangId}
                isClaimed={!!hex.ownerId}
                onClick={() => handleHexClick(hex)}
                selected={selectedHex?.q === hex.q && selectedHex?.r === hex.r}
              />
            ))}
          </div>
        </div>

        {/* Leaderboard & Stats */}
        <aside className="leaderboard-sidebar">
          <div className="leaderboard">
            <h3>Leaderboard</h3>
            {leaderboard.map((leader, index) => (
              <div
                key={leader.id}
                className={`leaderboard-item ${agent?.id === leader.id ? 'current-agent' : ''}`}
              >
                <div className="rank">#{index + 1}</div>
                <div className="agent-info">
                  <div className="name" style={{ color: leader.color }}>
                    {leader.name}
                  </div>
                  <div className="score">{leader.score} pts</div>
                </div>
              </div>
            ))}
          </div>

          {stats && (
            <div className="stats">
              <h3>Stats</h3>
              <div className="stat-item">
                <div className="stat-label">Total Agents</div>
                <div className="stat-value">{stats.totalAgents}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Hexes</div>
                <div className="stat-value">{stats.totalHexes}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Accuracy</div>
                <div className="stat-value">{(stats.accuracyRate * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* Question Modal */}
      {currentQuestion && (
        <div className="question-modal" onClick={() => setCurrentQuestion(null)}>
          <div className="question-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setCurrentQuestion(null)}
            >
              ×
            </button>
            <div className="question-content">
              <h3>Question {questions.indexOf(currentQuestion) + 1}/{questions.length}</h3>
              <p>{currentQuestion.question}</p>
              <div className="answer-section">
                <input
                  type="text"
                  placeholder="Your answer..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAnswerSubmit();
                    }
                  }}
                  autoFocus
                />
                <button onClick={handleAnswerSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hex Detail Modal */}
      {selectedHex && (
        <div className="hex-detail-modal" onClick={() => setSelectedHex(null)}>
          <div className="hex-detail-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedHex(null)}
            >
              ×
            </button>
            <h3>Hex {selectedHex.q},{selectedHex.r}</h3>
            {selectedHex.ownerId ? (
              <div className="owner-info">
                <p>Owned by</p>
                <div className="owner">
                  {leaderboard.find(a => a.id === selectedHex.ownerId)?.name || 'Unknown'}
                </div>
              </div>
            ) : (
              <div className="claim-section">
                <p>Claim this hex for your agent!</p>
                <button onClick={handleClaimHex}>Claim</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gang Detail Modal */}
      {selectedGang && (
        <GangDetail
          gang={selectedGang}
          onClose={() => setSelectedGang(null)}
        />
      )}

      {/* CSS Styles */}
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Arial', sans-serif;
          background: #050510;
          color: #fff;
          overflow-x: hidden;
        }

        .app {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          height: 60px;
          background: rgba(0, 5, 16, 0.95);
          border: 1px solid rgba(0, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        }

        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
          letter-spacing: 2px;
        }

        .agent-info {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .agent-name {
          font-size: 14px;
          font-weight: bold;
        }

        .agent-score {
          font-size: 14px;
          color: #00ff99;
        }

        .app-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .gang-sidebar {
          width: 280px;
          background: rgba(0, 0, 0, 0.3);
          border-right: 1px solid rgba(0, 255, 255, 0.2);
          padding: 16px;
          overflow-y: auto;
        }

        .btn-create-gang {
          width: 100%;
          padding: 12px;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .btn-create-gang:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }

        .create-gang-form {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .create-gang-form input {
          padding: 8px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 4px;
          color: #00ffff;
          font-size: 14px;
        }

        .create-gang-form button {
          padding: 10px;
          background: rgba(0, 255, 255, 0.3);
          border: 1px solid #00ffff;
          color: #00ffff;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .hex-grid-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: rgba(0, 5, 16, 0.5);
        }

        .hex-grid {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .leaderboard-sidebar {
          width: 280px;
          background: rgba(0, 0, 0, 0.3);
          border-left: 1px solid rgba(0, 255, 255, 0.2);
          padding: 16px;
          overflow-y: auto;
        }

        .leaderboard h3,
        .stats h3 {
          color: #00ffff;
          font-size: 18px;
          margin-bottom: 16px;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }

        .leaderboard-item {
          display: flex;
          gap: 12px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 255, 255, 0.1);
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .leaderboard-item.current-agent {
          border-color: #00ffff;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }

        .rank {
          color: #00ff99;
          font-weight: bold;
          min-width: 30px;
        }

        .agent-info .name {
          font-size: 14px;
          font-weight: bold;
        }

        .agent-info .score {
          font-size: 12px;
          color: #00ff99;
        }

        .stats {
          margin-top: 20px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
        }

        .stat-label {
          color: #00ff99;
          font-size: 12px;
        }

        .stat-value {
          color: #00ffff;
          font-weight: bold;
          font-size: 14px;
        }

        /* Modal Styles */
        .question-modal,
        .hex-detail-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .question-card,
        .hex-detail-card {
          background: rgba(5, 5, 16, 0.95);
          border: 2px solid #00ffff;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 0 50px rgba(0, 255, 255, 0.4);
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #00ffff;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }

        .question-content {
          text-align: center;
        }

        .question-content h3 {
          color: #00ffff;
          margin-bottom: 20px;
          font-size: 20px;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .question-content p {
          color: #fff;
          font-size: 16px;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .answer-section {
          display: flex;
          gap: 12px;
        }

        .answer-section input {
          flex: 1;
          padding: 12px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 6px;
          color: #00ffff;
          font-size: 14px;
        }

        .answer-section button {
          padding: 12px 24px;
          background: rgba(0, 255, 255, 0.2);
          border: 1px solid #00ffff;
          border-radius: 6px;
          color: #00ffff;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .answer-section button:hover {
          background: rgba(0, 255, 255, 0.4);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
        }

        .hex-detail-card h3 {
          color: #00ffff;
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .owner-info,
        .claim-section {
          text-align: center;
        }

        .owner-info p {
          color: #00ff99;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .owner {
          color: #fff;
          font-size: 18px;
          font-weight: bold;
        }

        .claim-section p {
          color: #00ff99;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .claim-section button {
          padding: 14px 28px;
          background: rgba(0, 255, 255, 0.2);
          border: 1px solid #00ffff;
          border-radius: 8px;
          color: #00ffff;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .claim-section button:hover {
          background: rgba(0, 255, 255, 0.4);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}

export default App;
