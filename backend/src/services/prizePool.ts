import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CLAWQUEST - FREE TO PLAY EDITION
// ============================================
// No real money! Just ClawPoints for fun and competition
// Play for glory, leaderboard ranking, and badges!

// All actions are FREE - no costs!
const CLAIM_COST = 0; // Completely free
const CHALLENGE_FEE = 0; // Completely free

// Season ranking - top players get glory and badges
const TOP_PLAYERS_COUNT = 50; // Top 50 get season badges

export interface PrizePool {
  totalClaims: number;       // Total hexes claimed this season
  totalChallenges: number;   // Total challenges made
  activePlayers: number;     // Number of active players
  seasonNumber: number;      // Current season number
}

export interface PlayerPrizeInfo {
  currentRank: number;
  hexCount: number;
  challengesWon: number;
  challengesLost: number;
  winRate: number;
  seasonBadge: string | null;  // Badge if in top 50
  totalPool: number;           // Total season activity
}

export interface PlayerStats {
  agentId: string;
  totalHexes: number;
  totalClaims: number;
  totalChallenges: number;
  challengesWon: number;
  challengesLost: number;
  currentStreak: number;
  bestStreak: number;
  rank: number;
}

/**
 * Get season stats (formerly "prize pool" - now just activity stats)
 */
export async function getPrizePoolStats(): Promise<PrizePool> {
  const totalClaims = await prisma.hex.count();
  const totalChallenges = await prisma.hexHistory.count();

  // Count unique players (agents with at least one hex)
  const activePlayers = await prisma.hex.groupBy({
    by: ['ownerId'],
  });

  return {
    totalClaims,
    totalChallenges,
    activePlayers: activePlayers.length,
    seasonNumber: 1, // Can be incremented each season
  };
}

/**
 * Get claim cost - COMPLETELY FREE NOW!
 */
export function getClaimCost(): number {
  return CLAIM_COST; // 0 = FREE!
}

/**
 * Get challenge fee - COMPLETELY FREE NOW!
 */
export function getChallengeFee(): number {
  return CHALLENGE_FEE; // 0 = FREE!
}

/**
 * Get player's current standing and potential season badge
 */
export async function getPlayerPrizeInfo(agentId: string): Promise<PlayerPrizeInfo | null> {
  // Get player's hex count
  const playerHexes = await prisma.hex.count({
    where: { ownerId: agentId }
  });

  if (playerHexes === 0) {
    return null;
  }

  // Get challenge stats
  const challengesWon = await prisma.hexHistory.count({
    where: { toAgentId: agentId, actionType: 'STEAL' }
  });

  const challengesLost = await prisma.hexHistory.count({
    where: {
      fromAgentId: agentId,
      actionType: 'STEAL',
      // Only count as loss if hex was taken (history entry with fromAgent)
    }
  });

  // Calculate win rate
  const totalChallenges = challengesWon + challengesLost;
  const winRate = totalChallenges > 0 ? challengesWon / totalChallenges : 0;

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

  // Determine badge based on rank
  let seasonBadge: string | null = null;
  if (playerRank <= TOP_PLAYERS_COUNT) {
    if (playerRank === 1) seasonBadge = '👑 Champion';
    else if (playerRank <= 3) seasonBadge = '🥇 Top 3 Elite';
    else if (playerRank <= 10) seasonBadge = '🏆 Top 10 Master';
    else if (playerRank <= 25) seasonBadge = '⭐ Top 25 Expert';
    else seasonBadge = '🎖️ Top 50 Veteran';
  }

  return {
    currentRank: playerRank,
    hexCount: playerHexes,
    challengesWon,
    challengesLost,
    winRate,
    seasonBadge,
    totalPool: (await getPrizePoolStats()).activePlayers
  };
}

/**
 * Get detailed player stats
 */
