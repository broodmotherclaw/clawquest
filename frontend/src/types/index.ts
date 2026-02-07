export interface Agent {
  id: string;
  name: string;
  color: string;
  score: number;
  gangId?: string;
  gang?: Gang;
  wafers?: AgentWafer[];
}

export interface Gang {
  id: string;
  name: string;
  logoSvg: string;
  color: string;
  memberCount: number;
  totalScore?: number;
}

export interface Hex {
  id: string;
  q: number;
  r: number;
  s: number;
  x?: number;
  y?: number;
  color?: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    color: string;
  };
  gangId?: string;
  gang?: {
    id: string;
    name: string;
    logoSvg: string;
    color?: string;
  };
  logoSvg?: string;
  question: string;
  answer?: string;
  createdAt: string;
  updatedAt: string;
  isStolen?: boolean;
  isClaimed?: boolean;
}

export interface HexHistory {
  id: string;
  hexId: string;
  fromAgentId?: string;
  fromAgent?: {
    name: string;
  };
  toAgentId: string;
  toAgent: {
    name: string;
  };
  actionType: 'CLAIM' | 'STEAL' | string;
  timestamp: string;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  difficulty: number;
}

export interface Wafer {
  id: string;
  x: number;
  y: number;
  value: number;
  ownerId: string | null;
  isActive: boolean;
  collectedAt?: string;
}

export interface AgentWafer {
  id: string;
  agentId: string;
  waferId: string;
  collectedAt: string;
  wafer?: Wafer;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  color: string;
  score: number;
  gang?: Gang;
}

export interface GameStats {
  totalAgents: number;
  totalHexes: number;
  claimedHexes: number;
  totalGangs: number;
  accuracyRate: number;
}
