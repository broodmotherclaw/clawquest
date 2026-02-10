import type { IncomingMessage, ServerResponse } from 'http';

let wrappedHandler: any = null;

function setCors(res: ServerResponse) {
  (res as any).setHeader('Access-Control-Allow-Origin', '*');
  (res as any).setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  (res as any).setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-OpenClaw-Bot, X-OpenClaw-Bot-Secret, x-openclaw-bot, x-openclaw-bot-secret'
  );
}

async function getHandler() {
  if (wrappedHandler) return wrappedHandler;

  const serverless = await import('serverless-http');
  const { createApp } = await import('../src/app');
  const app = createApp();
  wrappedHandler = serverless.default(app);
  return wrappedHandler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const method = (req as any).method || 'GET';
    const url = (req as any).url || '/';

    // Fast-path preflight to avoid serverless timeouts on OPTIONS
    if (method === 'OPTIONS' && url.startsWith('/api/')) {
      setCors(res);
      (res as any).statusCode = 204;
      (res as any).end();
      return;
    }

    // Lightweight liveness endpoint that does not depend on app initialization
    if (method === 'GET' && (url === '/api/ping' || url.startsWith('/api/ping?'))) {
      setCors(res);
      (res as any).statusCode = 200;
      (res as any).setHeader('Content-Type', 'application/json');
      (res as any).end(JSON.stringify({
        status: 'ok',
        service: 'clawquest-api',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    const h = await getHandler();
    return h(req, res);
  } catch (err: any) {
    (res as any).statusCode = 500;
    (res as any).setHeader('Content-Type', 'application/json');
    (res as any).end(JSON.stringify({
      error: 'Handler initialization failed',
      message: err?.message,
    }));
  }
}
