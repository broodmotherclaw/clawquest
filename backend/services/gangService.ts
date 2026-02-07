import { PrismaClient } from '@prisma/client';
import { generateGangLogo } from '../utils/gangLogoGenerator';

const prisma = new PrismaClient();

interface CreateGangParams {
  agentId: string;
  name: string;
}

interface JoinGangParams {
  agentId: string;
  gangId: string;
}

// Create a new gang
export async function createGang(params: CreateGangParams) {
  const { agentId, name } = params;

  // Check if agent exists
  const agent = await prisma.agent.findUnique({
    where: { id: agentId }
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  // Check if agent already in a gang
  if (agent.gangId) {
    throw new Error('Agent already in a gang');
  }

  // Check if gang name already exists
  const existingGang = await prisma.gang.findUnique({
    where: { name }
  });

  if (existingGang) {
    throw new Error('Gang name already exists');
  }

  // Generate gang logo
  const logoSvg = generateGangLogo(name);

  // Create gang
  const gang = await prisma.gang.create({
    data: {
      name,
      logoSvg,
      memberCount: 1
    }
  });

  // Update agent's gang
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      gangId: gang.id
    }
  });

  // Update all hexes owned by this agent to have gang logo
  await prisma.hex.updateMany({
    where: { ownerId: agentId },
    data: {
      gangId: gang.id
    }
  });

  return gang;
}

// Join an existing gang
export async function joinGang(params: JoinGangParams) {
  const { agentId, gangId } = params;

  // Check if agent exists
  const agent = await prisma.agent.findUnique({
    where: { id: agentId }
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  // Check if agent already in a gang
  if (agent.gangId) {
    throw new Error('Agent already in a gang');
  }

  // Check if gang exists
  const gang = await prisma.gang.findUnique({
    where: { id: gangId }
  });

  if (!gang) {
    throw new Error('Gang not found');
  }

  // Check if gang is full (max 99 members)
  if (gang.memberCount >= 99) {
    throw new Error('Gang is full (max 99 members)');
  }

  // Update agent's gang
  await prisma.agent.update({
    where: { id: agentId },
    data: {
      gangId: gang.id
    }
  });

  // Update gang member count
  const updatedGang = await prisma.gang.update({
    where: { id: gangId },
    data: {
      memberCount: {
        increment: 1
      }
    }
  });

  // Update all hexes owned by this agent to have gang logo
  await prisma.hex.updateMany({
    where: { ownerId: agentId },
    data: {
      gangId: gang.id
    }
  });

  return updatedGang;
}

// Get gang by ID
export async function getGangById(gangId: string) {
  const gang = await prisma.gang.findUnique({
    where: { id: gangId },
    include: {
      agents: {
        select: {
          id: true,
          name: true,
          color: true,
          score: true
        }
      }
    }
  });

  if (!gang) {
    throw new Error('Gang not found');
  }

  return gang;
}

// List all gangs
export async function listGangs(limit: number = 50) {
  const gangs = await prisma.gang.findMany({
    take: limit,
    orderBy: {
      memberCount: 'desc'
    },
    include: {
      agents: {
        select: {
          id: true,
          name: true,
          color: true,
          score: true
        }
      }
    }
  });

  return gangs;
}
