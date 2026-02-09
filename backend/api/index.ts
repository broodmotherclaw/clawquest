// Minimal handler to diagnose Vercel Function issues
// If this responds, the problem is in app initialization (likely Prisma/DB)
// If this doesn't respond, the problem is Vercel itself

export default function handler(req: any, res: any) {
  // Don't import ANYTHING — just respond
  res.status(200).json({
    ok: true,
    msg: 'Vercel function works - minimal handler',
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? `set (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'MISSING',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
    time: new Date().toISOString()
  });
}
