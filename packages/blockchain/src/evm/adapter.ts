/**
 * Shared EVM machinery.
 *
 * Ethereum, BNB Chain and every EVM L2 share one execution model, so the
 * JSON-RPC plumbing, hex decoding and wei conversion live here. A new EVM
 * chain is normally ~40 lines: a config object plus a subclass.
 */

import type { Transaction } from '@blocksense/shared';
import type { ChainTip, HistoryOptions, AdapterConfig } from '../core/adapter';
import { BaseAdapter } from '../core/base';
import type { BaseAdapterOptions } from '../core/adapter';
import { mockRequest, rpcCall, sameValue } from '../core/client';
import { getChain } from '../core/registry';
import { ProviderError } from '../core/errors';
import type { ChainId } from '@blocksense/shared';

/** Identifiers are lowercase on EVM; indexers echo them back inconsistently. */
export function normalizeEvmAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function isEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isEvmHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

/** Convert a base-unit bigint (wei) into a decimal number. */
export function fromWei(value: bigint | string, decimals: number): number {
  const raw = typeof value === 'bigint' ? value : BigInt(value || '0');
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fractionStr ? Number(`${whole}.${fractionStr}`) : Number(whole);
}

/** Convert a human decimal amount into base units. */
export function toWei(amount: number | string, decimals: number): bigint {
  const [whole = '0', fraction = ''] = String(amount).split('.');
  const padded = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(padded || '0');
}

/** Anything the EVM can express as an address: ENS names resolve through a separate provider. */
export function isEvmIdentifier(value: string): boolean {
  const v = value.trim();
  return isEvmAddress(v) || (v.endsWith('.eth') && v.length > 4);
}

/** Minimal raw transaction shape returned by `eth_getTransactionByHash`. */
export interface EvmRawTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: string | null;
  timestamp?: number;
  input?: string;
}

/** Base class for every EVM chain. */
export abstract class EvmAdapter extends BaseAdapter {
  protected readonly config: AdapterConfig;

  constructor(config: AdapterConfig & Partial<Pick<BaseAdapterOptions, 'id' | 'name' | 'nativeSymbol' | 'decimals'>>) {
    super({
      id: (config as BaseAdapterOptions).id ?? ('ethereum' as ChainId),
      name: (config as BaseAdapterOptions).name ?? 'EVM chain',
      nativeSymbol: (config as BaseAdapterOptions).nativeSymbol ?? 'ETH',
      decimals: (config as BaseAdapterOptions).decimals ?? 18,
      rpcUrl: config.rpcUrl,
      apiKey: config.apiKey,
      latency: config.latency
    });
    this.config = config;
  }

  override get isLive(): boolean {
    return Boolean(this.config.rpcUrl);
  }

  protected abstract buildTransaction(raw: EvmRawTransaction): Transaction;

  override async getTransaction(hash: string): Promise<Transaction> {
    const v = hash.trim();
    if (!isEvmHash(v)) {
      throw this.fail(`"${hash}" is not a valid EVM transaction hash.`);
    }
    if (!this.config.rpcUrl) {
      return mockRequest(
        () => this.buildTransaction({ hash: v, from: '0x0', to: '0x0', value: '0x0', blockNumber: '0x1' }),
        this.options.latency
      );
    }
    const raw = await rpcCall<EvmRawTransaction | null>(
      this.config.rpcUrl,
      'eth_getTransactionByHash',
      [v],
      this.id
    );
    if (!raw) throw this.notFound('Transaction', v);
    return this.buildTransaction(raw);
  }

  override async getHistory(address: string, options: HistoryOptions = {}): Promise<Transaction[]> {
    void address;
    void options;
    return mockRequest(() => [], this.options.latency);
  }

  override async getAsset(identifier: string): Promise<never> {
    void identifier;
    throw new ProviderError('NOT_IMPLEMENTED', `${this.name} asset metadata is not indexed yet.`, this.id);
  }

  override async getTip(): Promise<ChainTip> {
    if (!this.config.rpcUrl) {
      const info = getChain(this.id);
      return mockRequest(() => ({ chain: this.id, height: info.latestHeight, unit: 'block' as const }), this.options.latency);
    }
    const height = await rpcCall<string>(this.config.rpcUrl, 'eth_blockNumber', [], this.id);
    return { chain: this.id, height: Number(BigInt(height)), unit: 'block' };
  }
}

export { sameValue };
