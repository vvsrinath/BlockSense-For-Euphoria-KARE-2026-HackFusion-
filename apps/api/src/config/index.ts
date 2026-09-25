/**
 * Runtime configuration.
 *
 * Reads `process.env` directly with no dotenv dependency, so the API runs with
 * no install step and a contributor can start it immediately.
 *
 * Every chain has a public default endpoint, so BlockSense works with an empty
 * environment. Those endpoints are rate limited and not meant for production
 * load — set a provider URL per chain before deploying.
 */

import type { LogLevel } from '../middleware/logger';

function str(name: string, fallback = ''): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

function list(name: string, fallback: string[]): string[] {
  const raw = str(name);
  if (!raw) return fallback;
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Public endpoints used when a chain-specific variable is unset. */
export const PUBLIC_RPC = {
  ETHEREUM_RPC_URL: 'https://ethereum-rpc.publicnode.com',
  BNB_RPC_URL: 'https://bsc-rpc.publicnode.com',
  TRON_RPC_URL: 'https://api.trongrid.io',
  SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  BITCOIN_RPC_URL: 'https://mempool.space/api'
} as const;

export const config = {
  env: str('NODE_ENV', 'development'),
  port: num('PORT', 3000),
  host: str('API_HOST', '0.0.0.0'),
  logLevel: str('LOG_LEVEL', 'info') as LogLevel,

  /** Comma-separated origin allowlist. Defaults to the Vite dev server. */
  frontendUrl: str('FRONTEND_URL', 'http://localhost:5173'),

  /**
   * Retained for compatibility with the original env file. BlockSense now
   * always reads live chain data; the flag only survives as a migration aid and
   * is reported at boot so a stale `false` is visible rather than silent.
   */
  useLiveData: bool('USE_LIVE_DATA', true),

  /** How long a successful provider response stays cached, in seconds. */
  cacheTtlSeconds: num('CACHE_TTL_SECONDS', 60),
  /** Node/edge caps for the network graph so one wallet cannot blow up memory. */
  maxGraphNodes: num('MAX_GRAPH_NODES', 25),
  maxGraphEdges: num('MAX_GRAPH_EDGES', 50),
  /** Per-request budget for outbound provider calls, in ms. */
  requestTimeoutMs: num('REQUEST_TIMEOUT_MS', 15_000),

  /** Fixed-window rate limit, applied per client IP. */
  rateLimit: {
    windowMs: num('RATE_LIMIT_WINDOW_MS', 60_000),
    maxRequests: num('RATE_LIMIT_MAX_REQUESTS', 120)
  },

  /** Per-chain provider credentials. Keys are never sent to the browser. */
  ethereum: {
    rpcUrl: str('ETHEREUM_RPC_URL', PUBLIC_RPC.ETHEREUM_RPC_URL),
    apiKey: str('ETHERSCAN_API_KEY')
  },
  bnb: {
    rpcUrl: str('BNB_RPC_URL', PUBLIC_RPC.BNB_RPC_URL),
    apiKey: str('BSCSCAN_API_KEY')
  },
  tron: {
    rpcUrl: str('TRON_RPC_URL', PUBLIC_RPC.TRON_RPC_URL),
    apiKey: str('TRON_API_KEY')
  },
  solana: {
    rpcUrl: str('SOLANA_RPC_URL', PUBLIC_RPC.SOLANA_RPC_URL),
    apiKey: str('SOLANA_API_KEY')
  },
  bitcoin: {
    rpcUrl: str('BITCOIN_RPC_URL', PUBLIC_RPC.BITCOIN_RPC_URL),
    apiKey: str('MEMPOOL_API_KEY')
  }
} as const;

export const isProduction = config.env === 'production';

/** Origins permitted to call the API, derived from `FRONTEND_URL`. */
export function allowedOrigins(): string[] {
  return config.frontendUrl
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * The request policy handed to every adapter.
 *
 * One shared policy keeps timeout behaviour consistent across chains, and means
 * a single `REQUEST_TIMEOUT_MS` change tunes the whole system.
 */
export const requestPolicy = {
  timeoutMs: config.requestTimeoutMs,
  attempts: 3,
  backoffMs: 400
} as const;

export { str, num, bool, list };
