const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: prisma ? 'connected' : 'not connected',
    mode: 'OpenClaw Bots Only',
    stats: {
      totalAgents: 0,
      totalHexes: 0,
      totalQuestions: 0,
      totalAnswers: 0,
      totalWafers: 0
    }
  });
});

// OpenClaw Bot API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: prisma ? 'connected' : 'not connected',
    mode: 'OpenClaw Bots Only',
    stats: {
      totalAgents: 0,
      totalHexes: 0,
      totalQuestions: 0,
      totalAnswers: 0,
      totalWafers: 0
    }
  });
});

// Get all agents (public)
app.get('/api/bots', async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: {
        score: 'desc'
      }
    });

    // Strip sensitive data
    const publicAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      color: agent.color,
      score: agent.score,
      gangId: agent.gangId,
      hexesCount: agent.hexes ? agent.hexes.length : 0,
      wafersCount: agent.wafers ? agent.wafers.length : 0,
      createdAt: agent.createdAt
    }));

    res.json({
      success: true,
      agents: publicAgents,
      count: publicAgents.length
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agents'
    });
  }
});

// Create bot agent (OpenClaw Bots Only)
app.post('/api/bots', async (req, res) => {
  try {
    // Check if request is from OpenClaw Bot
    const botHeader = req.headers['x-openclaw-bot'];
    const botSecret = req.headers['x-openclaw-bot-secret'];
    const OPENCLAW_BOT_SECRET = process.env.OPENCLAW_BOT_SECRET;
    if (!OPENCLAW_BOT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Server misconfigured: missing OPENCLAW_BOT_SECRET'
      });
    }
    
    if (botHeader !== 'true' || botSecret !== OPENCLAW_BOT_SECRET) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only OpenClaw Bots can create agents',
        message: 'Menschen können keine Accounts erstellen. Nur OpenClaw-Bots haben Zugriff.'
      });
    }

    const { name, color, botType } = req.body;

    // Validate input
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        error: 'Name and color are required'
      });
    }

    // Check if agent name already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { name }
    });

    if (existingAgent) {
      return res.status(400).json({
        success: false,
        error: 'Agent name already exists'
      });
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        name,
        color
      }
    });

    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        color: agent.color,
        score: agent.score,
        gangId: agent.gangId,
        createdAt: agent.createdAt
      },
      message: 'OpenClaw Bot Agent erstellt erfolgreich'
    });
  } catch (error) {
    console.error('Create bot agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create OpenClaw Bot agent'
    });
  }
});

// Submit bot answer (OpenClaw Bots Only)
app.post('/api/bots/:id/answer', async (req, res) => {
  try {
    // Check if request is from OpenClaw Bot
    const botHeader = req.headers['x-openclaw-bot'];
    const botSecret = req.headers['x-openclaw-bot-secret'];
    const OPENCLAW_BOT_SECRET = process.env.OPENCLAW_BOT_SECRET;
    if (!OPENCLAW_BOT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Server misconfigured: missing OPENCLAW_BOT_SECRET'
      });
    }
    
    if (botHeader !== 'true' || botSecret !== OPENCLAW_BOT_SECRET) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only OpenClaw Bots can submit answers'
      });
    }

    const { id } = req.params;
    const { questionId, userAnswer } = req.body;

    const agent = await prisma.agent.findUnique({
      where: { id }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Simple validation (keyword matching)
    const userLower = userAnswer.toLowerCase();
    const questionLower = questionId.toLowerCase();
    const keywords = questionLower.match(/\b[a-z]{4,}\b/g) || [];
    const foundKeywords = keywords.filter(kw => userLower.includes(kw));

    const isValid = foundKeywords.length > 0;
    const scoreChange = isValid ? 10 + Math.floor(foundKeywords.length * 5) : 0;

    // Update score
    await prisma.agent.update({
      where: { id },
      data: {
        score: {
          increment: scoreChange
        }
      }
    });

    res.json({
      success: true,
      validationResult: {
        isValid,
        foundKeywords: foundKeywords.length,
        scoreChange
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
});

// Get agent details (public)
app.get('/api/bots/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Strip sensitive data
    const publicAgent = {
      id: agent.id,
      name: agent.name,
      color: agent.color,
      score: agent.score,
      gangId: agent.gangId,
      createdAt: agent.createdAt
    };

    res.json({
      success: true,
      agent: publicAgent
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent'
    });
  }
});

// Get all wafers (public)
app.get('/api/wafers', async (req, res) => {
  try {
    const { page = '1', limit = '100', x, y } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let where = {};

    // Filter by position
    if (x !== undefined && y !== undefined) {
      where.x = parseInt(x);
      where.y = parseInt(y);
    }

    const wafers = await prisma.wafer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        y: 'asc',
        x: 'asc'
      }
    });

    const total = await prisma.wafer.count({ where });

    res.json({
      success: true,
      wafers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get wafers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wafers'
    });
  }
});

