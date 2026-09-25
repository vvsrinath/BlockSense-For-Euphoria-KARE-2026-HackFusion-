/**
 * Behaviour under a throttled or unavailable provider.
 *
 * Most failures in this product are a shared public endpoint saying no for a few
 * seconds. The requirement is that a reader sees real chain data through that,
 * rather than a dead-end error page, so these tests pin the three mechanisms
 * that deliver it: serving a recent cached answer, backing off properly, and
 * telling the difference between a rate limit and a missing transaction.
 */

import { describe, expect, it, vi } from 'vitest';
import { TtlCache, cacheKey } from '../apps/api/src/middleware/cache';
import { ProviderError } from '@blocksense/blockchain';
import { withRetry } from '@blocksense/blockchain';

describe('TtlCache stale fallback', () => {
  it('serves a fresh value without calling the loader', async () => {
    const cache = new TtlCache({ ttlMs: 1000 });
    const load = vi.fn(async () => 'value');
    expect(await cache.wrap('k', load)).toBe('value');
    expect(await cache.wrap('k', load)).toBe('value');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('falls back to a recently expired value when the loader fails', async () => {
    // This is the whole point: a provider declining a request must not replace
    // a real answer with an error.
    vi.useFakeTimers();
    try {
      const cache = new TtlCache({ ttlMs: 1000, staleMs: 60_000 });
      expect(await cache.wrap('k', async () => 'fresh')).toBe('fresh');

      vi.advanceTimersByTime(5_000); // past the TTL, well inside the stale window
      const failing = async () => {
        throw ProviderError.rateLimited('solana');
      };
      expect(await cache.wrap('k', failing, { staleOnError: true })).toBe('fresh');
      expect(cache.stats().staleServed).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('still fails when there is nothing cached to fall back on', async () => {
    const cache = new TtlCache({ ttlMs: 1000, staleMs: 60_000 });
    await expect(
      cache.wrap('missing', async () => {
        throw ProviderError.rateLimited('solana');
      }, { staleOnError: true })
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('refuses a value that is too old to be worth showing', async () => {
    // A transaction from an hour ago is still true, but presenting it without
    // saying so would be misleading, so there is a ceiling.
    vi.useFakeTimers();
    try {
      const cache = new TtlCache({ ttlMs: 1000, staleMs: 5_000 });
      await cache.wrap('k', async () => 'old');

      vi.advanceTimersByTime(60_000);
      await expect(
        cache.wrap('k', async () => {
          throw ProviderError.rateLimited('solana');
        }, { staleOnError: true })
      ).rejects.toBeInstanceOf(ProviderError);
    } finally {
      vi.useRealTimers();
    }
  });

  it('propagates the failure when stale fallback is not requested', async () => {
    const cache = new TtlCache({ ttlMs: 1000, staleMs: 60_000 });
    await cache.wrap('k', async () => 'value');
    vi.useFakeTimers();
    try {
      vi.advanceTimersByTime(5_000);
      await expect(
        cache.wrap('k', async () => {
          throw ProviderError.rateLimited('solana');
        })
      ).rejects.toBeInstanceOf(ProviderError);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not let a failed load poison a later successful one', async () => {
    const cache = new TtlCache({ ttlMs: 1000, staleMs: 60_000 });
    let shouldFail = true;
    const load = async () => {
      if (shouldFail) throw ProviderError.rateLimited('solana');
      return 'value';
    };
    await expect(cache.wrap('k', load, { staleOnError: true })).rejects.toBeInstanceOf(ProviderError);
    shouldFail = false;
    expect(await cache.wrap('k', load, { staleOnError: true })).toBe('value');
  });

  it('namespaces keys per chain so two chains cannot collide', () => {
    // Bitcoin and Ethereum are both base-58-ish strings; a shared key would let
    // one chain's answer be served for another's.
    expect(cacheKey('bitcoin', 'tx', 'abc')).not.toBe(cacheKey('ethereum', 'tx', 'abc'));
  });
});

describe('withRetry', () => {
  const policy = { timeoutMs: 50, attempts: 3, backoffMs: 1 };

  it('retries a rate limit and succeeds', async () => {
    let calls = 0;
    const result = await withRetry('solana', policy, async () => {
      calls += 1;
      if (calls < 3) throw ProviderError.rateLimited('solana');
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('gives up after the attempt budget', async () => {
    const attempt = vi.fn(async () => {
      throw ProviderError.rateLimited('solana');
    });
    await expect(withRetry('solana', policy, attempt)).rejects.toBeInstanceOf(ProviderError);
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('does not retry something that will not change', async () => {
    // Retrying a missing transaction only makes the reader wait longer for the
    // same answer.
    const attempt = vi.fn(async () => {
      throw ProviderError.transactionNotFound('0xabc', 'ethereum');
    });
    await expect(withRetry('ethereum', policy, attempt)).rejects.toBeInstanceOf(ProviderError);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('does not retry an invalid identifier', async () => {
    const attempt = vi.fn(async () => {
      throw ProviderError.invalidAddress('nope', 'bitcoin');
    });
    await expect(withRetry('bitcoin', policy, attempt)).rejects.toBeInstanceOf(ProviderError);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('carries the provider’s retry hint on the error', async () => {
    // A shared endpoint knows when its quota refills; obeying it beats guessing.
    const error = ProviderError.rateLimited('solana', 2500);
    expect(error.retryAfterMs).toBe(2500);
  });
});
