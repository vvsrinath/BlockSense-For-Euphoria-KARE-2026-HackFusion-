import type { ChainId } from '@blocksense/shared';
import type { AdapterConfig, BlockchainAdapter } from './adapter';
import { ProviderError } from './errors';
import { createEthereumAdapter } from '../ethereum';
import { createBnbAdapter } from '../bnb';
import { createTronAdapter } from '../tron';
import { createSolanaAdapter } from '../solana';
import { createBitcoinAdapter } from '../bitcoin';
import { ETH_ENV } from '../ethereum';
import { BNB_ENV } from '../bnb';
import { TRON_ENV } from '../tron';
import { SOLANA_ENV } from '../solana';
import { BITCOIN_ENV } from '../bitcoin';

/** Reads an environment variable without assuming Node or a bundler. */
function env(name: string): string | undefined {
  const source = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const value = source?.[name];
  return value && value.trim() ? value.trim() : undefined;
}

/** Per-chain environment variable names, so `apps/api` stays chain-agnostic. */
export const ENV_KEYS: Record<ChainId, { rpcUrl: string; apiKey?: string }> = {
  ethereum: ETH_ENV,
  bnb: BNB_ENV,
  tron: TRON_ENV,
  solana: SOLANA_ENV,
  bitcoin: BITCOIN_ENV
};

const FACTORIES = {
  ethereum: createEthereumAdapter,
  bnb: createBnbAdapter,
  tron: createTronAdapter,
  solana: createSolanaAdapter,
  bitcoin: createBitcoinAdapter
} satisfies Record<ChainId, (config: AdapterConfig) => BlockchainAdapter>;

/** Build the adapter for a chain, wiring up configuration from the environment. */
export function createAdapter(chain: ChainId, overrides: AdapterConfig = {}): BlockchainAdapter {
  const factory = FACTORIES[chain];
  if (!factory) throw ProviderError.unsupportedChain(chain);
  const keys = ENV_KEYS[chain];
  return factory({
    rpcUrl: env(keys.rpcUrl),
    ...(keys.apiKey ? { apiKey: env(keys.apiKey) } : {}),
    ...overrides
  });
}

/** Build every supported adapter. Handy for health checks and tests. */
export function createAllAdapters(overrides: AdapterConfig = {}): Record<ChainId, BlockchainAdapter> {
  const out = {} as Record<ChainId, BlockchainAdapter>;
  (Object.keys(FACTORIES) as ChainId[]).forEach((chain) => {
    out[chain] = createAdapter(chain, overrides);
  });
  return out;
}

export function supportedChains(): ChainId[] {
  return Object.keys(FACTORIES) as ChainId[];
}
