import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TOURNAMENT ECONOMY MODEL - Season-Based
// ============================================
// Minimal fees (anti-spam), most goes to Prize Pool
// At season end: Top players share the pool!

// Fee percentage we keep (minimal - just for sustainability)
const PLATFORM_FEE_PERCENT = 0.01; // 1%

// Anti-spam minimal costs (NOT profit sources!)
const CLAIM_COST = 0.001; // 0.001 UDC (1/10 cent) - anti-spam only
const CHALLENGE_FEE = 0.001; // 0.001 UDC - anti-spam only

// Prize distribution for top ranks (% of total pool)
const PRIZE_DISTRIBUTION: Record<number, number> = {
  1: 0.25,   // 1st place: 25%
  2: 0.15,   // 2nd place: 15%
  3: 0.10,   // 3rd place: 10%
  4: 0.07,   // 4th place: 7%
  5: 0.05,   // 5th place: 5%
  6: 0.04,   // 6th place: 4%
  7: 0.03,   // 7th place: 3%
  8: 0.025,  // 8th place: 2.5%
  9: 0.025,  // 9th place: 2.5%
  10: 0.02,  // 10th place: 2%
};

// Remaining 54% distributed to ranks 11-50 (~1.35% each)
const REMAINING_SHARE = 1 - Object.values(PRIZE_DISTRIBUTION).reduce((a, b) => a + b, 0);
const TOP_PLAYERS_COUNT = 50; // Top 50 get prizes

export interface PrizePool {
  totalDeposited: number;
  availableForWinners: number;
  platformFees: number;
  totalPaidOut: number;
}

export interface PlayerPrizeInfo {
  currentRank: number;
  hexCount: number;
  prizeIfSeasonEndsNow: number;
  prizePercentage: number;
  totalPool: number;
}

/**
 * Get current prize pool stats
 */
export async function getPrizePoolStats(): Promise<PrizePool> {
  // All claim fees + challenge fees go to pool
  const allHexes = await prisma.hex.findMany();
  const totalFeesCollected = allHexes.length * (CLAIM_COST + CHALLENGE_FEE);

  const deposits = await prisma.wallet.aggregate({
    _sum: { balance: true, totalDeposited: true }
  });

  const payouts = await prisma.prizePayout.aggregate({
    _sum: { amount: true }
  });

  const totalDeposited = (deposits._sum.totalDeposited || 0) + totalFeesCollected;
  const totalPaidOut = payouts._sum.amount || 0;

  // Minimal platform fee
  const platformFees = totalDeposited * PLATFORM_FEE_PERCENT;
  const availableForWinners = totalDeposited - platformFees - totalPaidOut;

  return {
    totalDeposited,
    availableForWinners: Math.max(0, availableForWinners),
    platformFees,
    totalPaidOut
  };
}

/**
 * Get claim cost (cost to claim a neutral hex)
 * This money goes into the prize pool
 */
export function getClaimCost(): number {
  return CLAIM_COST;
}

/**
 * Get challenge fee (cost to attempt a challenge)
 * All fees go to prize pool
 */
export function getChallengeFee(): number {
  return CHALLENGE_FEE;
}

/**
 * Calculate player's current prize based on their rank
 * Returns: "If season ends now, you get X UDC"
 */
export async function getPlayerPrizeInfo(agentId: string): Promise<PlayerPrizeInfo | null> {
  // Get player's hex count
  const playerHexes = await prisma.hex.count({
    where: { ownerId: agentId }
  });

  if (playerHexes === 0) {
    return null;
  }

  // Get all players' hex counts to determine rank
  const allPlayers = await prisma.hex.groupBy({
    by: ['ownerId'],
    _count: { id: true }
  });

  // Sort by hex count descending
  const sortedPlayers = allPlayers
    .map(p => ({ agentId: p.ownerId, hexCount: p._count.id }))
    .sort((a, b) => b.hexCount - a.hexCount);

  // Find player's rank
  const playerRank = sortedPlayers.findIndex(p => p.agentId === agentId) + 1;

  if (playerRank > TOP_PLAYERS_COUNT) {
    // Not in top 50, no prize
    return {
      currentRank: playerRank,
      hexCount: playerHexes,
      prizeIfSeasonEndsNow: 0,
      prizePercentage: 0,
      totalPool: (await getPrizePoolStats()).availableForWinners
    };
  }

  // Calculate prize based on rank
  const pool = await getPrizePoolStats();
  let prizePercentage: number;

  if (playerRank <= 10) {
    prizePercentage = PRIZE_DISTRIBUTION[playerRank as keyof typeof PRIZE_DISTRIBUTION];
  } else {
    // Ranks 11-50 share the remaining pool
    prizePercentage = REMAINING_SHARE / (TOP_PLAYERS_COUNT - 10);
  }

  const prizeIfSeasonEndsNow = Math.round(pool.availableForWinners * prizePercentage * 100) / 100;

  return {
    currentRank: playerRank,
    hexCount: playerHexes,
    prizeIfSeasonEndsNow,
    prizePercentage,
    totalPool: pool.availableForWinners
  };
}

