import type { ChainId } from '@blocksense/shared';
import { BaseAdapter } from '../core/base';
import { httpGet } from '../core/client';
import type { ChainTip } from '../core/adapter';

export const BITCOIN_ENV = {
  rpcUrl: 'BITCOIN_RPC_URL',
  apiKey: 'MEMPOOL_API_KEY'
} as const;

/** Legacy P2PKH/P2SH addresses start with 1 or 3; bech32 addresses start with bc1. */
export function isBitcoinAddress(value: string): boolean {
  const v = value.trim();
  return /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(v);
}

/** Bitcoin txids are 64 hex characters, displayed in reverse byte order. */
export function isBitcoinTxid(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value.trim());
}

/**
 * Bitcoin is UTXO-based: there are no accounts, only outputs spent by inputs.
 * "Balance" is therefore a sum over unspent outputs, and a single transaction
 * can have many senders and many receivers. This is why the engine needs a
 * separate normalisation path for UTXO chains.
 */
export class BitcoinAdapter extends BaseAdapter {
  readonly id: ChainId = 'bitcoin';
  readonly name = 'Bitcoin';
  readonly nativeSymbol = 'BTC';
  readonly decimals = 8;

  constructor(options: Partial<Omit<ConstructorParameters<typeof BaseAdapter>[0], 'id' | 'name' | 'nativeSymbol' | 'decimals'>> = {}) {
    super({ id: 'bitcoin', name: 'Bitcoin', nativeSymbol: 'BTC', decimals: 8, ...options });
  }

  override async getTip(): Promise<ChainTip> {
    if (!this.options.rpcUrl) return super.getTip();
    const height = await httpGet<string>(this.options.rpcUrl, this.name);
    return { chain: this.id, height: Number(height), unit: 'block' };
  }
}

export function createBitcoinAdapter(
  config: { rpcUrl?: string; apiKey?: string; latency?: number } = {}
): BitcoinAdapter {
  return new BitcoinAdapter(config);
}
