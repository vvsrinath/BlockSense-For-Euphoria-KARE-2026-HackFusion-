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
  /**
   * How long an expired entry is kept as a fallback.
   *
   * A provider that is rate limited for a moment is not a reason to replace a
   * real answer with an error page, so expired entries are retained rather than
   * deleted and can be served when the provider fails. A block does not stop
   * being true because it is a minute old, whereas "we could not reach the
   * provider" is a worse answer than a slightly stale one.
   */
  staleMs?: number;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/** A value past its TTL but still recent enough to be better than an error. */
export interface StaleEntry<T> {
  value: T;
  ageMs: number;
}

export class TtlCache {
  private readonly store = new Map<string, Entry<unknown>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly staleMs: number;
  private hits = 0;
  private misses = 0;
  private staleServed = 0;

  constructor({ ttlMs, maxEntries = 500, staleMs = ttlMs * 20 }: CacheOptions) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.staleMs = staleMs;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      // Kept, not deleted: it may still be worth serving if the provider fails.
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value as T;
  }

  /**
   * A cached value even if its TTL has passed, provided it is not ancient.
   *
   * Returns the age alongside it, so a caller can be honest about how old the
   * answer is rather than passing it off as live.
   */
  stale<T>(key: string): StaleEntry<T> | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    const ageMs = Date.now() - entry.expiresAt;
    if (ageMs > this.staleMs) {
      this.store.delete(key);
      return undefined;
    }
    return { value: entry.value as T, ageMs };
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

  /**
   * Return the cached value, or compute, store and return a fresh one.
   *
   * With `staleOnError`, a provider failure falls back to a slightly old answer
   * instead of propagating. This is the difference between a page that renders
   * real chain data through a rate limit and one that renders an error.
   */
  async wrap<T>(key: string, load: () => Promise<T>, options: { staleOnError?: boolean } = {}): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;

    try {
      const value = await load();
      this.set(key, value);
      return value;
    } catch (err) {
      if (!options.staleOnError) throw err;
      const fallback = this.stale<T>(key);
      if (!fallback) throw err;
      this.staleServed += 1;
      return fallback.value;
    }
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

  stats(): { size: number; hits: number; misses: number; staleServed: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      staleServed: this.staleServed,
      hitRate: total === 0 ? 0 : Number((this.hits / total).toFixed(3))
    };
  }
}

/** Cache keys are namespaced per chain so two chains cannot collide. */
export function cacheKey(chain: string, ...parts: (string | number | undefined)[]): string {
  return [chain, ...parts.filter((p) => p !== undefined && p !== '')].join(':');
}