/**
 * Calculate prize for winning a tournament/season
 */
export function calculateTournamentPrize(rank: number, totalPool: number): number {
  if (rank > TOP_PLAYERS_COUNT) return 0;

  let percentage: number;
  if (rank <= 10) {
    percentage = PRIZE_DISTRIBUTION[rank as keyof typeof PRIZE_DISTRIBUTION] || 0;
  } else {
    // Ranks 11-50 share the remaining pool
    percentage = REMAINING_SHARE / (TOP_PLAYERS_COUNT - 10);
  }

  return Math.round(totalPool * percentage * 100) / 100;
}

/**
 * Calculate economics for different scenarios
 */
export function calculateEconomics() {
  return {
    // Claim: Player pays 0.001 UDC → Pool gets +0.001
    claim: {
      playerCost: CLAIM_COST,
      poolChange: +CLAIM_COST,
      playerNet: -CLAIM_COST,
      description: 'Minimal anti-spam fee, goes to prize pool'
    },
    // Challenge: Player pays 0.001 → Pool gets +0.001
    challenge: {
      playerCost: CHALLENGE_FEE,
      poolChange: +CHALLENGE_FEE,
      playerNet: -CHALLENGE_FEE,
      description: 'Minimal anti-spam fee, goes to prize pool'
    },
    // Tournament: Top players share the pool!
    tournament: {
      description: 'At season end, top 50 players share the prize pool!',
      top10: Object.values(PRIZE_DISTRIBUTION).slice(0, 10),
      remaining: REMAINING_SHARE,
      pool: '99% of all fees collected go to players!'
    }
  };
}

/**
 * Process a prize payout to a winner (at season end)
 */
export async function processPayout(
  agentId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const stats = await getPrizePoolStats();

    // Check if enough funds available
    if (amount > stats.availableForWinners) {
      return { success: false, error: 'Insufficient prize pool funds' };
    }

    // Get agent's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { agentId }
    });

    if (!wallet) {
      return { success: false, error: 'Agent wallet not found' };
    }

    // Create payout record
    const payout = await prisma.prizePayout.create({
      data: {
        agentId,
        amount,
        reason,
        status: 'PENDING',
        walletAddress: wallet.address
      }
    });

    // In production, this would trigger a blockchain transaction
    // For now, we just update the agent's wallet balance
    await prisma.wallet.update({
      where: { agentId },
      data: {
        balance: { increment: amount },
        totalWon: { increment: amount }
      }
    });

    await prisma.prizePayout.update({
      where: { id: payout.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    return {
      success: true,
      txHash: `simulated_tx_${Date.now()}` // In production: actual blockchain tx hash
    };
  } catch (error: any) {
    console.error('Payout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Agent deposits credits to play
 */
export async function processDeposit(
  agentId: string,
  amount: number,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update or create wallet
    await prisma.wallet.upsert({
      where: { agentId },
      create: {
        agentId,
        balance: amount,
        totalDeposited: amount,
        address: `derived_from_${agentId}` // In production: actual wallet address
      },
      update: {
        balance: { increment: amount },
        totalDeposited: { increment: amount }
      }
    });

    // Record transaction
    await prisma.deposit.create({
      data: {
        agentId,
        amount,
        txHash,
        status: 'CONFIRMED'
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Deposit error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current leaderboard with prize info
 */
export async function getLeaderboardWithPrizes(): Promise<Array<{
  rank: number;
  agentId: string;
  agentName: string;
  hexCount: number;
  prizeIfSeasonEndsNow: number;
  prizePercentage: number;
}>> {
  const allPlayers = await prisma.hex.groupBy({
    by: ['ownerId'],
    _count: { id: true }
  });

  const sortedPlayers = await Promise.all(
    (await Promise.all(
      allPlayers.map(async (p) => {
        const agent = await prisma.agent.findUnique({
          where: { id: p.ownerId },
          select: { name: true }
        });
        return {
          agentId: p.ownerId,
          agentName: agent?.name || 'Unknown',
          hexCount: p._count.id
        };
      })
    )).sort((a, b) => b.hexCount - a.hexCount)
  );

  const pool = await getPrizePoolStats();

  return sortedPlayers.map((player, index) => {
    const rank = index + 1;
    let prizePercentage = 0;

    if (rank <= 10) {
      prizePercentage = PRIZE_DISTRIBUTION[rank as keyof typeof PRIZE_DISTRIBUTION] || 0;
    } else if (rank <= TOP_PLAYERS_COUNT) {
      prizePercentage = REMAINING_SHARE / (TOP_PLAYERS_COUNT - 10);
    }

    return {
      rank,
      agentId: player.agentId,
      agentName: player.agentName,
      hexCount: player.hexCount,
      prizeIfSeasonEndsNow: Math.round(pool.availableForWinners * prizePercentage * 100) / 100,
      prizePercentage
    };
  });
}

export default {
  getPrizePoolStats,
  getClaimCost,
  getChallengeFee,
  calculateEconomics,
  calculateTournamentPrize,
  processPayout,
  processDeposit,
  getPlayerPrizeInfo,
  getLeaderboardWithPrizes
};
