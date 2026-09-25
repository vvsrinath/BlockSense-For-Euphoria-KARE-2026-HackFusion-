/**
 * The web API client's request URLs.
 *
 * Nothing else in the test suite covers this file, and a wrong URL here is
 * invisible to the type checker while breaking the whole app: every call 404s
 * and the failure looks like missing chain data rather than a malformed path.
 * These tests pin the exact URLs against the real route table in
 * `apps/api/src/routes/index.ts`.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../apps/web/src/services/api';

/** Captures the URL of the next request and answers with an empty success. */
function captureUrl(): { url: () => string } {
  let seen = '';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      seen = String(url);
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    })
  );
  return { url: () => seen };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request URLs', () => {
  it('places the chain after the resource, not before', async () => {
    const { url } = captureUrl();
    await api.transaction('tron', 'abc123');
    expect(url()).toBe('/api/v1/transactions/tron/abc123');
  });

  it('builds a wallet URL with the chain in the documented position', async () => {
    const { url } = captureUrl();
    await api.wallet('bitcoin', 'bc1qexample');
    expect(url()).toBe('/api/v1/wallets/bitcoin/bc1qexample');
  });

  it('keeps a query string after the path parameters', async () => {
    const { url } = captureUrl();
    await api.walletHistory('solana', 'SoLaDr', 25);
    expect(url()).toBe('/api/v1/wallets/solana/SoLaDr/history?limit=25');
  });

  it('scopes balances to the wallet and chain', async () => {
    const { url } = captureUrl();
    await api.walletBalances('ethereum', '0xabc');
    expect(url()).toBe('/api/v1/wallets/ethereum/0xabc/balances');
  });

  it('passes graph depth through as a query parameter', async () => {
    const { url } = captureUrl();
    await api.network('tron', 'TWallet', 3);
    expect(url()).toBe('/api/v1/wallets/tron/TWallet/network?depth=3');
  });

  it('scopes an asset lookup by chain', async () => {
    const { url } = captureUrl();
    await api.asset('ethereum', '0xtoken');
    expect(url()).toBe('/api/v1/assets/ethereum/0xtoken');
  });

  it('never emits an unresolved placeholder', async () => {
    const { url } = captureUrl();
    await api.transaction('bnb', '0xdeadbeef');
    // A literal `{chain}` in a request means the substitution silently failed.
    expect(url()).not.toContain('{chain}');
  });
});
