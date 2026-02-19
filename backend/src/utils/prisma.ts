import { PrismaClient } from '@prisma/client';
import { applyDatabaseUrl, type DatabaseUrlResolution } from './databaseUrl';

const databaseUrlResolution = applyDatabaseUrl();

const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  log: ['error'],
};

if (databaseUrlResolution.url) {
  prismaOptions.datasources = {
    db: {
      url: databaseUrlResolution.url,
    },
  };
}

export const prisma = new PrismaClient(prismaOptions);

export function getDatabaseUrlResolution(): DatabaseUrlResolution {
  return databaseUrlResolution;
}