export async function getPlayerStats(agentId: string): Promise<PlayerStats | null> {
  const hexes = await prisma.hex.findMany({
    where: { ownerId: agentId }
  });

  if (hexes.length === 0) return null;

  const claims = hexes.length;
  const challengesWon = await prisma.hexHistory.count({
    where: { toAgentId: agentId, actionType: 'STEAL' }
  });

  const challengesLost = await prisma.hexHistory.count({
    where: { fromAgentId: agentId, actionType: 'STEAL' }
  });

  const totalChallenges = challengesWon + challengesLost;

  // Get all players for ranking
  const allPlayers = await prisma.hex.groupBy({
    by: ['ownerId'],
    _count: { id: true }
  });

  const sortedPlayers = allPlayers
    .map(p => ({ agentId: p.ownerId, hexCount: p._count.id }))
    .sort((a, b) => b.hexCount - a.hexCount);

  const rank = sortedPlayers.findIndex(p => p.agentId === agentId) + 1;

  return {
    agentId,
    totalHexes: hexes.length,
    totalClaims: claims,
    totalChallenges,
    challengesWon,
    challengesLost,
    currentStreak: 0, // TODO: Track streaks
    bestStreak: 0, // TODO: Track best streak
    rank
  };
}

/**
 * Get leaderboard with badges
 */
export async function getLeaderboardWithPrizes(): Promise<Array<{
  rank: number;
  agentId: string;
  agentName: string;
  hexCount: number;
  challengesWon: number;
  winRate: number;
  badge: string | null;
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

        const challengesWon = await prisma.hexHistory.count({
          where: { toAgentId: p.ownerId, actionType: 'STEAL' }
        });

        const challengesLost = await prisma.hexHistory.count({
          where: { fromAgentId: p.ownerId, actionType: 'STEAL' }
        });

        const total = challengesWon + challengesLost;
        const winRate = total > 0 ? challengesWon / total : 0;

        return {
          agentId: p.ownerId,
          agentName: agent?.name || 'Unknown',
          hexCount: p._count.id,
          challengesWon,
          winRate
        };
      })
    )).sort((a, b) => b.hexCount - a.hexCount || b.winRate - a.winRate)
  );

  return sortedPlayers.map((player, index) => {
    const rank = index + 1;
    let badge: string | null = null;

    if (rank <= TOP_PLAYERS_COUNT) {
      if (rank === 1) badge = '👑 Champion';
      else if (rank <= 3) badge = '🥇 Top 3';
      else if (rank <= 10) badge = '🏆 Top 10';
      else if (rank <= 25) badge = '⭐ Top 25';
      else badge = '🎖️ Top 50';
    }

    return {
      rank,
      agentId: player.agentId,
      agentName: player.agentName,
      hexCount: player.hexCount,
      challengesWon: player.challengesWon,
      winRate: player.winRate,
      badge
    };
  });
}

/**
 * Calculate economics for display (all FREE now!)
 */
export function calculateEconomics() {
  return {
    // Everything is FREE!
    claim: {
      playerCost: CLAIM_COST,
      description: '100% FREE - Just claim and play!',
      poolChange: '+1 hex claimed'
    },
    challenge: {
      playerCost: CHALLENGE_FEE,
      description: '100% FREE - Challenge for glory!',
      poolChange: '+1 challenge made'
    },
    tournament: {
      description: 'Season End: Top 50 get exclusive badges!',
      rewards: [
        '👑 #1: Champion Badge',
        '🥇 #2-3: Elite Badge',
        '🏆 #4-10: Master Badge',
        '⭐ #11-25: Expert Badge',
        '🎖️ #26-50: Veteran Badge'
      ]
    },
    keyPoints: [
      '🎮 100% FREE TO PLAY - No costs whatsoever!',
      '🏆 Compete for glory and leaderboard ranking',
      '🎖️ Earn season badges for top positions',
      '📊 Track your stats and improvement',
      '🌍 Play with people worldwide!'
    ],
    sustainability: 'Free-to-Play Model: No money involved, just fun competition!'
  };
}

// Note: processPayout and processDeposit are kept for backward compatibility
// but do nothing in the free version
export async function processPayout(
  agentId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  // In free version, just log the achievement
  console.log(`🏆 ${reason}: Agent ${agentId} awarded ${amount} (virtual) points`);
  return { success: true, txHash: 'free_to_play' };
}

export async function processDeposit(
  agentId: string,
  amount: number,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  // In free version, everyone starts with unlimited play
  console.log(`🎮 Agent ${agentId} joined the game (free version)`);
  return { success: true };
}

export default {
  getPrizePoolStats,
  getClaimCost,
  getChallengeFee,
  calculateEconomics,
  processPayout,
  processDeposit,
  getPlayerPrizeInfo,
  getPlayerStats,
  getLeaderboardWithPrizes
};
