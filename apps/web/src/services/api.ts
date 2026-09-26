/**
 * The browser's only door to chain data.
 *
 * In DEMO_MODE, every request goes through the mock API so the
 * app works fully offline with auto-generated data.
 *
 * Every service in this app goes through `apiFetch`, so there is exactly one
 * place that knows the base URL, the response envelope and how an API error
 * becomes a JavaScript `Error`. Nothing in `apps/web` talks to a chain node
 * directly — that is the API's job.
 *
 * In development Vite proxies `/api` to the local server, so the base URL can be
 * empty. In production it is set at build time with `VITE_API_BASE_URL`.
 */

import type {
  Asset,
  ChainId,
  NetworkGraphData,
  Report,
  Transaction,
  Wallet
} from '@blocksense/shared';
import { mockApi } from './mockApi';
import type {
  AnalysisResponse,
  ApiClient,
  BalanceEntry,
  ChainHealthResponse,
  ChainSummary,
  HealthResponse,
  IndexResponse,
  ReportListResponse,
  SearchResponse
} from './apiTypes';

export type {
  AnalysisResponse,
  ApiClient,
  BalanceEntry,
  ChainHealthEntry,
  ChainHealthResponse,
  ChainSummary,
  HealthResponse,
  IndexResponse,
  ReportListResponse,
  SearchResponse
} from './apiTypes';

/** Whether the app should use mock/demo data instead of the real API.
 *  Vite replaces import.meta.env.VITE_DEMO_MODE with "" when the variable
 *  is unset at build time, so the fallback must treat empty string as true.
 *  Anything that is not explicitly "false" is demo mode — a fresh checkout
 *  should work with no provider configured. */
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

/** Mirrors the API's error codes so the UI can branch without parsing text. */
export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_ADDRESS'
  | 'INVALID_TRANSACTION_HASH'
  | 'UNSUPPORTED_CHAIN'
  | 'NOT_FOUND'
  | 'TRANSACTION_NOT_FOUND'
  | 'WALLET_NOT_FOUND'
  | 'ASSET_NOT_FOUND'
  | 'RPC_UNAVAILABLE'
  | 'RPC_TIMEOUT'
  | 'RPC_RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'ANALYSIS_FAILED'
  | 'NETWORK_LIMIT_EXCEEDED'
  | 'NOT_IMPLEMENTED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly requestId?: string;

  constructor(code: ApiErrorCode, message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }

  /** True when retrying later could plausibly succeed. */
  get isRetryable(): boolean {
    return (
      this.code === 'RPC_UNAVAILABLE' ||
      this.code === 'RPC_TIMEOUT' ||
      this.code === 'RPC_RATE_LIMITED' ||
      this.code === 'RATE_LIMITED' ||
      this.status >= 500
    );
  }

  /** A message safe to show a user, for the provider errors that are not bugs. */
  get isUserFacing(): boolean {
    return this.code !== 'INTERNAL_ERROR';
  }
}

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

/** `''` keeps requests same-origin, which the Vite dev proxy handles. */
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

export const API_PREFIX = '/api/v1';

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: ApiErrorCode; message: string };
  meta?: { requestId: string; timestamp: number };
}

/** How long to wait before giving up on the API itself. */
const CLIENT_TIMEOUT_MS = 25_000;

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${API_PREFIX}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        accept: 'application/json',
        ...(body !== undefined ? { 'content-type': 'application/json' } : {})
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal
    });
  } catch (err) {
    // A network-level failure has no envelope, so it is mapped here.
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new ApiError(
      'RPC_UNAVAILABLE',
      aborted ? 'The BlockSense API did not respond in time.' : 'The BlockSense API is unreachable.',
      0
    );
  } finally {
    clearTimeout(timer);
  }

  const requestId = response.headers.get('x-request-id') ?? undefined;

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.error?.code ?? 'INTERNAL_ERROR',
      payload?.error?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      payload?.meta?.requestId ?? requestId
    );
  }

  return payload?.data as T;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);

