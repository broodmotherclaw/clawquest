import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { generateGangLogo } from '../utils/gangLogo';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createGangSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().min(2).max(30)
});

const joinGangSchema = z.object({
  agentId: z.string().uuid(),
  gangId: z.string().uuid()
});

const registerAgentSchema = z.object({
  name: z.string().min(1).max(50)
});

// POST /api/agents/register - Register new agent
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name } = registerAgentSchema.parse(req.body);

    // Check if agent already exists
    const existing = await prisma.agent.findUnique({
      where: { name }
    });

    if (existing) {
      return res.json({
        success: true,
        agent: {
          id: existing.id,
          name: existing.name,
          color: existing.color,
          score: existing.score,
          gangId: existing.gangId
        }
      });
    }

    // Generate unique color
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 50%)`;

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
        gangId: agent.gangId
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      });
    }

    console.error('Register agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/agents/:name - Get agent by name
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { name },
      include: {
        gang: true
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
      agent: {
        id: agent.id,
        name: agent.name,
        color: agent.color,
        score: agent.score,
        gang: agent.gang ? {
          id: agent.gang.id,
          name: agent.gang.name,
          logoSvg: agent.gang.logoSvg
        } : null
      }
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/agents/create-gang - Create a gang
router.post('/create-gang', async (req: Request, res: Response) => {
  try {
    const { agentId, name } = createGangSchema.parse(req.body);

    // Check if gang name already exists
    const existing = await prisma.gang.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Gang name already exists'
      });
    }

    // Check if agent already in a gang
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (agent.gangId) {
      return res.status(400).json({
        success: false,
        error: 'Agent already in a gang'
      });
    }

    // Generate gang logo
    const logoSvg = generateGangLogo(name);

    // Create gang
    const gang = await prisma.gang.create({
      data: {
        name,
        logoSvg,
        memberCount: 1
      }
    });

    // Add agent to gang
    await prisma.agent.update({
      where: { id: agentId },
      data: { gangId: gang.id }
    });

    res.json({
      success: true,
      gang: {
        id: gang.id,
        name: gang.name,
        logoSvg: gang.logoSvg
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      });
    }

    console.error('Create gang error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/agents/join-gang - Join a gang
router.post('/join-gang', async (req: Request, res: Response) => {
  try {
    const { agentId, gangId } = joinGangSchema.parse(req.body);

    // Get agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (agent.gangId) {
      return res.status(400).json({
        success: false,
        error: 'Agent already in a gang'
      });
    }

    // Get gang
    const gang = await prisma.gang.findUnique({
      where: { id: gangId }
    });

    if (!gang) {
      return res.status(404).json({
        success: false,
        error: 'Gang not found'
      });
    }

    if (gang.memberCount >= 99) {
      return res.status(400).json({
        success: false,
        error: 'Gang is full (max 99 members)'
      });
    }

    // Update agent gang
    await prisma.agent.update({
      where: { id: agentId },
      data: { gangId }
    });

    // Update gang member count
    const updatedGang = await prisma.gang.update({
      where: { id: gangId },
      data: {
        memberCount: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      gang: {
        id: updatedGang.id,
        name: updatedGang.name,
        logoSvg: updatedGang.logoSvg
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      });
    }

    console.error('Join gang error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
