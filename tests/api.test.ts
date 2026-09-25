/**
 * End-to-end API tests.
 *
 * The server runs in-process on an ephemeral port, so these exercise the real
 * routing, envelope, validation and error-mapping path rather than a mock of it.
 *
 * Adapters are the only component that reaches the network, and they are
 * installed as fixtures through `setAdapters`. That keeps the suite
 * deterministic without reintroducing a mock data path in normal operation: a
 * test asks for a chain the stub does not implement and gets a real provider
 * error, which is itself worth asserting.
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApiServer } from '../apps/api/src/index';
import { resetAdapters, setAdapters } from '../apps/api/src/services/index';
import { BaseAdapter, ProviderError } from '../packages/blockchain/src/index';
import type { BlockchainAdapter } from '../packages/blockchain/src/index';
import type { ChainId, Transaction, TransactionAsset, Wallet } from '@blocksense/shared';
import { transactionFixture, walletFixture } from './fixtures/chain';

let server: Server;
let base: string;

const EVM_TX = '0x4a5e1b4b0c0d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b';
const EVM_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

/**
 * The assertions read arbitrary JSON without pinning its exact type: a
 * recursive JSON type would need a cast at every nested access and would hide
 * what each test is actually checking.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function api(path: string, init?: RequestInit): Promise<{ status: number; body: any; headers: Headers }> {
  const res = await fetch(`${base}${path}`, init);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}

/** A chain that answers from fixtures, and 404s anything it does not know. */
function stubChain(id: ChainId, options: { history?: Transaction[]; transaction?: Transaction } = {}): BlockchainAdapter {
  class StubAdapter extends BaseAdapter {
    readonly id = id;
    readonly name = id;
    readonly nativeSymbol = 'TST';
    readonly decimals = 18;

    constructor() {
      super({ id, name: id, nativeSymbol: 'TST', decimals: 18, rpcUrl: `stub://${id}` });
    }

    override get isLive(): boolean {
      return true;
    }

    override async getTransaction(hash: string): Promise<Transaction> {
      if (options.transaction && options.transaction.hash === hash) return options.transaction;
      throw ProviderError.notFound('Transaction', hash, this.name);
    }

    override async getHistory(): Promise<Transaction[]> {
      return options.history ?? [];
    }

    override async getWallet(address: string): Promise<Wallet> {
      return walletFixture(id, address);
    }

    override async getBalances() {
      return [{ assetId: `${id}-tst`, symbol: 'TST', amount: 1, decimals: 18 }];
    }
  }
  return new StubAdapter();
}

const transaction = transactionFixture({ chain: 'ethereum', hash: EVM_TX, from: EVM_ADDRESS });

