import type { IncomingMessage, ServerResponse } from 'http';

let wrappedHandler: any = null;

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
