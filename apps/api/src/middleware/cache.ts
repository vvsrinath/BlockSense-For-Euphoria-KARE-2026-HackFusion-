/**
 * In-memory TTL cache.
 *
 * Chain data is expensive to fetch and cheap to keep: a block that is 200 000
 * deep will not change. Caching for `CACHE_TTL_SECONDS` removes most duplicate
 * provider calls without serving anything stale enough to mislead.
 *
 * The store is a `Map`, which keeps insertion order, so the oldest entry is
 * always the first key. That makes eviction O(1) and keeps memory bounded even
 * if `maxEntries` is raised.
 */

export interface CacheOptions {
  ttlMs: number;
  maxEntries?: number;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  private readonly store = new Map<string, Entry<unknown>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private hits = 0;
  private misses = 0;

  constructor({ ttlMs, maxEntries = 500 }: CacheOptions) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    // Re-inserting moves the key to the end, so the oldest is evicted first.
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) break;
      this.store.delete(oldest.value);
    }
  }

  /** Return the cached value, or compute, store and return a fresh one. */
  async wrap<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await load();
    this.set(key, value);
    return value;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  stats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : Number((this.hits / total).toFixed(3))
    };
  }
}

/** Cache keys are namespaced per chain so two chains cannot collide. */
export function cacheKey(chain: string, ...parts: (string | number | undefined)[]): string {
  return [chain, ...parts.filter((p) => p !== undefined && p !== '')].join(':');
}
