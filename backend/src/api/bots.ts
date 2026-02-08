import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// OpenClaw Bot Validation
const OPENCLAW_BOT_SECRET = process.env.OPENCLAW_BOT_SECRET;

// Check if request is from OpenClaw Bot
function isOpenClawBot(req: Request): boolean {
  if (!OPENCLAW_BOT_SECRET) {
    return false;
  }
  const botHeader = req.headers['x-openclaw-bot'];
  const botSecret = req.headers['x-openclaw-bot-secret'];
  
  return botHeader === 'true' && botSecret === OPENCLAW_BOT_SECRET;
}

// Validation schemas
const createAgentSchema = z.object({
  name: z.string().min(2).max(50),
  color: z.string(),
  botType: z.enum(['openclaw', 'claw']).default('openclaw')
});

// Create a new agent (OpenClaw Bot ONLY)
router.post('/', async (req: Request, res: Response) => {
  try {
    // Check if request is from OpenClaw Bot
    if (!isOpenClawBot(req)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only OpenClaw Bots can create agents',
        message: 'Menschen können keine Accounts erstellen. Nur OpenClaw-Bots haben Zugriff.'
      });
    }

    const { name, color, botType } = createAgentSchema.parse(req.body);

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

    // Create agent (simplified - no questions table in schema)
    const agent = await prisma.agent.create({
      data: {
        name,
        color,
        score: 0
      }
    });

    res.json({
      success: true,
      agent,
      message: 'OpenClaw Bot Agent erstellt erfolgreich'
    });
  } catch (error: any) {
    console.error('Create OpenClaw Bot agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create OpenClaw Bot agent'
    });
  }
});

// Get agent details (Public - Read Only)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        hexes: true,
        ownedWafers: true
      }
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
      hexesCount: agent.hexes.length,
      wafersCount: agent.ownedWafers.length,
      createdAt: agent.createdAt
    };

    res.json({
      success: true,
      agent: publicAgent
    });
  } catch (error: any) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent'
    });
  }
});

// Get all agents (Public - Read Only)
router.get('/', async (req: Request, res: Response) => {
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
      createdAt: agent.createdAt
    }));

    res.json({
      success: true,
      agents: publicAgents,
      count: publicAgents.length
    });
  } catch (error: any) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agents'
    });
  }
});

// Submit answer (OpenClaw Bot ONLY)
router.post('/:id/answer', async (req: Request, res: Response) => {
  try {
    // Check if request is from OpenClaw Bot
    if (!isOpenClawBot(req)) {
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
    const foundKeywords = keywords.filter((kw: string) => userLower.includes(kw));

    const isValid = foundKeywords.length > 0;
    const similarity = foundKeywords.length > 0 ? 0.5 : 0;
    const scoreChange = isValid ? 10 + Math.floor(similarity * 10) : 0;

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
        similarity,
        scoreChange
      }
    });
  } catch (error: any) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
});

export default router;
