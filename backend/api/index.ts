export default async function handler(req: any, res: any) {
  const steps: string[] = [];
  const start = Date.now();

  try {
    steps.push(`start: ${Date.now() - start}ms`);

    // Step 1: Import express
    const express = await import('express');
    steps.push(`express imported: ${Date.now() - start}ms`);

    // Step 2: Import prisma
    const { PrismaClient } = await import('@prisma/client');
    steps.push(`prisma imported: ${Date.now() - start}ms`);

    // Step 3: Create prisma client
    const prisma = new PrismaClient();
    steps.push(`prisma created: ${Date.now() - start}ms`);

    // Step 4: Test DB
    const dbResult = await Promise.race([
      prisma.$queryRaw`SELECT 1 as ok`,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('DB timeout')), 5000))
    ]);
    steps.push(`db connected: ${Date.now() - start}ms`);

    // Step 5: Import serverless-http
    const serverless = await import('serverless-http');
    steps.push(`serverless imported: ${Date.now() - start}ms`);

    // Step 6: Import app
    const { createApp } = await import('../src/app');
    steps.push(`app imported: ${Date.now() - start}ms`);

    // Step 7: Create app
    const app = createApp();
    steps.push(`app created: ${Date.now() - start}ms`);

    // If health check, return diagnostic info
    const url = req.url || '/';
    if (url.includes('health') || url === '/') {
      return res.status(200).json({ ok: true, steps, total: `${Date.now() - start}ms` });
    }

    // Otherwise proxy to full app
    const h = serverless.default(app);
    return h(req, res);
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
      steps,
      failedAt: `${Date.now() - start}ms`
    });
  }
}
