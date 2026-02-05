import axios from 'axios';
import { Agent, Hex, Question, Gang } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function createAgent(name: string, color: string): Promise<Agent> {
  const response = await axios.post(`${API_BASE}/agents`, { name, color });
  return response.data;
}

export async function getAgents(): Promise<Agent[]> {
  const response = await axios.get(`${API_BASE}/agents`);
  return response.data;
}

export async function getAgent(id: string): Promise<Agent> {
  const response = await axios.get(`${API_BASE}/agents/${id}`);
  return response.data;
}

export async function getAgentQuestions(agentId: string): Promise<Question[]> {
  const response = await axios.get(`${API_BASE}/agents/${agentId}/questions`);
  return response.data;
}

export async function submitAnswer(agentId: string, questionId: string, userAnswer: string): Promise<{ isValid: boolean; similarity: number }> {
  const response = await axios.post(`${API_BASE}/agents/${agentId}/answer`, {
    questionId,
    userAnswer
  });
  return response.data;
}

export async function claimHex(agentId: string, q: number, r: number): Promise<Hex> {
  const response = await axios.post(`${API_BASE}/hexes/claim`, { agentId, q, r });
  return response.data;
}

export async function getHexes(): Promise<Hex[]> {
  const response = await axios.get(`${API_BASE}/hexes`);
  return response.data;
}

export async function getLeaderboard(limit: number = 50): Promise<Agent[]> {
  const response = await axios.get(`${API_BASE}/leaderboard`, { params: { limit } });
  return response.data;
}

export async function getStats(): Promise<{
  totalAgents: number;
  totalHexes: number;
  totalQuestions: number;
  totalAnswers: number;
  accuracyRate: number;
}> {
  const response = await axios.get(`${API_BASE}/stats`);
  return response.data;
}

// Gangs API
export async function createGang(agentId: string, name: string): Promise<Gang> {
  const response = await axios.post(`${API_BASE}/gangs/create`, { agentId, name });
  return response.data;
}

export async function joinGang(agentId: string, gangId: string): Promise<Gang> {
  const response = await axios.post(`${API_BASE}/gangs/join`, { agentId, gangId });
  return response.data;
}

export async function getGang(gangId: string): Promise<Gang> {
  const response = await axios.get(`${API_BASE}/gangs/${gangId}`);
  return response.data;
}

export async function getGangs(limit: number = 50): Promise<Gang[]> {
  const response = await axios.get(`${API_BASE}/gangs`, { params: { limit } });
  return response.data;
}