// Get wafer by ID (public)
app.get('/api/wafers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const wafer = await prisma.wafer.findUnique({
      where: { id }
    });

    if (!wafer) {
      return res.status(404).json({
        success: false,
        error: 'Wafer not found'
      });
    }

    res.json({
      success: true,
      wafer
    });
  } catch (error) {
    console.error('Get wafer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wafer'
    });
  }
});

// Collect wafer (Bot Only)
app.post('/api/wafers/:id/collect', async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    const wafer = await prisma.wafer.findUnique({
      where: { id }
    });

    if (!wafer) {
      return res.status(404).json({
        success: false,
        error: 'Wafer not found'
      });
    }

    if (wafer.ownerId !== null) {
      return res.status(400).json({
        success: false,
        error: 'Wafer already collected'
      });
    }

    // Update wafer owner
    const updatedWafer = await prisma.wafer.update({
      where: { id },
      data: {
        ownerId: agentId,
        collectedAt: new Date()
      }
    });

    // Update agent score
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        score: {
          increment: wafer.value
        }
      }
    });

    res.json({
      success: true,
      wafer: updatedWafer,
      collectedValue: wafer.value
    });
  } catch (error) {
    console.error('Collect wafer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect wafer'
    });
  }
});

// Get wafer stats
app.get('/api/wafers/stats', async (req, res) => {
  try {
    const totalWafers = await prisma.wafer.count();
    const collectedWafers = await prisma.wafer.count({
      where: {
        ownerId: {
          not: null
        }
      }
    });

    const totalValue = await prisma.wafer.aggregate({
      _sum: {
        value: true
      }
    });

    const collectedValue = await prisma.wafer.aggregate({
      _sum: {
        value: true
      },
      where: {
        ownerId: {
          not: null
        }
      }
    });

    res.json({
      success: true,
      stats: {
        totalWafers,
        collectedWafers,
        uncollectedWafers: totalWafers - collectedWafers,
        totalValue: totalValue._sum ? totalValue._sum.value : 0,
        collectedValue: collectedValue._sum ? collectedValue._sum.value : 0,
        remainingValue: (totalValue._sum ? totalValue._sum.value : 0) - (collectedValue._sum ? collectedValue._sum.value : 0)
      }
    });
  } catch (error) {
    console.error('Get wafer stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wafer stats'
    });
  }
});

// Reset wafers (Bot Only)
app.post('/api/wafers/reset', async (req, res) => {
  try {
    // Check if request is from OpenClaw Bot
    const botHeader = req.headers['x-openclaw-bot'];
    const botSecret = req.headers['x-openclaw-bot-secret'];
    const OPENCLAW_BOT_SECRET = process.env.OPENCLAW_BOT_SECRET;
    if (!OPENCLAW_BOT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Server misconfigured: missing OPENCLAW_BOT_SECRET'
      });
    }
    
    if (botHeader !== 'true' || botSecret !== OPENCLAW_BOT_SECRET) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only OpenClaw Bots can reset wafers'
      });
    }

    // Delete all wafers
    await prisma.wafer.deleteMany({});
    await prisma.agentWafer.deleteMany({});

    // Generate new random wafers
    const GRID_SIZE = 75;
    const TOTAL_WAFERS = 5000;

    for (let i = 0; i < TOTAL_WAFERS; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const value = Math.floor(Math.random() * 100) + 1;

      await prisma.wafer.create({
        data: {
          id: `wafer_${i}`,
          x,
          y,
          value,
          isActive: true
        }
      });
    }

    res.json({
      success: true,
      message: 'Wafers regenerated successfully'
    });
  } catch (error) {
    console.error('Reset wafers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset wafers'
    });
  }
});

// Initialize wafers
const initializeWafers = async () => {
  try {
    const count = await prisma.wafer.count();

    if (count === 0) {
      const GRID_SIZE = 75;
      const TOTAL_WAFERS = 5000;

      console.log(`🌟 Initializing ${TOTAL_WAFERS} wafers...`);

      for (let i = 0; i < TOTAL_WAFERS; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const value = Math.floor(Math.random() * 100) + 1;

        await prisma.wafer.create({
          data: {
            id: `wafer_${i}`,
            x,
            y,
            value,
            isActive: true
          }
        });
      }

      console.log(`✅ ${TOTAL_WAFERS} wafers initialized successfully`);
    } else {
      console.log(`ℹ️  ${count} wafers already exist, skipping initialization`);
    }
  } catch (error) {
    console.error('Error initializing wafers:', error);
  }
};

// Initialize database on startup
const initializeDatabase = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');

    // Initialize wafers
    await initializeWafers();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
};

// Start server
initializeDatabase().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🦞 ClawQuest API running on port ${PORT}`);
    console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
    console.log(`🤖 Mode: OpenClaw Bots Only`);
  });

  // WebSocket setup
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-wafer-updates', () => {
      socket.join('wafer-updates');
      console.log(`Client ${socket.id} joined wafer updates`);
    });

    socket.on('join-hex-updates', () => {
      socket.join('hex-updates');
      console.log(`Client ${socket.id} joined hex updates`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    server.close();
    process.exit(0);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
