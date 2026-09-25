import type { ChainId } from '@blocksense/shared';
import { BaseAdapter } from '../core/base';

export const TRON_ENV = {
  rpcUrl: 'TRON_RPC_URL',
  apiKey: 'TRON_API_KEY'
} as const;

/** TRON addresses are Base58 and always start with `T`. */
export function isTronAddress(value: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim());
}

export function isTronHash(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value.trim());
}

/**
 * TRON uses a delegated-proof-of-stake model. Energy and bandwidth resources
 * are consumed instead of a gas limit, and TRX has 6 decimals rather than 18.
 */
export class TronAdapter extends BaseAdapter {
  readonly id: ChainId = 'tron';
  readonly name = 'TRON';
  readonly nativeSymbol = 'TRX';
  readonly decimals = 6;

  constructor(options: Partial<Omit<ConstructorParameters<typeof BaseAdapter>[0], 'id' | 'name' | 'nativeSymbol' | 'decimals'>> = {}) {
    super({ id: 'tron', name: 'TRON', nativeSymbol: 'TRX', decimals: 6, ...options });
  }
}

export function createTronAdapter(config: { rpcUrl?: string; apiKey?: string; latency?: number } = {}): TronAdapter {
  return new TronAdapter(config);
}
