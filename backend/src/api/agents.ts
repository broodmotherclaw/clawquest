import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { emitHexUpdate } from '../realtime';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(2).max(30),
  color: z.string()
});

// Create a new agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, color } = createAgentSchema.parse(req.body);

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

    // Emit socket event
    emitHexUpdate('agent-created', {
      agent,
      message: `${agent.name} has joined the battlefield!`
    });

    res.json({
      success: true,
      agent
    });
  } catch (error: any) {
    console.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agent'
    });
  }
});

// Get agent details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        hexes: true
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error: any) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent'
    });
  }
});

// Get all agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        hexes: true
      },
      orderBy: {
        score: 'desc'
      }
    });

    res.json({
      success: true,
      agents
    });
  } catch (error: any) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agents'
    });
  }
});

// Get agent stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        hexes: true,
        _count: {
          select: { hexes: true }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Get claim history count
    const claimCount = await prisma.hexHistory.count({
      where: { toAgentId: id, actionType: 'CLAIM' }
    });

    const stealCount = await prisma.hexHistory.count({
      where: { toAgentId: id, actionType: 'STEAL' }
    });

    res.json({
      success: true,
      stats: {
        totalHexes: agent._count.hexes,
        score: agent.score,
        claims: claimCount,
        steals: stealCount
      }
    });
  } catch (error: any) {
    console.error('Get agent stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent stats'
    });
  }
});

export default router;
