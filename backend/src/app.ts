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
import rateLimit from 'express-rate-limit';
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

export function createApp() {
  const app = express();

  // Trust proxy on Vercel (required for express-rate-limit behind reverse proxy)
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
    message: {
      success: false,
      error: 'Too many requests, please try again later.'
    }
  });

  // Stricter rate limit for bot operations
  const botLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute for bot operations
    message: {
      success: false,
      error: 'Bot rate limit exceeded. Please slow down.'
    }
  });

  app.use(limiter);
  app.use(express.json({ limit: '10mb' }));

  // Health check (supports /health and /api/health for serverless)
  const healthHandler = async (_req: express.Request, res: express.Response) => {
    const timeoutMs = 5000;
    const dbCheck = async () => {
      const stats = await prisma.agent.aggregate({ _count: { id: true } });
      const hexStats = await prisma.hex.aggregate({ _count: { id: true } });
      const gangStats = await prisma.gang.aggregate({ _count: { id: true } });
      const waferStats = await prisma.wafer.aggregate({ _count: { id: true } });
      return { totalAgents: stats._count.id, totalHexes: hexStats._count.id, totalGangs: gangStats._count.id, totalWafers: waferStats._count.id };
    };

    try {
      const stats = await Promise.race([
        dbCheck(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs))
      ]);

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
        error: 'Database connection failed'
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
