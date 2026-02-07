// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug: Log environment (remove in production)
console.log('[ENV] Loading from:', path.resolve(__dirname, '../.env'));
console.log('[ENV] GLM_API_KEY exists:', !!process.env.GLM_API_KEY);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import agentRoutes from './api/bots';
import hexRoutes from './api/hexes';
import leaderboardRoutes from './api/leaderboard';
import statsRoutes from './api/stats';
import waferRoutes from './api/wafers';
import gangRoutes from './api/gangs';
import walletRoutes from './api/wallet';
import { checkAIProvider } from './services/aiProvider';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// CORS - Allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-OpenClaw-Bot', 'X-OpenClaw-Bot-Secret']
}));

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

// Health check
app.get('/health', async (req, res) => {
  const stats = await prisma.agent.aggregate({
    _count: { id: true }
  });
  const hexStats = await prisma.hex.aggregate({
    _count: { id: true }
  });
  const gangStats = await prisma.gang.aggregate({
    _count: { id: true }
  });
  const waferStats = await prisma.wafer.aggregate({
    _count: { id: true }
  });

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: prisma ? 'connected' : 'not connected',
    mode: 'OpenClaw Agents',
    stats: {
      totalAgents: stats._count.id,
      totalHexes: hexStats._count.id,
      totalGangs: gangStats._count.id,
      totalWafers: waferStats._count.id
    }
  });
});

// API Routes
app.use('/api/bots', botLimiter, agentRoutes);        // Original bot API
app.use('/api/agents', agentRoutes);                  // Alias for frontend compatibility
app.use('/api/hexes', botLimiter, hexRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/wafers', waferRoutes);
app.use('/api/gangs', gangRoutes);
app.use('/api/wallet', walletRoutes);

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-hex-updates', () => {
    socket.join('hex-updates');
    console.log(`Client ${socket.id} joined hex updates`);
  });

  socket.on('join-wafer-updates', () => {
    socket.join('wafer-updates');
    console.log(`Client ${socket.id} joined wafer updates`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Emit socket events helper
export const emitHexUpdate = (event: string, data: any) => {
  io.to('hex-updates').emit(event, data);
};

export const emitWaferUpdate = (event: string, data: any) => {
  io.to('wafer-updates').emit(event, data);
};

// Check AI provider on startup
async function startupChecks() {
  console.log('\n🔍 Running startup checks...\n');
  
  // Check AI Provider
  const aiStatus = await checkAIProvider();
  console.log(`🤖 AI Provider: ${aiStatus.provider.toUpperCase()}`);
  console.log(`   Status: ${aiStatus.message}`);
  console.log(`   API Key: ${aiStatus.hasApiKey ? '✅ Configured' : '❌ Missing'}\n`);
  
  // Environment summary
  console.log('📋 Environment Configuration:');
  console.log(`   PORT: ${PORT}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`   DATABASE: ${process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`   AI_PROVIDER: ${process.env.AI_PROVIDER || 'glm (default)'}`);
  console.log(`   GLM_API_KEY: ${process.env.GLM_API_KEY ? '✅ Set' : '❌ Not set'}\n`);
}

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`🦞 ClawQuest API running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`🤖 Mode: OpenClaw Agents\n`);
  
  // Run startup checks
  await startupChecks();
});

// Export socket.io instance for use in routes
export { io };

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
