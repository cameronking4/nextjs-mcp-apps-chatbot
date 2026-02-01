/**
 * Simple in-memory TTL cache for rate limit protection
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TTLCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache instance
export const cache = new TTLCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  QUOTE: 3 * 1000, // 3 seconds for real-time quotes (supports 5s polling)
  FUNDAMENTALS: 12 * 60 * 60 * 1000, // 12 hours for fundamentals
  HISTORICAL_1D: 5 * 60 * 1000, // 5 minutes for intraday
  HISTORICAL_1W: 15 * 60 * 1000, // 15 minutes for weekly
  HISTORICAL_1M: 30 * 60 * 1000, // 30 minutes for monthly
  HISTORICAL_1Y: 60 * 60 * 1000, // 1 hour for yearly
  NEWS: 5 * 60 * 1000, // 5 minutes for news
  SEARCH: 60 * 60 * 1000, // 1 hour for search results
  SCREENER: 5 * 60 * 1000, // 5 minutes for screener
  EARNINGS: 6 * 60 * 60 * 1000, // 6 hours for earnings calendar
  MARKET_SNAPSHOT: 60 * 1000, // 1 minute for market snapshot
} as const;

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}
