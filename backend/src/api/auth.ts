import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const verifyAgentSchema = z.object({
  agentName: z.string().min(1).max(50),
  agentToken: z.string().min(10)
});

// POST /api/auth/verify - Verify OpenClaw agent
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { agentName, agentToken } = verifyAgentSchema.parse(req.body);

    // TODO: Integrate with actual OpenClaw API for token verification
    // For MVP, we'll use a simple token check
    const validToken = process.env.SHARED_SECRET;

    if (agentToken !== validToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid agent token'
      });
    }

    // Find or create agent
    let agent = await prisma.agent.findUnique({
      where: { name: agentName }
    });

    if (!agent) {
      // Generate unique color for new agent
      const hue = Math.floor(Math.random() * 360);
      const color = `hsl(${hue}, 70%, 50%)`;

      agent = await prisma.agent.create({
        data: {
          name: agentName,
          color: color
        }
      });
    }

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

    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
