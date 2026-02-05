import { Request, Response, NextFunction } from 'express';
import { checkRateLimit, getRateLimitInfo } from '../middleware/rateLimiter';

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Use agent ID as identifier, or IP address if no agent
  const identifier = req.body.agentId || req.ip || 'unknown';

  const allowed = checkRateLimit(identifier);

  if (!allowed) {
    const info = getRateLimitInfo(identifier);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000),
    });
    return;
  }

  // Add rate limit info to response headers
  const info = getRateLimitInfo(identifier);
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', info.tokens.toString());
  res.setHeader('X-RateLimit-Reset', new Date(info.resetTime * 1000).toISOString());

  next();
}

export function getRateLimitStatus(req: Request, res: Response) {
  const identifier = req.body.agentId || req.ip || 'unknown';
  const info = getRateLimitInfo(identifier);

  res.json({
    limit: 10,
    remaining: info.tokens,
    reset: new Date(info.resetTime * 1000).toISOString(),
  });
}
