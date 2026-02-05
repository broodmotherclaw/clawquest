// Token Bucket Rate Limiter
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const BUCKETS = new Map<string, TokenBucket>();
const REFILL_RATE = 1; // tokens per second
const BUCKET_SIZE = 10; // maximum tokens (10 requests per minute)

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now() / 1000; // current time in seconds
  let bucket = BUCKETS.get(identifier);

  if (!bucket) {
    bucket = { tokens: BUCKET_SIZE, lastRefill: now };
    BUCKETS.set(identifier, bucket);
  }

  // Calculate how many tokens to refill
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = timePassed * REFILL_RATE;

  // Refill bucket (but don't exceed max)
  bucket.tokens = Math.min(BUCKET_SIZE, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Check if request can proceed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    BUCKETS.set(identifier, bucket);
    return true;
  }

  return false;
}

export function getRateLimitInfo(identifier: string): {
  tokens: number;
  resetTime: number;
} {
  const bucket = BUCKETS.get(identifier);
  if (!bucket) {
    return { tokens: BUCKET_SIZE, resetTime: 0 };
  }

  const now = Date.now() / 1000;
  const tokensNeeded = 1 - bucket.tokens;
  const timeToWait = tokensNeeded / REFILL_RATE;

  return {
    tokens: Math.max(0, bucket.tokens),
    resetTime: now + timeToWait,
  };
}

// Cleanup old buckets (run periodically)
export function cleanupOldBuckets(maxAge: number = 3600) { // 1 hour
  const now = Date.now() / 1000;
  for (const [key, bucket] of BUCKETS.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      BUCKETS.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => cleanupOldBuckets(), 5 * 60 * 1000);
}