/**
 * Chain-scoped path helper.
 *
 * The API puts the chain *after* the resource — `/transactions/tron/:hash`,
 * not `/tron/transactions/:hash`. Getting this backwards produces a plausible
 * 404 that looks like a missing transaction rather than a malformed URL, so the
 * shape is asserted in tests.
 */
const chainPath = (path: string, chain?: ChainId) => (chain ? path.replace('{chain}', chain) : path);

/**
 * The client is annotated as `ApiClient` so both transports are checked against
 * one contract. Without the annotation the ternary would export a union of the
 * two object types and every caller would have to narrow the result.
 */
export const api: ApiClient = DEMO_MODE ? createMockApi() : createRealApi();

function createMockApi(): ApiClient {
  return {
    health: () => mockApi.getHealth(),
    chainHealth: () => mockApi.getChainHealth(),
    chains: () => mockApi.getChains(),
    index: () => Promise.resolve({ name: 'BlockSense API', version: '1.0.0', dataSource: 'mock', limits: { cacheTtlSeconds: 60, maxGraphNodes: 25, maxGraphEdges: 50, requestTimeoutMs: 15000 }, routes: [] }),
    // The chain is forwarded rather than discarded: it is already known from
    // the URL, and generating a record on a different chain would make the page
    // contradict the address the user clicked.
    transaction: (chain, hash) => mockApi.getTransaction(hash, chain),
    wallet: (chain, address) => mockApi.getWallet(address, chain),
    walletHistory: (_chain, address, limit = 25) => mockApi.getWalletHistory(address, limit),
    walletBalances: (_chain, address) => mockApi.getWalletAssets(address),
    network: (_chain, address, depth = 2) => mockApi.getNetwork(address, depth),
    asset: (chain, identifier) => mockApi.getAsset(chain, identifier),
    search: (query, _chain) => mockApi.search(query),
    analyze: (chain, hash, address) => mockApi.analyze(chain, hash, address),
    createReport: (chain, hash, address) => mockApi.createReport(chain, hash, address),
    report: (id) => mockApi.getReport(id),
    reports: () => mockApi.getReports()
  };
}

function createRealApi(): ApiClient {
  return {
    health: () => get<HealthResponse>('/health'),
    chainHealth: () => get<ChainHealthResponse>('/health/chains'),
    chains: () => get<ChainSummary[]>('/chains'),
    index: () => get<IndexResponse>('/'),
    transaction: (chain, hash) => get<Transaction>(chainPath(`/transactions/{chain}/${hash}`, chain)),
    wallet: (chain, address) => get<Wallet>(chainPath(`/wallets/{chain}/${address}`, chain)),
    walletHistory: (chain, address, limit = 25) => get<Transaction[]>(chainPath(`/wallets/{chain}/${address}/history?limit=${limit}`, chain)),
    walletBalances: (chain, address) => get<BalanceEntry[]>(chainPath(`/wallets/{chain}/${address}/balances`, chain)),
    network: (chain, address, depth = 2) => get<NetworkGraphData>(chainPath(`/wallets/{chain}/${address}/network?depth=${depth}`, chain)),
    asset: (chain, identifier) => get<Asset>(chainPath(`/assets/{chain}/${identifier}`, chain)),
    search: (query, chain) => get<SearchResponse>(`/search?q=${encodeURIComponent(query)}${chain ? `&chain=${chain}` : ''}`),
    analyze: (chain, hash, address) => post<AnalysisResponse>('/analyze', { chain, hash, address, includeNetwork: true }),
    createReport: (chain, hash, address) => post<Report>('/reports', { chain, hash, address }),
    report: (id) => get<Report>(`/reports/${id}`),
    reports: () => get<ReportListResponse>('/reports')
  };
}

export type Api = ApiClient;
