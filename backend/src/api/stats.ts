import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/stats/overview - Get overview statistics
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const [totalHexes, claimedHexes, activeAgents, totalGangs] = await Promise.all([
      prisma.hex.count(),
      prisma.hex.count({
        where: {
          owner: {
            isNot: null
          }
        }
      }),
      prisma.agent.count(),
      prisma.gang.count()
    ]);

    res.json({
      success: true,
      totalHexes: 5000, // Total matrix size
      claimedHexes,
      unclaimedHexes: 5000 - claimedHexes,
      activeAgents,
      totalGangs,
      coveragePercent: (claimedHexes / 5000) * 100
    });
  } catch (error) {
    console.error('Get stats overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/stats/export - Export history
router.get('/export', async (req: Request, res: Response) => {
  try {
    const format = req.query.format as string || 'json';

    const history = await prisma.hexHistory.findMany({
      include: {
        hex: {
          select: {
            q: true,
            r: true,
            s: true
          }
        },
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
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = ['timestamp', 'action_type', 'hex_q', 'hex_r', 'hex_s', 'from_agent', 'to_agent'];
      const rows = history.map(entry => [
        entry.timestamp.toISOString(),
        entry.actionType,
        entry.hex.q,
        entry.hex.r,
        entry.hex.s,
        entry.fromAgent?.name || 'NULL',
        entry.toAgent.name
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=clawquest_history.csv');
      res.send(csv);
    } else {
      // JSON format
      res.json({
        success: true,
        history,
        total: history.length
      });
    }
  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
