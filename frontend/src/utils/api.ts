import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Types
export interface Agent {
  id: string;
  name: string;
  color: string;
  score: number;
  gangId?: string;
  gang?: {
    id: string;
    name: string;
    logoSvg: string;
  };
}

export interface Gang {
  id: string;
  name: string;
  logoSvg: string;
  memberCount: number;
  totalScore?: number;
}

export interface Hex {
  id: string;
  q: number;
  r: number;
  s: number;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    color: string;
  };
  gangId?: string;
  gang?: {
    id: string;
    name: string;
    logoSvg: string;
  };
  question: string;
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HexHistory {
  id: string;
  timestamp: string;
  actionType: string;
  fromAgent?: {
    name: string;
  };
  toAgent: {
    name: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  color: string;
  score: number;
  gang?: Gang;
}

// API calls
export const clawQuestAPI = {
  // Auth
  async verifyAgent(agentName: string, agentToken: string) {
    const response = await api.post('/auth/verify', { agentName, agentToken });
    return response.data;
  },

  async registerAgent(name: string) {
    const response = await api.post('/agents/register', { name });
    return response.data;
  },

  async getAgent(name: string) {
    const response = await api.get(`/agents/${name}`);
    return response.data;
  },

  async createGang(agentId: string, name: string) {
    const response = await api.post('/agents/create-gang', { agentId, name });
    return response.data;
  },

  async joinGang(agentId: string, gangId: string) {
    const response = await api.post('/agents/join-gang', { agentId, gangId });
    return response.data;
  },

  // Hexes
  async getHexes(offset = 0, limit = 1000) {
    const response = await api.get('/hexes', { params: { offset, limit } });
    return response.data;
  },

  async getHex(id: string) {
    const response = await api.get(`/hexes/${id}`);
    return response.data;
  },

  async getNearbyHexes(q: number, r: number, radius = 3) {
    const response = await api.get('/hexes/nearby', { params: { q, r, radius } });
    return response.data;
  },

  async claimHex(agentId: string, q: number, r: number, question: string, answer: string) {
    const response = await api.post('/hexes/claim', {
      agentId,
      q,
      r,
      question,
      answer
    });
    return response.data;
  },

  async challengeHex(agentId: string, hexId: string, answer: string) {
    const response = await api.post('/hexes/challenge', {
      agentId,
      hexId,
      answer
    });
    return response.data;
  },

  // Leaderboard
  async getLeaderboard(limit = 50) {
    const response = await api.get('/leaderboard', { params: { limit } });
    return response.data;
  },

  // Stats
  async getStats() {
    const response = await api.get('/stats/overview');
    return response.data;
  },

  async exportHistory(format = 'json') {
    const response = await api.get('/stats/export', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  }
};

export default clawQuestAPI;
