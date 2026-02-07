import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const createWaferSchema = z.object({
  x: z.number().int().min(0).max(74),
  y: z.number().int().min(0).max(74),
  value: z.number().int().min(0).max(10000)
});

const GRID_SIZE = 75; // 75x75 = 5625 Wafer

// Initialize wafers on first request
let wafersInitialized = false;

async function initializeWafers() {
  if (wafersInitialized) return;

  const existingWafers = await prisma.wafer.count();
  if (existingWafers === 0) {
    // Create 5000 random wafers with values
    const waferData = [];
    
    for (let i = 0; i < 5000; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const value = Math.floor(Math.random() * 100) + 1; // 1-100 value
      
      waferData.push({
        id: `wafer_${i}`,
        x,
        y,
        value,
        ownerId: null,
        isActive: true
      });
    }

    await prisma.wafer.createMany({
      data: waferData
    });

    console.log(`✅ Initialized ${waferData.length} wafers in grid`);
  }

  wafersInitialized = true;
}

// Get all wafers (with pagination)
router.get('/', async (req: Request, res: Response) => {
  try {
    await initializeWafers();

    const { page = '1', limit = '100', x, y } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};

    // Filter by position
    if (x !== undefined && y !== undefined) {
      where.x = parseInt(x as string);
      where.y = parseInt(y as string);
    }

    const wafers = await prisma.wafer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        y: 'asc',
        x: 'asc'
      }
    });

    const total = await prisma.wafer.count({ where });

    res.json({
      success: true,
      wafers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get wafers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wafers'
    });
  }
});

// Get wafer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const wafer = await prisma.wafer.findUnique({
      where: { id }
    });

    if (!wafer) {
      return res.status(404).json({
        success: false,
        error: 'Wafer not found'
      });
    }

    res.json({
      success: true,
      wafer
    });
  } catch (error: any) {
    console.error('Get wafer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wafer'
    });
  }
});

// Collect wafer (click on wafer)
router.post('/:id/collect', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    const wafer = await prisma.wafer.findUnique({
      where: { id }
    });

    if (!wafer) {
      return res.status(404).json({
        success: false,
        error: 'Wafer not found'
      });
    }

    if (wafer.ownerId !== null) {
      return res.status(400).json({
        success: false,
        error: 'Wafer already collected'
      });
    }

    // Update wafer owner
    const updatedWafer = await prisma.wafer.update({
      where: { id },
      data: {
        ownerId: agentId,
        collectedAt: new Date()
      }
    });

    // Update agent score
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        score: {
          increment: wafer.value
        }
      }
    });

    res.json({
      success: true,
      wafer: updatedWafer,
      collectedValue: wafer.value
    });
  } catch (error: any) {
    console.error('Collect wafer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect wafer'
    });
  }
});

// Get wafer stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    await initializeWafers();

    const totalWafers = await prisma.wafer.count();
    const collectedWafers = await prisma.wafer.count({
      where: {
        ownerId: {
          not: null
        }
      }
    });

    const totalValue = await prisma.wafer.aggregate({
      _sum: {
        value: true
      }
    });

    const collectedValue = await prisma.wafer.aggregate({
      _sum: {
        value: true
      },
      where: {
        ownerId: {
          not: null
        }
      }
    });

    const topCollectors = await prisma.agent.findMany({
      where: {
        ownedWafers: {
          some: {}
        }
      },
      include: {
        ownedWafers: true
      },
      orderBy: {
        ownedWafers: {
          _count: 'desc'
        }
      },
      take: 10
    });

    res.json({
      success: true,
      stats: {
        totalWafers,
        collectedWafers,
        uncollectedWafers: totalWafers - collectedWafers,
        totalValue: totalValue._sum.value || 0,
        collectedValue: collectedValue._sum.value || 0,
        remainingValue: (totalValue._sum.value || 0) - (collectedValue._sum.value || 0)
      },
      topCollectors
    });
  } catch (error: any) {
    console.error('Get wafer stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wafer stats'
    });
  }
});

// Reset wafers (re-generate all)
router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Delete all wafers
    await prisma.wafer.deleteMany({});

    // Re-initialize
    wafersInitialized = false;
    await initializeWafers();

    res.json({
      success: true,
      message: 'Wafers regenerated successfully'
    });
  } catch (error: any) {
    console.error('Reset wafers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset wafers'
    });
  }
});

export default router;
