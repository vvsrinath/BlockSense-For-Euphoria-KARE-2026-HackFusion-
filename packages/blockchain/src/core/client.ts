/**
 * Transport used by every adapter.
 *
 * The package runs in two places — the browser and the Node API — so nothing
 * here may touch `window`, `document` or `localStorage` unguarded.
 *
 * Every outbound request is bounded three ways (spec §57): a timeout, a
 * limited number of retries, and exponential backoff. Retries only cover
 * failures that are safe to repeat — a timeout, a 5xx, or a connection reset.
 * A 4xx means the request is wrong, so repeating it would only waste the
 * provider's quota.
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
    throw ProviderError.rateLimited();
  }
  return fn();
}

/** Case-insensitive address/hash comparison, safe across chains. */
export function sameValue(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export interface RequestPolicy {
  /** Per-attempt timeout in ms. */
  timeoutMs: number;
  /** Total attempts, including the first. */
  attempts: number;
  /** First backoff step in ms; doubles each retry. */
  backoffMs: number;
}

export const DEFAULT_POLICY: RequestPolicy = { timeoutMs: 15_000, attempts: 3, backoffMs: 400 };

/** Status codes worth repeating: transient server-side or throttling failures. */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Run `attempt` with a bounded retry policy.
 *
 * A `ProviderError` is re-thrown unchanged when its code says the request was
 * invalid or the resource does not exist, and retried when it says the
 * provider was unreachable, slow or throttling us. Anything else is wrapped as
 * a provider error so a raw network failure can never escape an adapter.
 */
export async function withRetry<T>(
  chain: string,
  policy: Partial<RequestPolicy>,
  attempt: () => Promise<T>
): Promise<T> {
  const { timeoutMs, attempts, backoffMs } = { ...DEFAULT_POLICY, ...policy };

  let lastError: ProviderError = ProviderError.rpcUnavailable(`${chain} provider call failed.`, chain);

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await attempt();
    } catch (err) {
      const error = err instanceof ProviderError ? err : toTransportError(err, chain, timeoutMs);
      lastError = error;

      const retryable =
        error.code === 'RPC_UNAVAILABLE' || error.code === 'RPC_TIMEOUT' || error.code === 'RPC_RATE_LIMITED';

      if (!retryable || i === attempts - 1) throw error;

      // Exponential backoff. A 429 means the provider is throttling, so waiting
      // longer between attempts is the whole point.
      await wait(backoffMs * 2 ** i);
    }
  }

  throw lastError;
}

function toTransportError(err: unknown, chain: string, timeoutMs: number): ProviderError {
  if (err instanceof ProviderError) return err;
  if (err instanceof Error && err.name === 'AbortError') {
    return ProviderError.rpcTimeout(chain, timeoutMs);
  }
  return ProviderError.rpcUnavailable(err instanceof Error ? err.message : String(err), chain);
}

/** Abort a request after `timeoutMs`, always clearing its timer. */
async function timedFetch(
  url: string,
  init: RequestInit,
  chain: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    throw toTransportError(err, chain, timeoutMs);
  } finally {
    clearTimeout(timer);
  }
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
  policy?: Partial<RequestPolicy>
): Promise<T> {
  const timeoutMs = policy?.timeoutMs ?? DEFAULT_POLICY.timeoutMs;

  return withRetry(chain, { timeoutMs, ...policy }, async () => {
    const res = await timedFetch(
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
      },
      chain,
      timeoutMs
    );

    if (res.status === 429) throw ProviderError.rateLimited(chain);
    if (!res.ok) {
      if (isRetryableStatus(res.status)) {
        throw ProviderError.rpcUnavailable(`${chain} RPC responded ${res.status}.`, chain);
      }
      throw ProviderError.providerError(`${chain} RPC rejected the request with ${res.status}.`, chain);
    }

    const body = (await res.json()) as { result?: T; error?: { message: string } };
    if (body.error) throw ProviderError.providerError(body.error.message, chain);
    return body.result as T;
  });
}

