/**
 * End-to-end API tests.
 *
 * The server is started in-process on an ephemeral port, so these exercise the
 * real routing, validation, service and error-mapping path rather than mocking
 * it. Every request uses mocked data, so the suite is deterministic and needs
 * no network access.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApiServer } from '../apps/api/src/index';

let server: Server;
let base: string;

const EVM_TX = '0x4a5e1b4b0c0d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b';
const EVM_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

// The assertions below deliberately read arbitrary JSON without asserting its
// exact shape; a recursive JSON type would need a cast at every nested access
// and would obscure what each test is actually checking.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function api(path: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const res = await fetch(`${base}${path}`, init);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  server = createApiServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

describe('service metadata', () => {
  it('reports health for every registered chain', async () => {
    const { status, body } = await api('/api/health');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.chains).toHaveLength(5);
  });

  it('lists chains with explorer metadata', async () => {
    const { status, body } = await api('/api/chains');
    expect(status).toBe(200);
    const ethereum = body.chains.find((c: { id: string }) => c.id === 'ethereum');
    expect(ethereum.symbol).toBe('ETH');
    expect(ethereum.txExplorer).toContain('etherscan');
  });

  it('publishes its own route table', async () => {
    const { body } = await api('/api');
    expect(body.routes.some((r: { path: string }) => r.path === '/api/analyze')).toBe(true);
  });
});

describe('detection', () => {
  it('identifies a Bitcoin address', async () => {
    const { body } = await api('/api/detect?q=bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    expect(body.kind).toBe('address');
    expect(body.chains).toEqual(['bitcoin']);
  });

  it('rejects a search query that is too short to be an identifier', async () => {
    const { status, body } = await api('/api/detect?q=ab');
    expect(status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });
});

describe('analysis', () => {
  it('returns a score, a headline and a normalised transaction', async () => {
    const { status, body } = await api('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash: EVM_TX, chain: 'ethereum' })
    });

    expect(status).toBe(200);
    expect(body.chain).toBe('ethereum');
    expect(body.transaction.hash).toBe(EVM_TX);
    expect(body.score).toHaveProperty('score');
    expect(body.score).toHaveProperty('level');
    expect(typeof body.headline).toBe('string');
    expect(Array.isArray(body.findings)).toBe(true);
    expect(body.explorer).toContain('etherscan.io/tx/');
  });

  it('infers the chain when the client does not name one', async () => {
    const { body } = await api('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash: EVM_TX })
    });
    expect(body.chain).toBe('ethereum');
  });

  it('rejects a malformed body with field-level detail', async () => {
    const { status, body } = await api('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash: 'short' })
    });
    expect(status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.details[0].path).toBe('hash');
  });

  it('rejects a body that is not valid JSON', async () => {
    const { status, body } = await api('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not json'
    });
    expect(status).toBe(400);
    expect(body.error.message).toContain('JSON');
  });
});

describe('network graph', () => {
  it('returns a bounded graph anchored on the requested address', async () => {
    const { status, body } = await api(`/api/wallet/ethereum/${EVM_ADDRESS}/network`);
    expect(status).toBe(200);
    expect(body.centerId).toBe(EVM_ADDRESS);
    expect(body.chain).toBe('ethereum');
    expect(body.entities[0].kind).toBe('center');
    expect(body.stats.entities).toBe(body.entities.length);
  });

  it('caps the expansion depth at the documented maximum', async () => {
    const { status, body } = await api(`/api/wallet/ethereum/${EVM_ADDRESS}/network?depth=9`);
    expect(status).toBe(400);
    expect(body.error.message).toContain('depth');
  });
});

describe('error handling', () => {
  it('404s an unknown route', async () => {
    const { status, body } = await api('/api/does-not-exist');
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('405s a known path reached with the wrong verb', async () => {
    const { status, body } = await api('/api/health', { method: 'DELETE' });
    expect(status).toBe(405);
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('400s an unsupported chain rather than guessing', async () => {
    const { status, body } = await api(`/api/transaction/dogecoin/${EVM_TX}`);
    expect(status).toBe(400);
    expect(body.error.message).toContain('chain');
  });

  it('404s a transaction the adapter cannot find', async () => {
    // The base adapter reports NOT_FOUND for chains with no transaction index.
    const { status, body } = await api('/api/transaction/tron/abcdef0123456789abcdef');
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('answers a CORS preflight without a body', async () => {
    const res = await fetch(`${base}/api/health`, {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:5173' }
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('echoes a correlation id so a request can be traced in the logs', async () => {
    const res = await fetch(`${base}/api/health`, { headers: { 'x-request-id': 'req_test_123' } });
    expect(res.headers.get('x-request-id')).toBe('req_test_123');
  });
});
