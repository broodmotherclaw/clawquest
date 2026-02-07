import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncGangHexes() {
  console.log('🔄 Syncing gang hexes...');
  
  // Get all agents with gangs
  const agentsWithGangs = await prisma.agent.findMany({
    where: { gangId: { not: null } },
    select: { id: true, gangId: true, name: true }
  });
  
  console.log(`Found ${agentsWithGangs.length} agents in gangs`);
  
  for (const agent of agentsWithGangs) {
    if (!agent.gangId) continue;
    
    // Update all hexes owned by this agent
    const result = await prisma.hex.updateMany({
      where: { ownerId: agent.id },
      data: { gangId: agent.gangId }
    });
    
    console.log(`  ✓ ${agent.name}: Updated ${result.count} hexes to gang ${agent.gangId}`);
  }
  
  console.log('✅ Gang hex sync complete!');
}

syncGangHexes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