beforeAll(async () => {
  setAdapters({ ethereum: stubChain('ethereum', { transaction, history: [transaction] }) });
  server = createApiServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

afterEach(() => {
  // Later tests deliberately hit a chain with no stub installed.
  resetAdapters();
  setAdapters({ ethereum: stubChain('ethereum', { transaction, history: [transaction] }) });
});

afterAll(async () => {
  resetAdapters();
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

describe('response envelope', () => {
  it('wraps a success with meta so a response can be traced', async () => {
    const { status, body } = await api('/api/v1/health');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.meta.requestId).toMatch(/^req_/);
    expect(typeof body.meta.timestamp).toBe('number');
  });

  it('never wraps a failure as a success', async () => {
    const { status, body } = await api('/api/v1/nope');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.data).toBeUndefined();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('echoes a caller-supplied correlation id', async () => {
    const { headers } = await api('/api/v1/health', { headers: { 'x-request-id': 'req_test_123' } });
    expect(headers.get('x-request-id')).toBe('req_test_123');
  });
});

describe('service metadata', () => {
  it('reports health for every registered chain', async () => {
    const { body } = await api('/api/v1/health');
    expect(body.data.chains).toHaveLength(5);
    expect(body.data.chains.every((c: { live: boolean }) => c.live)).toBe(true);
  });

  it('publishes its own route table under /api/v1', async () => {
    const { body } = await api('/api/v1');
    expect(body.data.routes.some((r: { path: string }) => r.path === '/api/v1/analyze')).toBe(true);
  });

  it('declares that it serves live data', async () => {
    const { body } = await api('/api/v1');
    expect(body.data.dataSource).toBe('live');
  });
});

describe('transactions', () => {
  it('returns a transaction for the chain the request names', async () => {
    const { status, body } = await api(`/api/v1/transactions/ethereum/${EVM_TX}`);
    expect(status).toBe(200);
    expect(body.data.hash).toBe(EVM_TX);
    expect(body.data.chain).toBe('ethereum');
  });

  it('404s a transaction the provider does not have', async () => {
    const { status, body } = await api('/api/v1/transactions/ethereum/0xdeadbeef');
    expect(status).toBe(404);
    expect(body.error.code).toBe('TRANSACTION_NOT_FOUND');
  });

  it('400s an unsupported chain rather than guessing one', async () => {
    const { status, body } = await api(`/api/v1/transactions/dogecoin/${EVM_TX}`);
    expect(status).toBe(400);
    expect(body.error.code).toBe('UNSUPPORTED_CHAIN');
  });

  it('returns wallet history', async () => {
    const { status, body } = await api(`/api/v1/wallets/ethereum/${EVM_ADDRESS}/history?limit=10`);
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

describe('wallets', () => {
  it('returns a profile built from the chain', async () => {
    const { status, body } = await api(`/api/v1/wallets/ethereum/${EVM_ADDRESS}`);
    expect(status).toBe(200);
    expect(body.data.address).toBe(EVM_ADDRESS);
    expect(body.data.chain).toBe('ethereum');
  });

  it('serves holdings from the balances read, not the profile', async () => {
    const { body } = await api(`/api/v1/wallets/ethereum/${EVM_ADDRESS}/assets`);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0]).toHaveProperty('assetId');
  });

  it('caps the network graph at the documented depth', async () => {
    const { status, body } = await api(`/api/v1/wallets/ethereum/${EVM_ADDRESS}/network?depth=9`);
    expect(status).toBe(400);
    expect(JSON.stringify(body.error)).toContain('depth');
  });
});

describe('analysis', () => {
  it('returns a score, a headline and a normalised transaction', async () => {
    const { status, body } = await api('/api/v1/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash: EVM_TX, chain: 'ethereum' })
    });

    expect(status).toBe(200);
    expect(body.data.transaction.hash).toBe(EVM_TX);
    expect(body.data.score).toHaveProperty('score');
    expect(body.data.score).toHaveProperty('level');
    expect(typeof body.data.headline).toBe('string');
    expect(Array.isArray(body.data.findings)).toBe(true);
  });

  it('rejects a malformed body rather than guessing the chain', async () => {
    const { status, body } = await api('/api/v1/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash: 'short' })
    });
    expect(status).toBeGreaterThanOrEqual(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBeTruthy();
  });

  it('rejects a body that is not valid JSON', async () => {
    const { status, body } = await api('/api/v1/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not json'
    });
    expect(status).toBe(400);
    expect(body.error.message).toMatch(/JSON/i);
  });
});

describe('search', () => {
  it('requires a query', async () => {
    const { status, body } = await api('/api/v1/search');
    expect(status).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  it('classifies an identifier without inventing one', async () => {
    const { status, body } = await api(`/api/v1/search?q=${EVM_ADDRESS}`);
    expect(status).toBe(200);
    expect(typeof body.data.kind).toBe('string');
  });
});

describe('reports', () => {
  it('creates a report and then serves it by id', async () => {
    const created = await api('/api/v1/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash: EVM_TX, chain: 'ethereum' })
    });
    expect(created.status).toBe(200);
    const id = created.body.data.id;

    const read = await api(`/api/v1/reports/${id}`);
    expect(read.status).toBe(200);
    expect(read.body.data.id).toBe(id);
    expect(read.body.data.sections.length).toBeGreaterThan(0);

    const list = await api('/api/v1/reports');
    expect(list.body.data.reports.some((r: { id: string }) => r.id === id)).toBe(true);
  });

  it('404s a report id it does not hold, because storage is in memory', async () => {
    const { status, body } = await api('/api/v1/reports/req_missing');
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('error handling', () => {
  it('404s an unknown route', async () => {
    const { status, body } = await api('/api/v1/does-not-exist');
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('405s a known path reached with the wrong verb', async () => {
    const { status, body } = await api('/api/v1/health', { method: 'DELETE' });
    expect(status).toBe(405);
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('reports a provider failure as an upstream problem, not a missing route', async () => {
    // No stub is installed for TRON, so this reaches the live adapter config.
    // Either answer is correct; what matters is that it is a typed API error.
    const { status, body } = await api('/api/v1/transactions/tron/abcdef0123456789abcdef');
    expect([400, 404, 429, 502, 503]).toContain(status);
    expect(body.error.code).toBeTruthy();
    expect(body.error).toHaveProperty('chain');
  });

  it('answers a CORS preflight without a body', async () => {
    const res = await fetch(`${base}/api/v1/health`, {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:5173' }
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('sets security headers on every response', async () => {
    const { headers } = await api(`/api/v1/wallets/ethereum/${EVM_ADDRESS}`);
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-ratelimit-limit')).toBeTruthy();
    expect(headers.get('x-ratelimit-remaining')).toBeTruthy();
  });

  it('does not spend rate limit quota on health checks', async () => {
    const first = await api('/api/v1/health');
    const second = await api('/api/v1/health');
    expect(first.headers.get('x-ratelimit-remaining')).toBeNull();
    expect(second.headers.get('x-ratelimit-remaining')).toBeNull();
  });
});

describe('asset typing', () => {
  it('keeps token amounts as strings so precision is not lost in JSON', async () => {
    const big: TransactionAsset = { type: 'token', name: 'T', symbol: 'T', amount: '115792089237316195423570985008687907853269984665640564039457584007913129639935' };
    const t = transactionFixture({ chain: 'ethereum', hash: EVM_TX, asset: big });
    setAdapters({ ethereum: stubChain('ethereum', { transaction: t }) });

    const { body } = await api(`/api/v1/transactions/ethereum/${EVM_TX}`);
    expect(typeof body.data.asset.amount).toBe('string');
    expect(body.data.asset.amount).toBe(big.amount);
  });
});
