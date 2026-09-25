/**
 * The contract every chain implements.
 *
 * This is the single most important file in the package: a contributor adding
 * Polygon, Base, Arbitrum or Avalanche implements this interface and nothing
 * else. No other part of BlockSense needs to change.
 */

import type {
  Asset,
  ChainId,
  Transaction,
  Wallet
} from '@blocksense/shared';

/** Query options accepted by history endpoints. */
export interface HistoryOptions {
  /** Newest-first by default. */
  order?: 'asc' | 'desc';
  limit?: number;
  /** Epoch milliseconds. */
  since?: number;
  until?: number;
  /** Only include transfers touching this asset. */
  assetId?: string;
}

/** A single point on an address's balance curve. */
export interface Balance {
  assetId: string;
  symbol: string;
  /** Decimal amount already divided down by the asset's decimals. */
  amount: number;
  decimals: number;
  valueUsd?: number;
}

/** Current tip of the chain, normalised across block- and slot-based chains. */
export interface ChainTip {
  chain: ChainId;
  height: number;
  /** 'block' for Bitcoin/EVM/TRON, 'slot' for Solana. */
  unit: 'block' | 'slot';
  timestamp?: number;
}

/**
 * Implemented by every chain adapter.
 *
 * Adapters translate chain-native responses into the shared domain types.
 * They must not contain analysis logic — scoring and behaviour belong in
 * `@blocksense/intelligence`.
 */
export interface BlockchainAdapter {
  /** Stable chain identifier. */
  readonly id: ChainId;
  /** Display name, e.g. "BNB Chain". */
  readonly name: string;
  /** Ticker of the chain's native asset. */
  readonly nativeSymbol: string;
  /** True when an RPC URL / API key is configured and the adapter will hit the network. */
  readonly isLive: boolean;

  getTransaction(hash: string): Promise<Transaction>;
  getWallet(address: string): Promise<Wallet>;
  getBalances(address: string): Promise<Balance[]>;
  getHistory(address: string, options?: HistoryOptions): Promise<Transaction[]>;
  getAsset(identifier: string): Promise<Asset>;
  getTip(): Promise<ChainTip>;
}

/** Factory signature used by the registry. */
export type AdapterFactory = (config: AdapterConfig) => BlockchainAdapter;

/** Per-chain configuration, sourced from environment variables by `apps/api`. */
export interface AdapterConfig {
  rpcUrl?: string;
  apiKey?: string;
  /** Latency injected into the mock transport. */
  latency?: number;
}

/** Options that every adapter understands because it builds them from config. */
export interface BaseAdapterOptions extends AdapterConfig {
  id: ChainId;
  name: string;
  nativeSymbol: string;
  decimals: number;
}
