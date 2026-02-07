import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import prizePoolService from '../services/prizePool';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wallet/:agentId - Get wallet balance and stats
router.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const wallet = await prisma.wallet.findUnique({
      where: { agentId }
    });

    const poolStats = await prizePoolService.getPrizePoolStats();

    if (!wallet) {
      return res.json({
        success: true,
        wallet: null,
        poolStats,
        message: 'No wallet found. Deposit credits to start playing.'
      });
    }

    // Get recent payouts
    const recentPayouts = await prisma.prizePayout.findMany({
      where: { agentId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        balance: wallet.balance,
        totalDeposited: wallet.totalDeposited,
        totalWon: wallet.totalWon
      },
      poolStats,
      recentPayouts
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/wallet/:agentId/prize - Get player's prize info (if season ends now)
router.get('/:agentId/prize', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const prizeInfo = await prizePoolService.getPlayerPrizeInfo(agentId);

    if (!prizeInfo) {
      return res.json({
        success: true,
        prizeInfo: null,
        message: 'No territories owned yet. Claim hexes to qualify for prizes!'
      });
    }

    res.json({
      success: true,
      prizeInfo
    });
  } catch (error) {
    console.error('Get prize info error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/wallet/leaderboard/prizes - Get leaderboard with prize info
router.get('/leaderboard/prizes', async (req: Request, res: Response) => {
  try {
    const leaderboard = await prizePoolService.getLeaderboardWithPrizes();

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/wallet/deposit - Record a deposit
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { agentId, amount, txHash } = req.body;

    if (!agentId || !amount || !txHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, amount, txHash'
      });
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    const result = await prizePoolService.processDeposit(agentId, amount, txHash);

    if (result.success) {
      res.json({
        success: true,
        message: `Deposited ${amount} credits successfully`,
        amount
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/wallet/pool/stats - Get prize pool statistics
router.get('/pool/stats', async (req: Request, res: Response) => {
  try {
    const stats = await prizePoolService.getPrizePoolStats();

    // Get top winners
    const topWinners = await prisma.prizePayout.groupBy({
      by: ['agentId'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10
    });

    const winnersWithNames = await Promise.all(
      topWinners.map(async (w) => {
        const agent = await prisma.agent.findUnique({
          where: { id: w.agentId },
          select: { name: true }
        });
        return {
          agentId: w.agentId,
          name: agent?.name || 'Unknown',
          totalWon: w._sum.amount
        };
      })
    );

    res.json({
      success: true,
      stats,
      topWinners: winnersWithNames
    });
  } catch (error) {
    console.error('Pool stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/wallet/economics - Get sustainable economy model
router.get('/economics', async (req: Request, res: Response) => {
  try {
    const economics = prizePoolService.calculateEconomics();

    res.json({
      success: true,
      economics: {
        claimCost: prizePoolService.getClaimCost(),      // 0.001 UDC
        challengeFee: prizePoolService.getChallengeFee(), // 0.001 UDC
        platformFee: '1%', // Only 1% platform fee
      },
      scenarios: {
        claim: {
          action: 'Claim neutral hex',
          cost: '0.001 UDC (minimal anti-spam)',
          result: 'You get the hex, pool grows!'
        },
        challenge: {
          action: 'Challenge a hex',
          cost: '0.001 UDC (minimal anti-spam)',
          result: 'If you win, you get the hex! Pool grows!'
        },
        tournament: {
          action: 'Season End',
          description: 'Top 50 players share the prize pool!',
          distribution: '1st: 25%, 2nd: 15%, 3rd: 10%, ... 50th: ~1.35%'
        }
      },
      keyPoints: [
        'MINIMAL FEES: Only 0.001 UDC per action (anti-spam)',
        '99% of all money goes to PRIZE POOL',
        '1% platform fee (minimal, for sustainability)',
        'At season end: Top 50 share the pool!',
        'More players = bigger prizes!'
      ],
      sustainability: 'Tournament Model: Players compete for territory, winner takes all at season end!'
    });
  } catch (error) {
    console.error('Economics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
