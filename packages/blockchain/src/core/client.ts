/**
 * Transport used by every adapter.
 *
 * The package runs in two places — the browser and the Node API — so nothing
 * here may touch `window`, `document` or `localStorage` unguarded. The mock
 * transport is the default; setting an RPC URL switches an adapter to live
 * HTTP without any call-site changes.
 */

import { ProviderError } from './errors';

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TransportOptions {
  /** Simulated round-trip latency, in ms, for the mock transport. */
  latency?: number;
  /** When set, the mock transport throws a rate-limit error. */
  simulateRateLimit?: boolean;
}

let mockOptions: Required<TransportOptions> = { latency: 120, simulateRateLimit: false };

/**
 * Configure the mock transport. The web app calls this from Settings so the
 * "simulate provider error" toggle can exercise the error states in the UI.
 */
export function configureMockTransport(options: TransportOptions): void {
  mockOptions = { ...mockOptions, ...options };
}

export function getMockTransportOptions(): Required<TransportOptions> {
  return { ...mockOptions };
}

/**
 * Run a synchronous data source behind a promise, applying mock latency and
 * the simulated-failure path. This is what every mock-backed adapter returns.
 */
export async function mockRequest<T>(fn: () => T, latency = mockOptions.latency): Promise<T> {
  await wait(latency);
  if (mockOptions.simulateRateLimit) {
    throw new ProviderError('RATE_LIMITED', 'Upstream provider rate limit exceeded. Retry after 30s.');
  }
  return fn();
}

/** Case-insensitive address/hash comparison, safe across chains. */
export function sameValue(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * JSON-RPC call against an EVM node. Shared by the Ethereum and BNB adapters
 * because both speak the same dialect.
 */
export async function rpcCall<T>(
  url: string,
  method: string,
  params: unknown[],
  chain: string,
  timeoutMs = 10_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal
    });
    if (res.status === 429) throw ProviderError.rateLimited(chain);
    if (!res.ok) {
      throw new ProviderError('UPSTREAM_UNAVAILABLE', `${chain} RPC responded ${res.status}.`, chain);
    }
    const body = (await res.json()) as { result?: T; error?: { message: string } };
    if (body.error) throw new ProviderError('RPC_ERROR', body.error.message, chain);
    return body.result as T;
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ProviderError('UPSTREAM_UNAVAILABLE', `${chain} RPC timed out after ${timeoutMs}ms.`, chain);
    }
    throw new ProviderError('UPSTREAM_UNAVAILABLE', err instanceof Error ? err.message : String(err), chain);
  } finally {
    clearTimeout(timer);
  }
}

/** GET a REST endpoint, mapping non-2xx onto a `ProviderError`. */
export async function httpGet<T>(url: string, chain: string, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal
    });
    if (res.status === 429) throw ProviderError.rateLimited(chain);
    if (res.status === 404) throw new ProviderError('NOT_FOUND', `${url} returned 404.`, chain);
    if (!res.ok) {
      throw new ProviderError('UPSTREAM_UNAVAILABLE', `${chain} provider responded ${res.status}.`, chain);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ProviderError('UPSTREAM_UNAVAILABLE', `${chain} provider timed out after ${timeoutMs}ms.`, chain);
    }
    throw new ProviderError('UPSTREAM_UNAVAILABLE', err instanceof Error ? err.message : String(err), chain);
  } finally {
    clearTimeout(timer);
  }
}
