/**
 * USD price resolution.
 *
 * A price is the difference between a useful number and a zero. These tests pin
 * the lookup keys, the caching, and — most importantly — the rule that an asset
 * the provider does not know about stays unknown rather than becoming a zero or
 * a guess.
 */

import { describe, expect, it, vi } from 'vitest';
import { PriceService, priceKeyFor } from '@blocksense/blockchain';
import type { PriceKey } from '@blocksense/blockchain';

/** Minimal stand-in for the DefiLlama response shape. */
function responder(prices: Record<string, { price: number; symbol: string; confidence?: number }>) {
  return vi.fn(async (url: string) => {
    const keys = decodeURIComponent(String(url).split('/').pop() ?? '')
      .split(',')
      .map((k) => k.replace(/^coingecko:/, ''));
    const coins: Record<string, unknown> = {};
    for (const key of keys) {
      const hit = prices[key];
      if (hit) coins[`coingecko:${key}`] = { ...hit, timestamp: 1_700_000_000, confidence: hit.confidence ?? 0.99 };
    }
    return new Response(JSON.stringify({ coins }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  });
}

describe('priceKeyFor', () => {
  it('uses the indexed id for each native coin', () => {
    // BNB is binancecoin and TRON is tron on the provider; guessing either
    // returns no price at all rather than an error, which is easy to miss.
    expect(priceKeyFor({ chain: 'bitcoin', type: 'native', symbol: 'BTC' })).toBe('coingecko:bitcoin');
    expect(priceKeyFor({ chain: 'ethereum', type: 'native', symbol: 'ETH' })).toBe('coingecko:ethereum');
    expect(priceKeyFor({ chain: 'bnb', type: 'native', symbol: 'BNB' })).toBe('coingecko:binancecoin');
    expect(priceKeyFor({ chain: 'solana', type: 'native', symbol: 'SOL' })).toBe('coingecko:solana');
    expect(priceKeyFor({ chain: 'tron', type: 'native', symbol: 'TRX' })).toBe('coingecko:tron');
  });

  it('prefers a chain-scoped contract key over a ticker', () => {
    // The same ticker exists on several chains with different values, so the
    // address the transaction actually came from is the only safe key.
    expect(
      priceKeyFor({
        chain: 'ethereum',
        type: 'token',
        symbol: 'USDT',
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      })
    ).toBe('ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7');
  });

  it('lowercases base58 TRON contracts', () => {
    expect(
      priceKeyFor({ chain: 'tron', type: 'token', symbol: 'USDT', contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' })
    ).toBe('tron:tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t');
  });

  it('falls back to a ticker when there is no usable contract', () => {
    expect(priceKeyFor({ chain: 'ethereum', type: 'token', symbol: 'WETH' })).toBe('coingecko:weth');
  });

  it('never prices a collectible', () => {
    // Its contract is not a token contract, so looking it up would attach a
    // meaningless fungible value to an NFT.
    expect(
      priceKeyFor({ chain: 'ethereum', type: 'nft', symbol: 'BAYC #1', contractAddress: '0x0000000000000000000000000000000000000001' })
    ).toBeNull();
  });

  it('ignores a contract that is not an address', () => {
    expect(priceKeyFor({ chain: 'ethereum', type: 'token', symbol: 'USDT', contractAddress: 'not-an-address' })).toBe(
      'coingecko:usdt'
    );
  });
});

describe('PriceService.quoteMany', () => {
  it('resolves a native price', async () => {
    const fetchImpl = responder({ bitcoin: { price: 84_000, symbol: 'BTC' } });
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const quotes = await service.quoteMany([{ chain: 'bitcoin', type: 'native', symbol: 'BTC' }]);
    expect(quotes.get('coingecko:bitcoin')?.usd).toBe(84_000);
  });

  it('batches many assets into a single request', async () => {
    const fetchImpl = responder({
      bitcoin: { price: 84_000, symbol: 'BTC' },
      ethereum: { price: 2_700, symbol: 'ETH' },
      solana: { price: 122, symbol: 'SOL' }
    });
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const quotes = await service.quoteMany([
      { chain: 'bitcoin', type: 'native', symbol: 'BTC' },
      { chain: 'ethereum', type: 'native', symbol: 'ETH' },
      { chain: 'solana', type: 'native', symbol: 'SOL' }
    ]);
    expect(quotes.size).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('serves a repeat lookup from cache', async () => {
    const fetchImpl = responder({ bitcoin: { price: 84_000, symbol: 'BTC' } });
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const key: PriceKey[] = [{ chain: 'bitcoin', type: 'native', symbol: 'BTC' }];
    await service.quoteMany(key);
    await service.quoteMany(key);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not ask again about an asset the provider does not list', async () => {
    const fetchImpl = responder({});
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const key: PriceKey[] = [{ chain: 'tron', type: 'token', symbol: 'WINK', contractAddress: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7' }];
    const first = await service.quoteMany(key);
    const second = await service.quoteMany(key);
    expect(first.size).toBe(0);
    expect(second.size).toBe(0);
    // A miss is a final answer, not a reason to spend the rate limit again.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('survives a provider outage without failing the caller', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const quotes = await service.quoteMany([{ chain: 'bitcoin', type: 'native', symbol: 'BTC' }]);
    // Price data is an enrichment; losing it must not take a page down.
    expect(quotes.size).toBe(0);
  });

  it('survives a non-2xx response', async () => {
    const fetchImpl = vi.fn(async () => new Response('rate limited', { status: 429 }));
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    expect((await service.quoteMany([{ chain: 'bitcoin', type: 'native', symbol: 'BTC' }])).size).toBe(0);
  });
});

describe('PriceService.enrich', () => {
  const tx = (asset: Record<string, unknown>) =>
    ({
      hash: '0xabc',
      chain: 'ethereum',
      from: 'a',
      to: 'b',
      timestamp: 0,
      status: 'confirmed',
      asset: { type: 'native', name: 'Ethereum', symbol: 'ETH', amount: '2', decimals: 18, direction: 'sent', ...asset }
    }) as never;

  it('multiplies the amount by the price', async () => {
    const fetchImpl = responder({ ethereum: { price: 2_700, symbol: 'ETH' } });
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const [priced] = await service.enrich([tx({})]);
    expect(priced.asset.valueUsd).toBeCloseTo(5_400);
  });

  it('leaves an unpriceable asset without a value rather than zeroing it', async () => {
    const fetchImpl = responder({});
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const [priced] = await service.enrich([
      tx({ type: 'token', symbol: 'SCAM', contractAddress: '0x1111111111111111111111111111111111111111' })
    ]);
    // Absent, not 0: downstream code treats these differently, and a fake zero
    // would drag every average and total down.
    expect(priced.asset.valueUsd).toBeUndefined();
  });

  it('never overwrites a price the adapter already supplied', async () => {
    const fetchImpl = responder({ ethereum: { price: 2_700, symbol: 'ETH' } });
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const [priced] = await service.enrich([tx({ valueUsd: 12_345 })]);
    expect(priced.asset.valueUsd).toBe(12_345);
  });

  it('handles an empty history without calling the provider', async () => {
    const fetchImpl = responder({});
    const service = new PriceService({ fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(await service.enrich([])).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
