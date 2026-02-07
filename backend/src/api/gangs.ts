import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../index';
import { generateGangLogo } from '../utils/gangLogo';
import { getGangColor } from '../utils/gangColor';

const router = Router();
const prisma = new PrismaClient();

// GET /api/gangs - Get all gangs
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const gangs = await prisma.gang.findMany({
      take: limit,
      include: {
        agents: {
          select: {
            id: true,
            score: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate total score and add color for each gang
    const gangsWithScore = gangs.map(gang => ({
      ...gang,
      color: getGangColor(gang.name),
      totalScore: gang.agents.reduce((sum, agent) => sum + agent.score, 0),
      memberCount: gang.agents.length
    }));

    res.json(gangsWithScore);
  } catch (error) {
    console.error('Get gangs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/gangs/:id - Get gang by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const gang = await prisma.gang.findUnique({
      where: { id },
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            color: true,
            score: true
          }
        }
      }
    });

    if (!gang) {
      return res.status(404).json({
        success: false,
        error: 'Gang not found'
      });
    }

    res.json({
      ...gang,
      totalScore: gang.agents.reduce((sum, agent) => sum + agent.score, 0),
      memberCount: gang.agents.length
    });
  } catch (error) {
    console.error('Get gang error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/gangs/create - Create a new gang
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { agentId, name } = req.body;

    if (!agentId || !name) {
      return res.status(400).json({
        success: false,
        error: 'agentId and name are required'
      });
    }

    // Check if gang name exists
    const existing = await prisma.gang.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Gang name already exists'
      });
    }

    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Check if agent is already in a gang
    if (agent.gangId) {
      return res.status(400).json({
        success: false,
        error: 'Agent is already in a gang'
      });
    }

    // Generate logo
    const logoSvg = await generateGangLogo(name);

    // Create gang
    const gang = await prisma.gang.create({
      data: {
        name,
        logoSvg,
        agents: {
          connect: { id: agentId }
        }
      }
    });

    // Update agent's gang
    await prisma.agent.update({
      where: { id: agentId },
      data: { gangId: gang.id }
    });

    // Emit socket event
    io.to('hex-updates').emit('gang-created', { gang });

    res.json({
      success: true,
      gang
    });
  } catch (error) {
    console.error('Create gang error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/gangs/join - Join a gang
router.post('/join', async (req: Request, res: Response) => {
  try {
    const { agentId, gangId } = req.body;

    if (!agentId || !gangId) {
      return res.status(400).json({
        success: false,
        error: 'agentId and gangId are required'
      });
    }

    // Check gang exists
    const gang = await prisma.gang.findUnique({
      where: { id: gangId },
      include: {
        agents: true
      }
    });

    if (!gang) {
      return res.status(404).json({
        success: false,
        error: 'Gang not found'
      });
    }

    // Check max members (99)
    if (gang.agents.length >= 99) {
      return res.status(400).json({
        success: false,
        error: 'Gang is full (max 99 members)'
      });
    }

    // Check agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Check if already in gang
    if (agent.gangId) {
      return res.status(400).json({
        success: false,
        error: 'Agent is already in a gang'
      });
    }

    // Join gang
    await prisma.agent.update({
      where: { id: agentId },
      data: { gangId }
    });

    // Update all hexes owned by this agent to have the gangId
    await prisma.hex.updateMany({
      where: { ownerId: agentId },
      data: { gangId }
    });

    // Emit socket event
    io.to('hex-updates').emit('gang-joined', { agentId, gangId });

    res.json({
      success: true,
      gang
    });
  } catch (error) {
    console.error('Join gang error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
