/**
 * Tiny module-level in-memory cache shared across all hook instances.
 * Mirrors the SWR/React Query pattern without the library dependency.
 *
 * Each entry has a TTL; stale entries are evicted on next read.
 * The cache is keyed by arbitrary strings (typically `resource:arg`).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  /** Time-to-live in milliseconds. */
  ttl: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();

/** Read a cached value. Returns `null` if missing or expired. */
export function getCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/** Write a value to the cache. `ttl` defaults to 60 seconds. */
export function setCache<T>(key: string, data: T, ttl = 60_000): void {
  store.set(key, { data, timestamp: Date.now(), ttl });
}

/** Immediately invalidate one or more cache keys. */
export function invalidateCache(...keys: string[]): void {
  for (const k of keys) store.delete(k);
}

/** Invalidate all keys matching a prefix (e.g. `"leaderboard:"`). */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
