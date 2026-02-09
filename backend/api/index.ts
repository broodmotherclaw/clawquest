import serverless from 'serverless-http';

let handler: any;

try {
  const { createApp } = require('../src/app');
  const app = createApp();
  handler = serverless(app);
} catch (err: any) {
  // If app fails to initialize, return a diagnostic handler
  handler = async (req: any, res: any) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'App initialization failed',
      message: err?.message || String(err),
      stack: err?.stack?.split('\n').slice(0, 5),
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? '***set***' : '***MISSING***',
        SUPABASE_URL: process.env.SUPABASE_URL ? '***set***' : '***MISSING***',
        NODE_ENV: process.env.NODE_ENV,
      }
    }));
  };
}

export default handler;
