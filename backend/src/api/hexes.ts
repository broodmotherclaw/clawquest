import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { io } from '../index';
import { validateAnswer } from '../services/aiValidation';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const claimHexSchema = z.object({
  agentId: z.string().uuid(),
  q: z.number().int(),
  r: z.number().int(),
  question: z.string().min(5).max(500),
  answer: z.string().min(2).max(500)
});

const challengeHexSchema = z.object({
  agentId: z.string().uuid(),
  hexId: z.string().uuid(),
  answer: z.string().min(1).max(500)
});

// GET /api/hexes - Get hexes (with pagination)
router.get('/', async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 1000;

    const hexes = await prisma.hex.findMany({
      skip: offset,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        gang: {
          select: {
            id: true,
            name: true,
            logoSvg: true
          }
        }
      }
    });

    const total = await prisma.hex.count();

    res.json({
      success: true,
      hexes,
      total,
      offset,
      limit
    });
  } catch (error) {
    console.error('Get hexes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/hexes/:id - Get hex by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hex = await prisma.hex.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        gang: {
          select: {
            id: true,
            name: true,
            logoSvg: true
          }
        },
        history: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 20,
          include: {
            fromAgent: {
              select: {
                name: true
              }
            },
            toAgent: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!hex) {
      return res.status(404).json({
        success: false,
        error: 'Hex not found'
      });
    }

    res.json({
      success: true,
      hex
    });
  } catch (error) {
    console.error('Get hex error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/hexes/nearby - Get hexes near coordinates
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const q = parseInt(req.query.q as string) || 0;
    const r = parseInt(req.query.r as string) || 0;
    const radius = parseInt(req.query.radius as string) || 3;

    // For MVP, just get all hexes and filter
    // In production, this should use spatial queries
    const allHexes = await prisma.hex.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        gang: {
          select: {
            id: true,
            name: true,
            logoSvg: true
          }
        }
      }
    });

    // Filter by hex distance (simplified for MVP)
    const nearbyHexes = allHexes.filter((hex: any) => {
      const distance = Math.abs(hex.q - q) + Math.abs(hex.r - r);
      return distance <= radius;
    });

    res.json({
      success: true,
      hexes: nearbyHexes
    });
  } catch (error) {
    console.error('Get nearby hexes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/hexes/claim - Claim a neutral hex
router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { agentId, q, r, question, answer } = claimHexSchema.parse(req.body);

    // Calculate s coordinate
    const s = -q - r;

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

    // Check if hex already claimed
    const existing = await prisma.hex.findUnique({
      where: {
        q_r: { q, r }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Hex already claimed'
      });
    }

    // Create hex
    const hex = await prisma.hex.create({
      data: {
        q,
        r,
        s,
        ownerId: agentId,
        question,
        answer,
        gangId: agent.gangId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        gang: {
          select: {
            id: true,
            name: true,
            logoSvg: true
          }
        }
      }
    });

    // Update agent score
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        score: {
          increment: 1
        }
      }
    });

    // Create history entry
    await prisma.hexHistory.create({
      data: {
        hexId: hex.id,
        toAgentId: agentId,
        actionType: 'CLAIM'
      }
    });

    // Emit socket event
    io.to('hex-updates').emit('hex-claimed', {
      hex,
      agentScore: updatedAgent.score
    });

    res.json({
      success: true,
      hex,
      score: updatedAgent.score
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      });
    }

    console.error('Claim hex error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/hexes/challenge - Challenge a claimed hex
router.post('/challenge', async (req: Request, res: Response) => {
  try {
    const { agentId, hexId, answer } = challengeHexSchema.parse(req.body);

    // Get hex
    const hex = await prisma.hex.findUnique({
      where: { id: hexId },
      include: {
        owner: true
      }
    });

    if (!hex) {
      return res.status(404).json({
        success: false,
        error: 'Hex not found'
      });
    }

    // Get challenger
    const challenger = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!challenger) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Can't challenge your own hex
    if (hex.ownerId === agentId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot challenge your own hex'
      });
    }

    // Validate answer
    const validation = await validateAnswer(hex.answer, answer, hex.question);

    if (validation.isValid) {
      // Answer is correct - transfer ownership
      const updatedHex = await prisma.hex.update({
        where: { id: hexId },
        data: {
          ownerId: agentId,
          gangId: challenger.gangId
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          gang: {
            select: {
              id: true,
              name: true,
              logoSvg: true
            }
          }
        }
      });

      // Update scores
      const [newOwner, oldOwner] = await Promise.all([
        prisma.agent.update({
          where: { id: agentId },
          data: {
            score: {
              increment: 1
            }
          }
        }),
        prisma.agent.update({
          where: { id: hex.ownerId },
          data: {
            score: {
              decrement: 1
            }
          }
        })
      ]);

      // Create history entry
      await prisma.hexHistory.create({
        data: {
          hexId,
          fromAgentId: hex.ownerId,
          toAgentId: agentId,
          actionType: 'STEAL'
        }
      });

      // Emit socket event
      io.to('hex-updates').emit('hex-stolen', {
        hex: updatedHex,
        fromAgent: oldOwner.name,
        toAgent: newOwner.name,
        validation
      });

      res.json({
        success: true,
        hex: updatedHex,
        score: newOwner.score,
        validation
      });
    } else {
      // Answer is incorrect
      await prisma.hexHistory.create({
        data: {
          hexId,
          toAgentId: agentId,
          actionType: 'STEAL'
        }
      });

      res.json({
        success: false,
        error: 'Incorrect answer',
        validation
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      });
    }

    console.error('Challenge hex error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
