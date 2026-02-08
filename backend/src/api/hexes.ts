import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { emitHexUpdate } from '../realtime';
import { validateAnswerWithAI } from '../services/aiProvider';
import { getGangColor } from '../utils/gangColor';
import prizePoolService from '../services/prizePool';

const router = Router();
const prisma = new PrismaClient();

type HistoryDetailsRow = {
  id: string;
  questionSnapshot: string | null;
  submittedAnswer: string | null;
  challengeResult: string | null;
};

async function loadHistoryDetails(hexId: string): Promise<Map<string, HistoryDetailsRow>> {
  try {
    const rows = await prisma.$queryRaw<HistoryDetailsRow[]>`
      SELECT "id", "questionSnapshot", "submittedAnswer", "challengeResult"
      FROM "HexHistory"
      WHERE "hexId" = ${hexId}
      ORDER BY "timestamp" DESC
      LIMIT 20
    `;
    return new Map(rows.map((row) => [row.id, row]));
  } catch {
    // Backward compatibility: if columns are not migrated yet, continue without details.
    return new Map();
  }
}

async function saveHistoryDetails(
  historyId: string,
  details: {
    questionSnapshot?: string | null;
    submittedAnswer?: string | null;
    challengeResult?: string | null;
  }
): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "HexHistory"
      SET
        "questionSnapshot" = ${details.questionSnapshot ?? null},
        "submittedAnswer" = ${details.submittedAnswer ?? null},
        "challengeResult" = ${details.challengeResult ?? null}
      WHERE "id" = ${historyId}
    `;
  } catch {
    // Backward compatibility: if columns are not migrated yet, keep request successful.
  }
}

// Content validation helpers
const MAX_QUESTION_LENGTH = 200;
const MAX_ANSWER_LENGTH = 100;
const MIN_QUESTION_LENGTH = 10;
const MIN_ANSWER_LENGTH = 2;

// Check for repetitive/spam content
function isSpamContent(text: string): boolean {
  // Check for excessive repetition (same character 5+ times in a row)
  if (/(.)\1{4,}/.test(text)) return true;
  
  // Check for random gibberish patterns
  const consonantClusters = text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/g);
  if (consonantClusters && consonantClusters.some(c => c.length > 5)) return true;
  
  // Check for excessive punctuation
  const punctCount = (text.match(/[!?.]/g) || []).length;
  if (punctCount > text.length * 0.3) return true;
  
  // Check for all caps shouting
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 10 && upperCount / letterCount > 0.8) return true;
  
  return false;
}

// Validation schemas
const claimHexSchema = z.object({
  agentId: z.string().uuid(),
  q: z.number().int(),
  r: z.number().int(),
  question: z.string()
    .min(MIN_QUESTION_LENGTH, `Question must be at least ${MIN_QUESTION_LENGTH} characters`)
    .max(MAX_QUESTION_LENGTH, `Question too long (max ${MAX_QUESTION_LENGTH} characters)`)
    .refine((val: string) => !isSpamContent(val), {
      message: 'Question contains spam/repetitive content'
    }),
  answer: z.string()
    .min(MIN_ANSWER_LENGTH, `Answer must be at least ${MIN_ANSWER_LENGTH} characters`)
    .max(MAX_ANSWER_LENGTH, `Answer too long (max ${MAX_ANSWER_LENGTH} characters)`)
    .refine((val: string) => !isSpamContent(val), {
      message: 'Answer contains spam/repetitive content'
    })
});

const challengeHexSchema = z.object({
  agentId: z.string().uuid(),
  hexId: z.string().uuid(),
  answer: z.string()
    .min(1, 'Answer cannot be empty')
    .max(MAX_ANSWER_LENGTH, `Answer too long (max ${MAX_ANSWER_LENGTH} characters)`)
    .refine((val: string) => !isSpamContent(val), {
      message: 'Answer contains spam/repetitive content'
    })
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

    // Add gang color to each hex
    const hexesWithGangColor = hexes.map(hex => ({
      ...hex,
      gang: hex.gang ? {
        ...hex.gang,
        color: getGangColor(hex.gang.name)
      } : null
    }));

    const total = await prisma.hex.count();

    res.json({
      success: true,
      hexes: hexesWithGangColor,
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
router.get('/:id([0-9a-fA-F-]{36})', async (req: Request, res: Response) => {
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
                id: true,
                name: true,
                color: true
              }
            },
            toAgent: {
              select: {
                id: true,
                name: true,
                color: true
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

    const historyDetails = await loadHistoryDetails(id);
    const enrichedHex = {
      ...hex,
      history: hex.history.map((entry) => ({
        ...entry,
        questionSnapshot: historyDetails.get(entry.id)?.questionSnapshot || hex.question,
        submittedAnswer: historyDetails.get(entry.id)?.submittedAnswer || undefined,
        challengeResult: historyDetails.get(entry.id)?.challengeResult || (
          entry.actionType === 'STEAL'
            ? (entry.fromAgentId ? 'SUCCESS' : 'FAILED')
            : undefined
        )
      }))
    };

    res.json({
      success: true,
      hex: enrichedHex
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

// POST /api/hexes/claim - Claim a neutral hex (COSTS MONEY!)
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

    // CHECK BALANCE - Claiming costs money!
    const claimCost = prizePoolService.getClaimCost();
    const agentWallet = await prisma.wallet.findUnique({
      where: { agentId }
    });

    if (!agentWallet || agentWallet.balance < claimCost) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Claiming costs ${claimCost} UDC. Please deposit more credits.`,
        requiredBalance: claimCost,
        currentBalance: agentWallet?.balance || 0
      });
    }

    // Deduct claim cost
    await prisma.wallet.update({
      where: { agentId },
      data: {
        balance: {
          decrement: claimCost
        }
      }
    });

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
    const historyEntry = await prisma.hexHistory.create({
      data: {
        hexId: hex.id,
        toAgentId: agentId,
        actionType: 'CLAIM'
      }
    });
    await saveHistoryDetails(historyEntry.id, { questionSnapshot: question });

    // Emit socket event
    emitHexUpdate('hex-claimed', {
      hex,
      agentScore: updatedAgent.score
    });

    res.json({
      success: true,
      hex,
      score: updatedAgent.score,
      economics: {
        cost: claimCost,
        note: 'Claim cost deducted from your wallet'
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

    // Get challenge fee
    const challengeFee = prizePoolService.getChallengeFee();

    // Check if challenger has enough balance
    const challengerWallet = await prisma.wallet.findUnique({
      where: { agentId }
    });

    if (!challengerWallet || challengerWallet.balance < challengeFee) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Challenge costs ${challengeFee} UDC. Please deposit more credits.`,
        requiredBalance: challengeFee,
        currentBalance: challengerWallet?.balance || 0
      });
    }

    // Deduct challenge fee
    await prisma.wallet.update({
      where: { agentId },
      data: {
        balance: {
          decrement: challengeFee
        }
      }
    });

    // Validate answer using configured AI provider
    console.log(`[Challenge] Agent ${agentId} challenging hex ${hexId}`);
    console.log(`[Challenge] Question: "${hex.question}"`);
    console.log(`[Challenge] Expected answer: "${hex.answer}"`);
    console.log(`[Challenge] User answer: "${answer}"`);
    
    const validation = await validateAnswerWithAI(
      hex.question,
      hex.answer,
      answer
    );
    
    console.log(`[Challenge] Validation result:`, validation);

    if (validation.isValid) {
      // Answer is correct - transfer ownership
      // NO WIN BONUS - The reward is the Hex itself (and its future Jackpot share)
      
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
      const historyEntry = await prisma.hexHistory.create({
        data: {
          hexId,
          fromAgentId: hex.ownerId,
          toAgentId: agentId,
          actionType: 'STEAL'
        }
      });
      await saveHistoryDetails(historyEntry.id, {
        questionSnapshot: hex.question,
        submittedAnswer: answer,
        challengeResult: 'SUCCESS'
      });

      // Emit socket event
      emitHexUpdate('hex-stolen', {
        hex: updatedHex,
        fromAgent: oldOwner.name,
        toAgent: newOwner.name,
        validation
      });

      res.json({
        success: true,
        hex: updatedHex,
        score: newOwner.score,
        validation,
        economics: {
          feePaid: challengeFee,
          winBonus: 0,
          netCost: challengeFee, // You paid 0.1, got back 0
          note: 'You gained territory! Fee added to Season Jackpot.'
        }
      });
    } else {
      // Answer is incorrect - DEFENDER GETS THE FEE!
      // This incentivizes good defense questions
      await prisma.wallet.update({
        where: { agentId: hex.ownerId },
        data: {
          balance: {
            increment: challengeFee
          }
        }
      });

      const historyEntry = await prisma.hexHistory.create({
        data: {
          hexId,
          toAgentId: agentId,
          actionType: 'STEAL'
        }
      });
      await saveHistoryDetails(historyEntry.id, {
        questionSnapshot: hex.question,
        submittedAnswer: answer,
        challengeResult: 'FAILED'
      });

      res.json({
        success: false,
        error: 'Incorrect answer',
        validation,
        economics: {
          feePaid: challengeFee,
          feeGoesTo: hex.owner?.name || 'Defender',
          defenderEarned: challengeFee,
          netProfit: -challengeFee,
          note: 'Defender earned your challenge fee!'
        }
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
