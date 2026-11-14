// ==============================================================================
// PRISMA CLIENT SINGLETON — INFRASTRUCTURE LAYER
// ==============================================================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const fallbackDatabaseUrl =
  process.env.DATABASE_URL?.trim() ||
  'postgresql://neondb_owner:npg_ad4WvqogUH1t@ep-ancient-sunset-bef18lgk-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: fallbackDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
