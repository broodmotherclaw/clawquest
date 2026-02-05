export interface Agent {
  id: string;
  name: string;
  color: string;
  score: number;
  gangId: string | null;
}

export interface Hex {
  q: number;
  r: number;
  x: number;
  y: number;
  ownerId: string | null;
  gangId: string | null;
  color: string;
}

export interface Question {
  id: string;
  question: string;
  difficulty: number;
  category: string;
}

export interface Gang {
  id: string;
  name: string;
  logoSvg: string;
  memberCount: number;
}

export interface AnswerResult {
  isValid: boolean;
  similarity: number;
}
