/**
 * USD prices.
 *
 * Every number a risk tool shows is only meaningful next to a price, and a
 * missing price is worse than a wrong one: it silently turns wallet totals and
 * network volume into zeros. So this resolves what it can and reports the rest
 * as unknown rather than substituting a guess.
 *
 * Prices come from DefiLlama's public price API, which needs no key and — more
 * usefully — accepts a `chain:contract` identifier. That means a token is
 * priced from the same address the transaction came from, instead of from a
 * ticker that may be ambiguous across chains.
 */

import type { ChainId, Transaction } from '@blocksense/shared';

/** How long a price stays usable. Prices move; a day-old total is a lie. */
const TTL_MS = 5 * 60 * 1000;

/** Guards against a pathological history with hundreds of distinct assets. */
const MAX_KEYS_PER_REQUEST = 50;

const ENDPOINT = 'https://coins.llama.fi/prices/current';

/**
 * Native coin to the CoinGecko id DefiLlama indexes it under.
 *
 * BNB is `binancecoin` rather than `bnb`, and TRON is `tron`; guessing these
 * returns no price at all rather than an error, which is easy to miss.
 */
const NATIVE_ID: Record<ChainId, string> = {
  ethereum: 'ethereum',
  bnb: 'binancecoin',
  solana: 'solana',
  bitcoin: 'bitcoin',
  tron: 'tron'
};

export interface PriceQuote {
  usd: number;
  /** Provider confidence, 0–1. Low-confidence quotes are still usable. */
  confidence: number;
  symbol: string;
  timestamp: number;
  /** Token scale as the provider reports it, when it reports one. */
  decimals?: number;
}

interface CacheEntry {
  quote: PriceQuote | null;
  expiresAt: number;
}

/** Chain and contract for one asset, used to build a lookup key. */
export interface PriceKey {
  chain: ChainId;
  /** `nft` has no fungible price here, so it never produces a lookup key. */
  type: 'native' | 'token' | 'nft';
  symbol: string;
  contractAddress?: string;
}

/**
 * Build the provider key for an asset.
 *
 * A contract address is strongly preferred: a ticker is only a hint, and the
 * same ticker exists on several chains with different values.
 */
export function priceKeyFor(key: PriceKey): string | null {
  if (key.type === 'native') {
    const id = NATIVE_ID[key.chain];
    return id ? `coingecko:${id}` : null;
  }
  // A collectible has no fungible price, and treating its contract as a token
  // would attach a nonsense value to it.
  if (key.type === 'nft') return null;
  if (key.contractAddress && /^(0x[0-9a-f]{40}|[1-9A-HJ-NP-Za-km-z]{33,34})$/i.test(key.contractAddress)) {
    // DefiLlama lower-cases the address for the lookup key.
    return `${key.chain}:${key.contractAddress.toLowerCase()}`;
  }
  // No usable contract: fall back to the ticker. DefiLlama resolves many
  // CoinGecko-style ids, and a miss simply returns no price.
  const symbol = key.symbol.replace(/^coingecko:/i, '').trim();
  return symbol ? `coingecko:${symbol.toLowerCase()}` : null;
}

