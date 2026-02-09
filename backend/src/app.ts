// Load environment variables FIRST (before any other imports)
// Skip dotenv on Vercel — env vars are injected by the platform
if (!process.env.VERCEL) {
  try {
    const dotenv = require('dotenv');
    const path = require('path');
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    console.log('[ENV] Loading from .env file');
  } catch (e) {
    // dotenv not available or .env not found — that's fine on Vercel
  }
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import agentRoutes from './api/bots';
import hexRoutes from './api/hexes';
import leaderboardRoutes from './api/leaderboard';
import statsRoutes from './api/stats';
import waferRoutes from './api/wafers';
import gangRoutes from './api/gangs';
import walletRoutes from './api/wallet';
import { checkAIProvider } from './services/aiProvider';

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
const HEALTH_DB_TIMEOUT_MS = Number(process.env.HEALTH_DB_TIMEOUT_MS || 2000);

function parseForwardedFor(forwardedHeader: string): string | undefined {
  // RFC 7239: Forwarded: for=203.0.113.43, for="[2001:db8:cafe::17]:4711"
  const match = forwardedHeader.match(/for=(?:"?\[?([^;\],"]+)\]?"?)/i);
  if (!match?.[1]) {
    return undefined;
  }

  const value = match[1].trim();
  if (!value || value.toLowerCase() === 'unknown') {
    return undefined;
  }

  const withoutPort = value.includes(':') && value.includes('.') ? value.split(':')[0] : value;
  return withoutPort || undefined;
}

function normalizeIp(candidate: string): string | undefined {
  const trimmed = candidate.trim().replace(/^"|"$/g, '');
  if (!trimmed || trimmed.toLowerCase() === 'unknown') {
    return undefined;
  }

  // [IPv6]:port -> IPv6
  const bracketedIpv6 = trimmed.match(/^\[([a-fA-F0-9:]+)\](?::\d+)?$/);
  if (bracketedIpv6?.[1]) {
    return bracketedIpv6[1];
  }

  // IPv4:port -> IPv4
  const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  if (ipv4WithPort?.[1]) {
    return ipv4WithPort[1];
  }

  return trimmed;
}

function getRateLimitKey(req: express.Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const forwarded = req.headers.forwarded;

  const forwardedIp = typeof xForwardedFor === 'string'
    ? normalizeIp(xForwardedFor.split(',')[0] || '')
    : undefined;
  const standardForwardedIp = typeof forwarded === 'string'
    ? normalizeIp(parseForwardedFor(forwarded) || '')
    : undefined;

  const candidateIp =
    forwardedIp ||
    standardForwardedIp ||
    normalizeIp(req.ip || '') ||
    normalizeIp(req.socket.remoteAddress || '');

  if (candidateIp) {
    return ipKeyGenerator(candidateIp);
  }

  return `fallback:${req.get('x-vercel-id') || req.get('user-agent') || 'anonymous'}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // CORS - Allow all origins for development
  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-OpenClaw-Bot',
      'X-OpenClaw-Bot-Secret',
      'x-openclaw-bot',
      'x-openclaw-bot-secret'
    ]
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Security Middleware (configured to work with CORS)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    keyGenerator: (req) => getRateLimitKey(req),
    message: {
      success: false,
      error: 'Too many requests, please try again later.'
    }
  });

  // Stricter rate limit for bot operations
  const botLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute for bot operations
    keyGenerator: (req) => getRateLimitKey(req),
    message: {
      success: false,
      error: 'Bot rate limit exceeded. Please slow down.'
    }
  });

  app.use(limiter);
  app.use(express.json({ limit: '10mb' }));

  // Health check (supports /health and /api/health for serverless)
  const healthHandler = async (_req: express.Request, res: express.Response) => {
    const dbCheck = async () => {
      const stats = await prisma.agent.aggregate({ _count: { id: true } });
      const hexStats = await prisma.hex.aggregate({ _count: { id: true } });
      const gangStats = await prisma.gang.aggregate({ _count: { id: true } });
      const waferStats = await prisma.wafer.aggregate({ _count: { id: true } });
      return { totalAgents: stats._count.id, totalHexes: hexStats._count.id, totalGangs: gangStats._count.id, totalWafers: waferStats._count.id };
    };

    try {
      const stats = await withTimeout(
        dbCheck(),
        HEALTH_DB_TIMEOUT_MS,
        `Health check DB timeout after ${HEALTH_DB_TIMEOUT_MS}ms`
      );

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        mode: 'OpenClaw Agents',
        stats
      });
    } catch (error: any) {
      console.error('Health check database error:', error?.message || error);
      res.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: 'not connected',
        mode: 'OpenClaw Agents',
        error: 'Database connection failed',
        details: error?.message || 'Unknown health-check error'
      });
    }
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // API Routes
  app.use('/api/bots', botLimiter, agentRoutes);        // Original bot API
  app.use('/api/agents', agentRoutes);                  // Alias for frontend compatibility
  app.use('/api/hexes', botLimiter, hexRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/wafers', waferRoutes);
  app.use('/api/gangs', gangRoutes);
  app.use('/api/wallet', walletRoutes);

  return app;
}

export async function runStartupChecks(): Promise<void> {
  console.log('\n🔍 Running startup checks...\n');

  // Check AI Provider
  const aiStatus = await checkAIProvider();
  console.log(`🤖 AI Provider: ${aiStatus.provider.toUpperCase()}`);
  console.log(`   Status: ${aiStatus.message}`);
  console.log(`   API Key: ${aiStatus.hasApiKey ? '✅ Configured' : '❌ Missing'}\n`);

  // Environment summary
  console.log('📋 Environment Configuration:');
  console.log(`   PORT: ${process.env.PORT || 3001}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`   DATABASE: ${process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`   AI_PROVIDER: ${process.env.AI_PROVIDER || 'glm (default)'}`);
  console.log(`   GLM_API_KEY: ${process.env.GLM_API_KEY ? '✅ Set' : '❌ Not set'}\n`);
}
