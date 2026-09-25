import type { ChainId } from '@blocksense/shared';
import { BaseAdapter } from '../core/base';
import { httpGet } from '../core/client';
import type { ChainTip } from '../core/adapter';

export const SOLANA_ENV = {
  rpcUrl: 'SOLANA_RPC_URL'
} as const;

/** Solana base58 alphabet excludes 0, O, I and l. */
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function isSolanaAddress(value: string): boolean {
  const v = value.trim();
  return v.length >= 32 && v.length <= 44 && BASE58.test(v);
}

/** Solana signatures are 64 bytes of base58, so 86-88 characters. */
export function isSolanaSignature(value: string): boolean {
  const v = value.trim();
  return v.length >= 86 && v.length <= 88 && BASE58.test(v);
}

/**
 * Solana accounts are not addresses in the EVM sense — one account can hold
 * many token accounts, each with its own mint. That fan-out is the main
 * difference an investigator has to reason about.
 */
export class SolanaAdapter extends BaseAdapter {
  readonly id: ChainId = 'solana';
  readonly name = 'Solana';
  readonly nativeSymbol = 'SOL';
  readonly decimals = 9;

  constructor(options: Partial<Omit<ConstructorParameters<typeof BaseAdapter>[0], 'id' | 'name' | 'nativeSymbol' | 'decimals'>> = {}) {
    super({ id: 'solana', name: 'Solana', nativeSymbol: 'SOL', decimals: 9, ...options });
  }

  /** Solana produces slots, not blocks — this distinction matters for confirmations. */
  override async getTip(): Promise<ChainTip> {
    if (!this.options.rpcUrl) return super.getTip();
    const body = await httpGet<{ result: { value: number } }>(this.options.rpcUrl, this.name);
    return { chain: this.id, height: body.result.value, unit: 'slot' };
  }
}

export function createSolanaAdapter(config: { rpcUrl?: string; latency?: number } = {}): SolanaAdapter {
  return new SolanaAdapter(config);
}
