import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/leaderboard - Get leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Get top agents
    const agents = await prisma.agent.findMany({
      orderBy: {
        score: 'desc'
      },
      take: limit,
      include: {
        gang: {
          select: {
            id: true,
            name: true,
            logoSvg: true
          }
        }
      }
    });

    // Add rank
    const agentsWithRank = agents.map((agent, index) => ({
      rank: index + 1,
      ...agent
    }));

    // Get top gangs by total score
    const gangs = await prisma.gang.findMany({
      include: {
        agents: {
          select: {
            score: true
          }
        }
      }
    });

    // Calculate gang scores
    const gangsByScore = gangs
      .map(gang => ({
        ...gang,
        totalScore: gang.agents.reduce((sum, agent) => sum + agent.score, 0)
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((gang, index) => ({
        rank: index + 1,
        ...gang
      }));

    res.json({
      success: true,
      agents: agentsWithRank,
      gangs: gangsByScore
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
