import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

export default async function handler(req: any, res: any) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;

  // Health check
  if (path === '/api/health' || path === '/health' || path === '/') {
    try {
      const result = await Promise.race([
        prisma.$queryRaw`SELECT 1 as ok`,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DB timeout after 5s')), 5000)
        ),
      ]);
      return res.status(200).json({ ok: true, db: 'connected', time: new Date().toISOString() });
    } catch (err: any) {
      return res.status(503).json({ ok: false, db: 'failed', error: err.message, time: new Date().toISOString() });
    }
  }

  // For all other routes, use the full app
  try {
    const serverless = require('serverless-http');
    const { createApp } = require('../src/app');
    const app = createApp();
    const wrappedHandler = serverless(app);
    return wrappedHandler(req, res);
  } catch (err: any) {
    return res.status(500).json({ error: 'App init failed', message: err.message });
  }
}
