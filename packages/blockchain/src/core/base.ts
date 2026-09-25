/**
 * Base implementation of `BlockchainAdapter`.
 *
 * Provides safe mock-backed defaults for every method, so a new chain adapter
 * only has to override what it can genuinely answer. The three non-EVM chains
 * (TRON, Solana, Bitcoin) build on this; EVM chains build on `EvmAdapter`,
 * which adds JSON-RPC.
 */

import type { Asset, ChainId, Transaction, Wallet } from '@blocksense/shared';
import type {
  Balance,
  BaseAdapterOptions,
  BlockchainAdapter,
  ChainTip,
  HistoryOptions
} from './adapter';
import { mockRequest } from './client';
import { getChain } from './registry';
import { ProviderError } from './errors';

export abstract class BaseAdapter implements BlockchainAdapter {
  abstract readonly id: ChainId;
  abstract readonly name: string;
  abstract readonly nativeSymbol: string;
  abstract readonly decimals: number;

  protected readonly options: BaseAdapterOptions;

  constructor(options: BaseAdapterOptions) {
    this.options = options;
  }

  get isLive(): boolean {
    return Boolean(this.options.rpcUrl);
  }

  /** Emit a `NOT_FOUND` provider error. Override `notFound` to customise. */
  protected notFound(what: string, id: string): ProviderError {
    return ProviderError.notFound(what, id, this.name);
  }

  protected fail(message: string): ProviderError {
    return new ProviderError('INVALID_INPUT', message, this.name);
  }

  async getTransaction(hash: string): Promise<Transaction> {
    throw this.notFound('Transaction', hash);
  }

  async getWallet(address: string): Promise<Wallet> {
    return mockRequest(() => this.emptyWallet(address), this.options.latency);
  }

  async getBalances(address: string): Promise<Balance[]> {
    void address;
    return mockRequest(
      () => [{ assetId: `${this.id}:native`, symbol: this.nativeSymbol, amount: 0, decimals: this.decimals }],
      this.options.latency
    );
  }

  async getHistory(address: string, options: HistoryOptions = {}): Promise<Transaction[]> {
    void address;
    void options;
    return mockRequest(() => [], this.options.latency);
  }

  async getAsset(identifier: string): Promise<Asset> {
    throw this.notFound('Asset', identifier);
  }

  async getTip(): Promise<ChainTip> {
    const info = getChain(this.id);
    return mockRequest(
      () => ({ chain: this.id, height: info.latestHeight, unit: 'block' as const }),
      this.options.latency
    );
  }

  /** A structurally valid, empty wallet. Adapters fill in real values. */
  protected emptyWallet(address: string): Wallet {
    return {
      address: address.trim(),
      chain: this.id,
      tags: [],
      firstSeen: 0,
      lastActive: 0,
      txCount: 0,
      totalInUsd: 0,
      totalOutUsd: 0,
      status: 'normal',
      statusNote: 'No indexed activity yet.',
      dna: {
        typicalAmount: '—',
        typicalFrequency: '—',
        mostActive: '—',
        commonAsset: this.nativeSymbol,
        counterparties: 0,
        medianUsd: 0,
        txPerWeek: 0,
        traits: []
      },
      activity: []
    };
  }
}
