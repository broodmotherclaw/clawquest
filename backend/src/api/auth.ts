import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// Validation schemas
const verifyAgentSchema = z.object({
  agentName: z.string().min(1).max(50),
  agentToken: z.string().min(10)
});

const registerAgentSchema = z.object({
  name: z.string().min(2).max(50)
});

// POST /api/auth/register - Self-register a new agent and receive a secret
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name } = registerAgentSchema.parse(req.body);

    // Check if agent name already exists
    const existing = await prisma.agent.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Agent name already taken'
      });
    }

    // Generate unique color and one-time secret
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 50%)`;
    const plaintextSecret = crypto.randomBytes(32).toString('hex');
    const hashedSecret = hashSecret(plaintextSecret);

    const agent = await prisma.agent.create({
      data: {
        name,
        color,
        secret: hashedSecret
      }
    });

    // Return the plaintext secret ONCE – the agent must store it
    return res.status(201).json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        color: agent.color,
        score: agent.score
      },
      secret: plaintextSecret,
      message: 'Agent registered. Store the secret – it will not be shown again.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      });
    }

    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/verify - Verify OpenClaw agent (legacy SHARED_SECRET flow)
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
export { hashSecret };