export class PriceService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly ttlMs: number;

  constructor(options: { endpoint?: string; fetchImpl?: typeof fetch; ttlMs?: number } = {}) {
    this.endpoint = options.endpoint ?? ENDPOINT;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.ttlMs = options.ttlMs ?? TTL_MS;
  }

  private cached(key: string): PriceQuote | null | undefined {
    const hit = this.cache.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return hit.quote;
  }

  private store(key: string, quote: PriceQuote | null): void {
    // A failure is cached too: an asset the provider does not list will not be
    // listed on the next request either, and re-asking wastes the rate limit.
    this.cache.set(key, { quote, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Resolve several assets in one request.
   *
   * Batching matters: a 200-transaction history would otherwise be 200 HTTP
   * calls against a shared public budget.
   */
  async quoteMany(keys: PriceKey[]): Promise<Map<string, PriceQuote>> {
    const out = new Map<string, PriceQuote>();
    const missing: string[] = [];

    for (const key of keys) {
      const providerKey = priceKeyFor(key);
      if (!providerKey) continue;
      if (out.has(providerKey)) continue;

      const hit = this.cached(providerKey);
      if (hit === null) continue; // known-unpriced, do not ask again
      if (hit) {
        out.set(providerKey, hit);
        continue;
      }
      missing.push(providerKey);
    }

    for (let i = 0; i < missing.length; i += MAX_KEYS_PER_REQUEST) {
      const batch = missing.slice(i, i + MAX_KEYS_PER_REQUEST);
      const { quotes, ok } = await this.fetchBatch(batch);
      for (const key of batch) {
        const quote = quotes.get(key) ?? null;
        // Only a successful answer is cached, and an absent entry within one is
        // a real "this provider does not list it". Caching a transport failure
        // would instead record it as unlisted for the whole TTL, so a single
        // dropped request left a token nameless and unpriced for five minutes.
        if (ok || quote) this.store(key, quote);
        if (quote) out.set(key, quote);
      }
    }

    return out;
  }

  /**
   * Fetch one batch.
   *
   * `ok` distinguishes "the provider answered and did not list these" from "the
   * request never completed". The first is worth remembering; the second is not.
   */
  private async fetchBatch(keys: string[]): Promise<{ quotes: Map<string, PriceQuote>; ok: boolean }> {
    const quotes = new Map<string, PriceQuote>();
    if (keys.length === 0) return { quotes, ok: true };

    const url = `${this.endpoint}/${keys.map(encodeURIComponent).join(',')}`;
    let payload: {
      coins?: Record<string, { price?: number; symbol?: string; timestamp?: number; confidence?: number; decimals?: number }>;
    };
    try {
      const res = await this.fetchImpl(url, { headers: { accept: 'application/json' } });
      if (!res.ok) return { quotes, ok: false };
      payload = (await res.json()) as typeof payload;
    } catch {
      // Price data is an enrichment, never a reason to fail a request.
      return { quotes, ok: false };
    }

    for (const [key, coin] of Object.entries(payload.coins ?? {})) {
      const usd = coin.price;
      if (typeof usd !== 'number' || !Number.isFinite(usd) || usd < 0) continue;
      quotes.set(key, {
        usd,
        confidence: coin.confidence ?? 0,
        symbol: coin.symbol ?? '',
        timestamp: (coin.timestamp ?? 0) * 1000,
        ...(typeof coin.decimals === 'number' ? { decimals: coin.decimals } : {})
      });
    }
    return { quotes, ok: true };
  }

  /**
   * The provider's own view of a token: ticker and scale.
   *
   * This is a *fallback* for chains whose node does not answer metadata calls
   * reliably, never a primary source. The chain is authoritative for
   * `decimals`; this is what keeps an amount from being scaled by the wrong
   * power of ten when that call is dropped. It reuses the price cache, so a
   * token that has already been priced costs no extra request.
   */
  async tokenMetadata(
    chain: ChainId,
    contractAddress: string
  ): Promise<{ symbol: string; decimals?: number } | null> {
    const key = priceKeyFor({ chain, type: 'token', symbol: '', contractAddress });
    if (!key) return null;

    const hit = this.cached(key);
    if (hit === null) return null;
    if (hit) return hit.symbol ? { symbol: hit.symbol, ...(hit.decimals !== undefined ? { decimals: hit.decimals } : {}) } : null;

    const quotes = await this.quoteMany([{ chain, type: 'token', symbol: '', contractAddress }]);
    const quote = quotes.get(key);
    if (!quote?.symbol) return null;
    return { symbol: quote.symbol, ...(quote.decimals !== undefined ? { decimals: quote.decimals } : {}) };
  }

  /**
   * Attach USD values to transactions.
   *
   * Transactions whose asset cannot be priced keep no `valueUsd` at all, which
   * downstream code already treats as unknown rather than as zero.
   */
  async enrich(transactions: Transaction[]): Promise<Transaction[]> {
    if (transactions.length === 0) return transactions;

    const keys: PriceKey[] = transactions.map((tx) => ({
      chain: tx.chain,
      type: tx.asset.type,
      symbol: tx.asset.symbol,
      ...(tx.asset.contractAddress ? { contractAddress: tx.asset.contractAddress } : {})
    }));

    const quotes = await this.quoteMany(keys);

    return transactions.map((tx) => {
      if (tx.asset.valueUsd !== undefined) return tx;
      const providerKey = priceKeyFor({
        chain: tx.chain,
        type: tx.asset.type,
        symbol: tx.asset.symbol,
        ...(tx.asset.contractAddress ? { contractAddress: tx.asset.contractAddress } : {})
      });
      const quote = providerKey ? quotes.get(providerKey) : undefined;
      const amount = Number(tx.asset.amount);
      if (!quote || !Number.isFinite(amount)) return tx;

      return {
        ...tx,
        asset: { ...tx.asset, valueUsd: amount * quote.usd }
      };
    });
  }
}

/** Process-wide instance; the cache is the reason to share it. */
export const priceService = new PriceService();

let active: PriceService = priceService;

/**
 * Swap the price source.
 *
 * This exists so tests can install an offline source. Without it, a unit test
 * that renders one transaction silently reaches a public price API, and the
 * suite stops being deterministic and starts depending on a third party's
 * uptime. Pass `null` to restore the real service.
 */
export function setPriceService(next: PriceService | null): void {
  active = next ?? priceService;
}

/** The price source in effect, honouring any `setPriceService` override. */
export function activePriceService(): PriceService {
  return active;
}