/** GET a REST endpoint, mapping non-2xx onto a `ProviderError`. */
export async function httpGet<T>(
  url: string,
  chain: string,
  policy?: Partial<RequestPolicy>,
  headers: Record<string, string> = {}
): Promise<T> {
  const timeoutMs = policy?.timeoutMs ?? DEFAULT_POLICY.timeoutMs;

  return withRetry(chain, { timeoutMs, ...policy }, async () => {
    const res = await timedFetch(url, { headers: { accept: 'application/json', ...headers } }, chain, timeoutMs);

    if (res.status === 429) throw ProviderError.rateLimited(chain);
    if (res.status === 404) throw new ProviderError('NOT_FOUND', `${chain} provider has no record at ${url}.`, chain);
    if (!res.ok) {
      if (isRetryableStatus(res.status)) {
        throw ProviderError.rpcUnavailable(`${chain} provider responded ${res.status}.`, chain);
      }
      throw ProviderError.providerError(`${chain} provider rejected the request with ${res.status}.`, chain);
    }
    return (await res.json()) as T;
  });
}

/**
 * GET an endpoint that answers with plain text rather than JSON.
 *
 * `mempool.space/api/blocks/tip/height` returns a bare integer, for example.
 * Parsing that with `res.json()` throws, so those endpoints need this variant.
 */
export async function httpGetText(
  url: string,
  chain: string,
  policy?: Partial<RequestPolicy>,
  headers: Record<string, string> = {}
): Promise<string> {
  const timeoutMs = policy?.timeoutMs ?? DEFAULT_POLICY.timeoutMs;

  return withRetry(chain, { timeoutMs, ...policy }, async () => {
    const res = await timedFetch(url, { headers: { accept: 'text/plain', ...headers } }, chain, timeoutMs);
    if (res.status === 429) throw ProviderError.rateLimited(chain);
    if (!res.ok) {
      if (isRetryableStatus(res.status)) {
        throw ProviderError.rpcUnavailable(`${chain} provider responded ${res.status}.`, chain);
      }
      throw ProviderError.providerError(`${chain} provider rejected the request with ${res.status}.`, chain);
    }
    return (await res.text()).trim();
  });
}

/**
 * Like `httpGet`, but a 404 yields `null` instead of throwing.
 *
 * Some providers expose optional sub-resources that 404 when the subject simply
 * has no activity there — a wallet's mempool stats, for example. Treating that
 * as "zero" rather than as a failure is the difference between a working
 * balance and a broken endpoint.
 */
export async function httpGetOrNull<T>(
  url: string,
  chain: string,
  policy?: Partial<RequestPolicy>,
  headers: Record<string, string> = {}
): Promise<T | null> {
  try {
    return await httpGet<T>(url, chain, policy, headers);
  } catch (err) {
    if (err instanceof ProviderError && err.code === 'NOT_FOUND') return null;
    throw err;
  }
}

/** POST a JSON body to a REST endpoint. Used by TRON's HTTP API. */
export async function httpPost<T>(
  url: string,
  body: unknown,
  chain: string,
  policy?: Partial<RequestPolicy>,
  headers: Record<string, string> = {}
): Promise<T> {
  const timeoutMs = policy?.timeoutMs ?? DEFAULT_POLICY.timeoutMs;

  return withRetry(chain, { timeoutMs, ...policy }, async () => {
    const res = await timedFetch(
      url,
      { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) },
      chain,
      timeoutMs
    );

    if (res.status === 429) throw ProviderError.rateLimited(chain);
    if (!res.ok) {
      if (isRetryableStatus(res.status)) {
        throw ProviderError.rpcUnavailable(`${chain} provider responded ${res.status}.`, chain);
      }
      throw ProviderError.providerError(`${chain} provider rejected the request with ${res.status}.`, chain);
    }
    return (await res.json()) as T;
  });
}
