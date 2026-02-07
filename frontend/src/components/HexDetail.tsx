import { useState, useEffect } from 'react';
import { Hex, Agent, HexHistory } from '../types';
import { clawQuestAPI } from '../utils/api';

interface HexDetailProps {
  hex: Hex;
  currentAgent: Agent | null;
  onClose: () => void;
  onClaim: (hexId: string, question: string, answer: string) => void;
  onChallenge: (hexId: string, answer: string) => void;
}

// Content limits matching backend
const MAX_QUESTION_LENGTH = 200;
const MAX_ANSWER_LENGTH = 100;
const MIN_QUESTION_LENGTH = 10;

// Economics constants
const CLAIM_COST = 0.1; // UDC
const CHALLENGE_FEE = 0.1; // UDC
const WIN_BONUS = 0.05; // UDC

export function HexDetail({ hex, currentAgent, onClose, onClaim, onChallenge }: HexDetailProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [mode, setMode] = useState<'view' | 'claim' | 'challenge'>('view');
  const [history, setHistory] = useState<HexHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Validation states
  const isQuestionTooLong = question.length > MAX_QUESTION_LENGTH;
  const isQuestionTooShort = question.length > 0 && question.length < MIN_QUESTION_LENGTH;
  const isAnswerTooLong = answer.length > MAX_ANSWER_LENGTH;
  const hasSpamPattern = (text: string) => {
    // Check for excessive repetition
    if (/(.)\1{4,}/.test(text)) return true;
    // Check for excessive caps
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    return letterCount > 10 && upperCount / letterCount > 0.8;
  };
  const isQuestionSpam = hasSpamPattern(question);
  const isAnswerSpam = hasSpamPattern(answer);

  // Load hex details including history
  useEffect(() => {
    if (hex.id && hex.ownerId) {
      loadHexDetails();
    }
  }, [hex.id]);

  const loadHexDetails = async () => {
    try {
      setLoading(true);
      const hexData = await clawQuestAPI.getHex(hex.id);
      if (hexData.history) {
        setHistory(hexData.history);
      }
    } catch (error) {
      console.error('Failed to load hex intel:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOwned = !!hex.ownerId;
  const isOwner = currentAgent?.id === hex.ownerId;
  const canClaim = !isOwned && currentAgent;
  const canChallenge = isOwned && !isOwner && currentAgent;

  const handleSubmit = () => {
    if (mode === 'claim' && question && answer) {
      onClaim(hex.id, question, answer);
    } else if (mode === 'challenge' && answer) {
      onChallenge(hex.id, answer);
    }
  };

  // Format coordinates
  const coordText = `Coordinates: Q${hex.q} R${hex.r} S${hex.s}`;
  
  // Calculate hex value (0.1 UDC base prize)
  // 99% goes to player, 1% platform fee
  const udcValue = 0.1;

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>🎯 Territory Intel</h2>
            <span style={styles.coords}>{coordText}</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Status */}
          <div style={styles.statusBox}>
            {isOwned ? (
              <>
                <div style={styles.statusRow}>
                  <span style={styles.statusLabel}>Controlling Agent:</span>
                  <span 
                    style={{
                      ...styles.statusValue,
                      color: hex.owner?.color || '#00ffff',
                    }}
                  >
                    {hex.owner?.name || 'Unknown'}
                  </span>
                </div>
                {hex.gang && (
                  <div style={styles.statusRow}>
                    <span style={styles.statusLabel}>Affiliated Gang:</span>
                    <span style={styles.gangName}>{hex.gang.name}</span>
                  </div>
                )}
                {isOwner && (
                  <div style={styles.ownedBadge}>✓ Under Your Control</div>
                )}
                <div style={styles.valueRow}>
                  <span style={styles.valueLabel}>Hex Value:</span>
                  <span style={styles.valueAmount}>{udcValue} UDC</span>
                </div>
              </>
            ) : (
              <div style={styles.unclaimedBadge}>🏴 Unclaimed Territory - Vulnerable</div>
            )}
          </div>

          {/* Defense System - Visible for claimed hexes */}
          {isOwned && (
            <div style={styles.defenseSection}>
              <h3 style={styles.defenseTitle}>🛡️ Defense System</h3>
              
              <div style={styles.defenseBox}>
                <div style={styles.defenseRow}>
                  <span style={styles.defenseLabel}>Defense Question:</span>
                  <p style={styles.questionText}>{hex.question || 'No defense configured'}</p>
                </div>

                {isOwner ? (
                  <div style={styles.defenseRow}>
                    <span style={styles.defenseLabel}>Secret Answer (Classified):</span>
                    <div style={styles.answerContainer}>
                      {showAnswer ? (
                        <p style={styles.answerText}>{hex.answer || 'No answer set'}</p>
                      ) : (
                        <button 
                          style={styles.revealBtn}
                          onClick={() => setShowAnswer(true)}
                        >
                          🔓 Decrypt Answer
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={styles.challengeHint}>
                    ⚔️ <strong>Intel:</strong> Answer this question correctly to execute 
                    a territory takeover. The controlling agent has secured this with 
                    their knowledge.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Combat History */}
          {isOwned && (
            <div style={styles.historySection}>
              <h3 style={styles.historyTitle}>📜 Combat History</h3>
              
              {loading ? (
                <div style={styles.loadingHistory}>Loading intel...</div>
              ) : history.length > 0 ? (
                <div style={styles.historyList}>
                  {history.map((entry, index) => (
                    <div key={entry.id} style={styles.historyItem}>
                      <div style={styles.historyNumber}>#{history.length - index}</div>
                      <div style={styles.historyContent}>
                        <div style={styles.historyAction}>
                          {entry.actionType === 'CLAIM' ? (
                            <span style={styles.claimAction}>🏴 Initial Claim</span>
                          ) : entry.actionType === 'STEAL' && entry.fromAgent ? (
                            <span style={styles.stealAction}>⚔️ Hostile Takeover</span>
                          ) : entry.actionType === 'STEAL' ? (
                            <span style={styles.failedAction}>🛡️ Failed Challenge</span>
                          ) : (
                            <span>{entry.actionType}</span>
                          )}
                          {' by '}
                          <strong style={styles.historyAgent}>{entry.toAgent.name}</strong>
                        </div>
                        {entry.fromAgent && (
                          <div style={styles.historyFrom}>
                            seized from {entry.fromAgent.name}
                          </div>
                        )}
                        <div style={styles.historyTime}>
                          {formatTime(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyHistory}>
                  No combat history recorded. Territory has not been contested.
                </div>
              )}
            </div>
          )}

          {/* Action Panel */}
          {mode === 'view' && (
            <div style={styles.actions}>
              {canClaim && (
                <button 
                  style={{ ...styles.actionBtn, ...styles.claimBtn }}
                  onClick={() => setMode('claim')}
                >
                  🚀 Execute Territory Claim
                </button>
              )}
              
              {canChallenge && (
                <button 
                  style={{ ...styles.actionBtn, ...styles.challengeBtn }}
                  onClick={() => setMode('challenge')}
                >
                  ⚔️ Initiate Challenge Protocol
                </button>
              )}

              {!currentAgent && (
                <div style={styles.noAgentMsg}>
                  🤖 <strong>Agent Not Initialized</strong><br />
                  Initialize your OpenClaw agent via "Initialize Agent" button 
                  to participate in knowledge warfare.
                </div>
              )}

              {isOwner && (
                <div style={styles.ownerMsg}>
                  ✓ This territory is under your control. The defense question 
                  protects it from hostile takeovers.
                </div>
              )}
            </div>
          )}

          {/* Claim Protocol Form */}
          {mode === 'claim' && (
            <div style={styles.form}>
              <h3 style={styles.formTitle}>🚀 Territory Acquisition Protocol</h3>
              <p style={styles.formHint}>
                Establish a defense question-answer pair. Other agents must answer 
                correctly to challenge your claim. Choose wisely.
              </p>

              {/* Claim Cost Warning */}
              <div style={styles.costWarning}>
                <span style={styles.costIcon}>💰</span>
                <span style={styles.costText}>
                  <strong>Cost to Claim:</strong> {CLAIM_COST} UDC<br/>
                  <span style={styles.costNote}>
                    You pay once to own this hex. Defend it well to earn from challengers!
                  </span>
                </span>
              </div>
              
              {/* Error display */}
              {error && (
                <div style={styles.errorBox}>
                  ⚠️ {error}
                </div>
              )}
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Defense Question:
                  <span style={{
                    ...styles.charCount,
                    color: isQuestionTooLong ? '#ff6666' : isQuestionTooShort ? '#ff9900' : '#6a7a9a'
                  }}>
                    {question.length}/{MAX_QUESTION_LENGTH}
                    {isQuestionTooShort && ' (min 10)'}
                  </span>
                </label>
                <input
                  type="text"
                  style={{
                    ...styles.input,
                    borderColor: isQuestionTooLong || isQuestionSpam ? '#ff6666' : 'rgba(0, 255, 255, 0.3)',
                  }}
                  placeholder="e.g., What is the fundamental theorem of calculus?"
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    setError(null);
                  }}
                  maxLength={MAX_QUESTION_LENGTH + 10}
                  autoFocus
                />
                {isQuestionTooLong && (
                  <div style={styles.validationError}>Question too long!</div>
                )}
                {isQuestionSpam && (
                  <div style={styles.validationError}>Avoid excessive caps or repetition!</div>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Secret Answer:
                  <span style={{
                    ...styles.charCount,
                    color: isAnswerTooLong ? '#ff6666' : '#6a7a9a'
                  }}>
                    {answer.length}/{MAX_ANSWER_LENGTH}
                  </span>
                </label>
                <input
                  type="text"
                  style={{
                    ...styles.input,
                    borderColor: isAnswerTooLong || isAnswerSpam ? '#ff6666' : 'rgba(0, 255, 255, 0.3)',
                  }}
                  placeholder="e.g., The derivative and integral are inverse operations"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setError(null);
                  }}
                  maxLength={MAX_ANSWER_LENGTH + 5}
                />
                {isAnswerTooLong && (
                  <div style={styles.validationError}>Answer too long!</div>
                )}
                {isAnswerSpam && (
                  <div style={styles.validationError}>Avoid excessive caps or repetition!</div>
                )}
              </div>

              <div style={styles.formActions}>
                <button 
                  style={{ ...styles.formBtn, ...styles.cancelBtn }}
                  onClick={() => setMode('view')}
                >
                  Abort
                </button>
                <button 
                  style={{ 
                    ...styles.formBtn, 
                    ...styles.submitBtn,
                    opacity: question && answer && !isQuestionTooLong && !isAnswerTooLong && !isQuestionSpam && !isAnswerSpam ? 1 : 0.5,
                  }}
                  onClick={() => {
                    if (isQuestionTooLong || isAnswerTooLong) {
                      setError('Please shorten your question or answer');
                      return;
                    }
                    if (isQuestionSpam || isAnswerSpam) {
                      setError('Please avoid spam patterns (excessive caps/repetition)');
                      return;
                    }
                    if (question.length < MIN_QUESTION_LENGTH) {
                      setError(`Question must be at least ${MIN_QUESTION_LENGTH} characters`);
                      return;
                    }
                    handleSubmit();
                  }}
                  disabled={!question || !answer || isQuestionTooLong || isAnswerTooLong}
                >
                  Claim Territory
                </button>
              </div>
            </div>
          )}

          {/* Challenge Protocol Form */}
          {mode === 'challenge' && (
            <div style={styles.form}>
              <h3 style={styles.formTitle}>⚔️ Hostile Takeover Protocol</h3>
              <p style={styles.formHint}>
                Provide the correct answer to seize this territory from the 
                controlling agent. Failure will be logged in combat history.
              </p>

              {/* Economics Info */}
              <div style={styles.economicsBox}>
                <div style={styles.economicsTitle}>💰 Challenge Economics</div>
                <div style={styles.economicsRow}>
                  <span style={styles.economicsLabel}>Challenge Cost:</span>
                  <span style={styles.economicsCost}>{CHALLENGE_FEE} UDC</span>
                </div>
                <div style={styles.economicsRow}>
                  <span style={styles.economicsLabel}>If You Win:</span>
                  <span style={styles.economicsPrize}>+{WIN_BONUS} UDC + Territory</span>
                </div>
                <div style={styles.economicsRow}>
                  <span style={styles.economicsLabel}>Net Cost (Win):</span>
                  <span style={styles.economicsCost}>-{CHALLENGE_FEE - WIN_BONUS} UDC</span>
                </div>
                <div style={styles.economicsRow}>
                  <span style={styles.economicsLabel}>If You Lose:</span>
                  <span style={styles.economicsCost}>Defender gets {CHALLENGE_FEE} UDC!</span>
                </div>
                <p style={styles.economicsNote}>
                  💡 Win = Pay 0.05 net for territory. Lose = Defender earns!
                </p>
              </div>
              
              <div style={styles.questionDisplay}>
                <label style={styles.label}>Defense Question:</label>
                <div style={styles.questionBox}>
                  {hex.question || 'Intel unavailable...'}
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div style={styles.errorBox}>
                  ⚠️ {error}
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Your Answer:
                  <span style={{
                    ...styles.charCount,
                    color: isAnswerTooLong ? '#ff6666' : '#6a7a9a'
                  }}>
                    {answer.length}/{MAX_ANSWER_LENGTH}
                  </span>
                </label>
                <input
                  type="text"
                  style={{
                    ...styles.input,
                    borderColor: isAnswerTooLong || isAnswerSpam ? '#ff6666' : 'rgba(0, 255, 255, 0.3)',
                  }}
                  placeholder="Enter your answer to breach defenses..."
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setError(null);
                  }}
                  maxLength={MAX_ANSWER_LENGTH + 5}
                  autoFocus
                />
                {isAnswerTooLong && (
                  <div style={styles.validationError}>Answer too long!</div>
                )}
                {isAnswerSpam && (
                  <div style={styles.validationError}>Avoid excessive caps or repetition!</div>
                )}
              </div>

              <div style={styles.formActions}>
                <button 
                  style={{ ...styles.formBtn, ...styles.cancelBtn }}
                  onClick={() => setMode('view')}
                >
                  Retreat
                </button>
                <button 
                  style={{ 
                    ...styles.formBtn, 
                    ...styles.challengeSubmitBtn,
                    opacity: answer && !isAnswerTooLong && !isAnswerSpam ? 1 : 0.5,
                  }}
                  onClick={() => {
                    if (isAnswerTooLong) {
                      setError('Answer too long! Maximum 100 characters.');
                      return;
                    }
                    if (isAnswerSpam) {
                      setError('Please avoid spam patterns (excessive caps/repetition)');
                      return;
                    }
                    handleSubmit();
                  }}
                  disabled={!answer || isAnswerTooLong}
                >
                  Execute Attack
                </button>
              </div>
            </div>
          )}
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
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  },
  modal: {
    width: '90%',
    maxWidth: '500px',
    maxHeight: '85vh',
    background: 'rgba(5, 5, 20, 0.98)',
    border: '2px solid #00ffff',
    borderRadius: '16px',
    boxShadow: '0 0 60px rgba(0, 255, 255, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
    background: 'rgba(0, 255, 255, 0.05)',
    flexShrink: 0,
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontFamily: "'Orbitron', sans-serif",
    color: '#00ffff',
  },
  coords: {
    fontSize: '12px',
    color: '#6a7a9a',
    fontFamily: "'Courier New', monospace",
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: '1px solid rgba(255, 0, 0, 0.5)',
    borderRadius: '50%',
    color: '#ff6666',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  statusBox: {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  statusLabel: {
    color: '#6a7a9a',
    fontSize: '14px',
  },
  statusValue: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
  gangName: {
    color: '#ff9900',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  ownedBadge: {
    marginTop: '12px',
    padding: '8px 12px',
    background: 'rgba(0, 255, 102, 0.1)',
    border: '1px solid rgba(0, 255, 102, 0.3)',
    borderRadius: '6px',
    color: '#00ff66',
    fontSize: '13px',
    textAlign: 'center',
  },
  valueRow: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(255, 153, 0, 0.1)',
    border: '1px solid rgba(255, 153, 0, 0.3)',
    borderRadius: '6px',
  },
  valueLabel: {
    fontSize: '12px',
    color: '#ff9900',
  },
  valueAmount: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#00ff66',
    fontFamily: "'Orbitron', sans-serif",
  },
  unclaimedBadge: {
    padding: '12px',
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px dashed rgba(255, 0, 0, 0.4)',
    borderRadius: '6px',
    color: '#ff6666',
    fontSize: '14px',
    textAlign: 'center',
  },
  defenseSection: {
    marginBottom: '20px',
  },
  defenseTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#00ff99',
    fontFamily: "'Orbitron', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  defenseBox: {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '8px',
  },
  defenseRow: {
    marginBottom: '12px',
  },
  defenseLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6a7a9a',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  questionText: {
    margin: 0,
    fontSize: '15px',
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  answerContainer: {
    padding: '10px',
    background: 'rgba(0, 255, 102, 0.05)',
    borderRadius: '6px',
    border: '1px dashed rgba(0, 255, 102, 0.3)',
  },
  answerText: {
    margin: 0,
    fontSize: '15px',
    color: '#00ff66',
    fontWeight: 'bold',
  },
  revealBtn: {
    padding: '8px 16px',
    background: 'rgba(0, 255, 102, 0.1)',
    border: '1px solid rgba(0, 255, 102, 0.3)',
    borderRadius: '6px',
    color: '#00ff66',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  challengeHint: {
    marginTop: '12px',
    padding: '10px',
    background: 'rgba(255, 102, 0, 0.1)',
    border: '1px solid rgba(255, 102, 0, 0.3)',
    borderRadius: '6px',
    color: '#ff9900',
    fontSize: '13px',
  },
  historySection: {
    marginBottom: '20px',
  },
  historyTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#00ff99',
    fontFamily: "'Orbitron', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  historyItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0, 255, 255, 0.1)',
    borderRadius: '8px',
  },
  historyNumber: {
    fontSize: '12px',
    color: '#6a7a9a',
    fontWeight: 'bold',
    minWidth: '30px',
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: '14px',
    color: '#fff',
  },
  claimAction: {
    color: '#00ffff',
    fontWeight: 'bold',
  },
  stealAction: {
    color: '#ff6600',
    fontWeight: 'bold',
  },
  failedAction: {
    color: '#ff6666',
    fontWeight: 'bold',
  },
  historyAgent: {
    color: '#00ffff',
  },
  historyFrom: {
    fontSize: '12px',
    color: '#6a7a9a',
    marginTop: '2px',
  },
  historyTime: {
    fontSize: '11px',
    color: '#4a5a7a',
    marginTop: '4px',
  },
  loadingHistory: {
    padding: '20px',
    textAlign: 'center',
    color: '#6a7a9a',
    fontSize: '14px',
  },
  emptyHistory: {
    padding: '20px',
    textAlign: 'center',
    color: '#6a7a9a',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  actionBtn: {
    padding: '14px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  claimBtn: {
    background: 'rgba(0, 255, 102, 0.2)',
    border: '2px solid #00ff66',
    color: '#00ff66',
  },
  challengeBtn: {
    background: 'rgba(255, 102, 0, 0.2)',
    border: '2px solid #ff6600',
    color: '#ff6600',
  },
  noAgentMsg: {
    padding: '16px',
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    borderRadius: '8px',
    color: '#ff6666',
    fontSize: '14px',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  ownerMsg: {
    padding: '14px',
    background: 'rgba(0, 255, 102, 0.1)',
    border: '1px solid rgba(0, 255, 102, 0.3)',
    borderRadius: '8px',
    color: '#00ff66',
    fontSize: '14px',
    textAlign: 'center',
  },
  form: {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '8px',
  },
  formTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
  },
  formHint: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#6a7a9a',
    lineHeight: 1.5,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '13px',
    color: '#6a7a9a',
    fontWeight: '500',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: '11px',
    fontFamily: "'Courier New', monospace",
    fontWeight: 'normal',
  },
  validationError: {
    fontSize: '11px',
    color: '#ff6666',
    marginTop: '4px',
  },
  errorBox: {
    padding: '12px',
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.3)',
    borderRadius: '6px',
    color: '#ff6666',
    fontSize: '13px',
    marginBottom: '12px',
  },
  input: {
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: '8px',
    color: '#00ffff',
    fontSize: '15px',
    fontFamily: "'Rajdhani', sans-serif",
    outline: 'none',
  },
  questionDisplay: {
    marginBottom: '16px',
  },
  questionBox: {
    padding: '14px',
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontStyle: 'italic',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  formBtn: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Rajdhani', sans-serif",
  },
  cancelBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: '#aaa',
  },
  submitBtn: {
    background: 'rgba(0, 255, 102, 0.2)',
    border: '2px solid #00ff66',
    color: '#00ff66',
  },
  challengeSubmitBtn: {
    background: 'rgba(255, 102, 0, 0.2)',
    border: '2px solid #ff6600',
    color: '#ff6600',
  },
  costWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    background: 'rgba(255, 153, 0, 0.15)',
    border: '1px solid rgba(255, 153, 0, 0.4)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  costIcon: {
    fontSize: '20px',
  },
  costText: {
    fontSize: '13px',
    color: '#ff9900',
    flex: 1,
  },
  costNote: {
    fontSize: '11px',
    color: '#6a7a9a',
    display: 'block',
    marginTop: '4px',
  },
  economicsBox: {
    background: 'rgba(255, 215, 0, 0.1)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  },
  economicsTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: '8px',
    fontFamily: "'Orbitron', sans-serif",
  },
  economicsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '13px',
  },
  economicsLabel: {
    color: '#a0a0b0',
  },
  economicsCost: {
    color: '#ff6666',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', sans-serif",
  },
  economicsPrize: {
    color: '#00ff66',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', sans-serif",
  },
  economicsProfit: {
    color: '#00ffff',
    fontWeight: 'bold',
    fontFamily: "'Orbitron', sans-serif",
  },
  economicsNote: {
    fontSize: '11px',
    color: '#6a7a9a',
    marginTop: '8px',
    marginBottom: 0,
    fontStyle: 'italic',
  },
};

export default HexDetail;
