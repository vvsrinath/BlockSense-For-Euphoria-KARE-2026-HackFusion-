/**
 * Runtime configuration.
 *
 * Reads `process.env` directly with no dotenv dependency, so the API runs with
 * zero configuration and a contributor never has to install anything to get
 * started. See `.env.example` at the repository root.
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

export const config = {
  env: str('NODE_ENV', 'development'),
  port: num('API_PORT', 8787),
  host: str('API_HOST', '0.0.0.0'),
  logLevel: str('LOG_LEVEL', 'info') as LogLevel,
  /** When false, adapters never touch the network even if an RPC URL is set. */
  useLiveData: bool('USE_LIVE_DATA', false),
  /** Artificial latency for the mock transport, in ms. */
  mockLatency: num('MOCK_LATENCY', 120)
} as const;

export const isProduction = config.env === 'production';
