// Simple In-Memory Cache with TTL
interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class Cache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }

  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item || item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired items periodically
  private startCleanup(): void {
    const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): {
    size: number;
    expiredCount: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    for (const [_, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        expiredCount++;
      }
    }
    return {
      size: this.cache.size,
      expiredCount,
    };
  }
}

// Cache instances with different TTLs
export const apiCache = new Cache<any>(5 * 60 * 1000); // 5 minutes
export const gangsCache = new Cache<any>(10 * 60 * 1000); // 10 minutes
export const leaderboardCache = new Cache<any>(1 * 60 * 1000); // 1 minute

// Helper function to create cached API wrapper
export function withCache<T>(
  keyPrefix: string,
  cache: Cache<any>,
  fetchFn: () => Promise<T>,
  ttl?: number
): () => Promise<T> {
  return async (): Promise<T> => {
    const cacheKey = keyPrefix;
    const cached = cache.get(cacheKey);

    if (cached !== undefined) {
      console.log(`Cache hit: ${keyPrefix}`);
      return cached;
    }

    console.log(`Cache miss: ${keyPrefix}, fetching...`);
    const result = await fetchFn();
    cache.set(cacheKey, result, ttl);

    return result;
  };
}

export default Cache;
