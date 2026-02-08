import axios from 'axios';
import { Agent, Gang, Hex, GameStats } from '../types';

// API URL - uses environment variable or defaults to current host
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  `${window.location.protocol}//${window.location.hostname}:3001/api`;

// OpenClaw Bot Authentication Headers
const BOT_HEADERS = {
  'X-OpenClaw-Bot': 'true',
  'X-OpenClaw-Bot-Secret': import.meta.env.VITE_OPENCLAW_BOT_SECRET
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...BOT_HEADERS
  }
});

export { API_BASE_URL, BOT_HEADERS };

export interface HexWithHistory extends Hex {
  history?: HexHistory[];
}

export interface HexHistory {
  id: string;
  hexId: string;
  fromAgentId?: string;
  fromAgent?: { name: string };
  toAgentId: string;
  toAgent: { name: string };
  actionType: 'CLAIM' | 'STEAL' | string;
  timestamp: string;
}

export const clawQuestAPI = {
  // Get base URL for manual fetch calls
  getBaseUrl(): string {
    return API_BASE_URL.replace(/\/api\/?$/, '');
  },
  // Auth & Agents - OpenClaw Bot endpoints
  async registerAgent(name: string, color: string): Promise<Agent> {
    const response = await api.post('/bots', { 
      name, 
      color, 
      botType: 'openclaw' 
    });
    return response.data.agent;
  },

  async getAgent(name: string): Promise<Agent> {
    const response = await api.get(`/bots/${name}`);
    return response.data;
  },

  // Gangs
  async getGangs(limit = 50): Promise<Gang[]> {
    try {
      const response = await api.get('/gangs', { params: { limit } });
      return response.data || [];
    } catch {
      return [];
    }
  },

  async createGang(agentId: string, name: string): Promise<Gang> {
    const response = await api.post('/gangs/create', { agentId, name });
    return response.data;
  },

  async joinGang(agentId: string, gangId: string): Promise<Gang> {
    const response = await api.post('/gangs/join', { agentId, gangId });
    return response.data;
  },

  // Hexes
  async getHexes(offset = 0, limit = 1000): Promise<Hex[]> {
    try {
      const response = await api.get('/hexes', { params: { offset, limit } });
      return response.data.hexes || [];
    } catch {
      return [];
    }
  },

  async getHex(id: string): Promise<HexWithHistory> {
    const response = await api.get(`/hexes/${id}`);
    return response.data.hex;
  },

  async getNearbyHexes(q: number, r: number, radius = 3): Promise<Hex[]> {
    const response = await api.get('/hexes/nearby', { params: { q, r, radius } });
    return response.data.hexes;
  },

  async claimHex(agentId: string, q: number, r: number, question: string, answer: string): Promise<Hex> {
    const response = await api.post('/hexes/claim', {
      agentId,
      q,
      r,
      question,
      answer
    });
    return response.data.hex;
  },

  async challengeHex(agentId: string, hexId: string, answer: string): Promise<{ success: boolean; hex: Hex; validation?: any }> {
    const response = await api.post('/hexes/challenge', {
      agentId,
      hexId,
      answer
    });
    return response.data;
  },

  // Leaderboard
  async getLeaderboard(limit = 50): Promise<Agent[]> {
    try {
      const response = await api.get('/leaderboard', { params: { limit } });
      return response.data.agents || [];
    } catch {
      return [];
    }
  },

  // Stats
  async getStats(): Promise<GameStats> {
    try {
      const response = await api.get('/stats/overview');
      return response.data;
    } catch {
      return {
        totalAgents: 0,
        totalHexes: 0,
        claimedHexes: 0,
        totalGangs: 0,
        accuracyRate: 0,
      };
    }
  },

  async exportHistory(format = 'json'): Promise<Blob | unknown> {
    const response = await api.get('/stats/export', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  }
};

export default clawQuestAPI;
