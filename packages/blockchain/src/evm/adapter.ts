/**
 * Shared EVM machinery.
 *
 * Ethereum, BNB Chain and every EVM L2 share one execution model, so the
 * JSON-RPC plumbing, hex decoding, wei conversion and log parsing live here.
 * A new EVM chain is normally ~30 lines: a config object plus a subclass that
 * declares its identity.
 */

import type { RelatedWallet, TechnicalField, Transaction, TransactionAsset } from '@blocksense/shared';
import type { ChainTip, HistoryOptions, AdapterConfig } from '../core/adapter';
import { BaseAdapter } from '../core/base';
import type { BaseAdapterOptions } from '../core/adapter';
import { rpcCall, sameValue } from '../core/client';
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

/** Anything the EVM can express as an address. ENS needs a separate resolver. */
export function isEvmIdentifier(value: string): boolean {
  const v = value.trim();
  return isEvmAddress(v) || (v.endsWith('.eth') && v.length > 4);
}

export function hexToBigInt(value: string | undefined | null): bigint {
  if (!value || value === '0x') return 0n;
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

export function hexToNumber(value: string | undefined | null): number {
  return Number(hexToBigInt(value));
}

/** Minimal raw transaction shape returned by `eth_getTransactionByHash`. */
export interface EvmRawTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: string | null;
  input?: string;
  /** Resolved by `getTransaction` from the block header. */
  timestamp?: number;
}

/** ERC-20 Transfer event, the only way a bare node exposes token movement. */
export interface EvmTransferLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  logIndex: string;
  transactionHash: string;
}

export interface EvmTransactionReceipt {
  status?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
  contractAddress?: string | null;
  logs?: EvmTransferLog[];
}

/** Everything `getTransaction` gathered, handed to the shared builder. */
export interface EvmTransactionContext {
  receipt: EvmTransactionReceipt | null;
  logs: EvmTransferLog[];
  tip: number;
}

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ERC721_TRANSFER_TOPIC = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';

/** Base class for every EVM chain. */
export abstract class EvmAdapter extends BaseAdapter {
  protected readonly config: AdapterConfig;

  /** Chain id reported by `eth_chainId`, used to verify the provider. */
  protected abstract readonly evmChainId: number;

  constructor(config: AdapterConfig & Partial<Pick<BaseAdapterOptions, 'id' | 'name' | 'nativeSymbol' | 'decimals'>>) {
    super({
      id: (config as BaseAdapterOptions).id ?? ('ethereum' as ChainId),
      name: (config as BaseAdapterOptions).name ?? 'EVM chain',
      nativeSymbol: (config as BaseAdapterOptions).nativeSymbol ?? 'ETH',
      decimals: (config as BaseAdapterOptions).decimals ?? 18,
      rpcUrl: config.rpcUrl,
      apiKey: config.apiKey,
      latency: config.latency,
      policy: config.policy
    });
    this.config = config;
  }

  override get isLive(): boolean {
    return Boolean(this.config.rpcUrl);
  }

  /** A Transfer log is ERC-20 (3 topics) or ERC-721/1155 (4 topics). */
  protected isTransferLog(log: EvmTransferLog): boolean {
    return log.topics[0] === TRANSFER_TOPIC || log.topics[0] === ERC721_TRANSFER_TOPIC;
  }

  protected isNftTransfer(log: EvmTransferLog): boolean {
    return log.topics[0] === ERC721_TRANSFER_TOPIC || log.topics.length >= 4;
  }

  /** Fetch a block header to turn a block number into a timestamp. */
  protected async getBlockTimestamp(blockNumber: string): Promise<number | undefined> {
    const block = await rpcCall<{ timestamp?: string } | null>(
      this.config.rpcUrl as string,
      'eth_getBlockByNumber',
      [blockNumber, false],
      this.id,
      this.policy
    );
    const ts = block?.timestamp;
    return ts ? hexToNumber(ts) * 1000 : undefined;
  }

  /**
   * Normalise an EVM transaction into BlockSense's shape.
   *
   * Subclasses rarely override this: the only chain-specific facts are
   * identity, which the class already declares. Everything beyond the raw
   * fields comes from the receipt — status, fee, confirmations, and any
   * ERC-20/721 movement carried in the logs.
   */
  protected async buildTransaction(raw: EvmRawTransaction, ctx: EvmTransactionContext): Promise<Transaction> {
    const amount = fromWei(raw.value, this.decimals);
    const blockNumber = raw.blockNumber ? hexToNumber(raw.blockNumber) : 0;
    const isPending = !raw.blockNumber;

    // Receipt status '1' means success. A pending transaction has none yet.
    const status: Transaction['status'] = isPending
      ? 'pending'
      : hexToNumber(ctx.receipt?.status) === 0
        ? 'failed'
        : 'confirmed';

    const transfers = ctx.logs.filter((l) => this.isTransferLog(l));

    // Token decimals live in a contract call, and reading them needs an
    // explorer. The amount is therefore reported in raw base units and labelled
    // as such, rather than being scaled by a guessed 18.
    const assets: TransactionAsset[] = [
      {
        type: 'native',
        name: this.name,
        symbol: this.nativeSymbol,
        amount: String(amount),
        decimals: this.decimals
      },
      ...transfers.map((log): TransactionAsset => {
        const nft = this.isNftTransfer(log);
        return {
          type: nft ? 'nft' : 'token',
          name: nft ? 'NFT transfer' : `Token ${log.address.slice(0, 10)}…`,
          symbol: nft ? 'NFT' : 'TOKEN',
          ...(nft
            ? { tokenId: hexToBigInt(log.data).toString() }
            : { amount: hexToBigInt(log.data).toString() }),
          contractAddress: log.address,
          standard: nft ? 'ERC-721' : 'ERC-20'
        };
      })
    ];

    const gasUsed = hexToBigInt(ctx.receipt?.gasUsed);
    const gasPrice = hexToBigInt(ctx.receipt?.effectiveGasPrice);
    const fee = gasUsed > 0n && gasPrice > 0n ? fromWei((gasUsed * gasPrice).toString(), this.decimals) : 0;

    const related: RelatedWallet[] = [];
    if (raw.from) {
      related.push({
        address: normalizeEvmAddress(raw.from),
        label: 'From',
        kind: 'wallet',
        relationship: 'sender',
        level: 'normal'
      });
    }
    if (raw.to) {
      related.push({
        address: normalizeEvmAddress(raw.to),
        label: 'To',
        kind: 'contract',
        relationship: 'receiver',
        level: 'normal'
      });
    }

    const technical: TechnicalField[] = [{ label: 'Input data', value: raw.input ?? '0x' }];
    if (gasUsed > 0n) {
      technical.push({ label: 'Gas used', value: gasUsed.toString() });
      technical.push({ label: 'Gas price', value: `${gasPrice.toString()} wei` });
    }
    if (transfers.length > 0) {
      technical.push({
        label: 'Token transfers',
        value: String(transfers.length),
        hint: 'Token decimals require an explorer API (Etherscan/BSCScan).'
      });
    }

    const summary = [
      status === 'failed'
        ? `Failed ${amount} ${this.nativeSymbol} transfer`
        : isPending
          ? `Pending ${amount} ${this.nativeSymbol} transfer`
          : `${amount} ${this.nativeSymbol} transferred`,
      ...(transfers.length > 0 ? [`${transfers.length} token transfer${transfers.length > 1 ? 's' : ''}`] : []),
      ...(fee > 0 ? [`Fee ${fee} ${this.nativeSymbol}`] : [])
    ];

    return {
      hash: raw.hash,
      chain: this.id,
      from: normalizeEvmAddress(raw.from),
      // A contract deployment has no `to`; the receipt carries the new address.
      to: raw.to ? normalizeEvmAddress(raw.to) : normalizeEvmAddress(ctx.receipt?.contractAddress ?? ''),
      timestamp: raw.timestamp ?? 0,
      status,
      block: blockNumber,
      confirmations: isPending ? 0 : Math.max(0, ctx.tip - blockNumber + 1),
      asset: assets[0],
      assets,
      ...(fee > 0 ? { fee: { amount: String(fee), symbol: this.nativeSymbol } } : {}),
      summary,
      technical,
      related
    };
  }

  override async getTransaction(hash: string): Promise<Transaction> {
    const v = hash.trim();
    if (!isEvmHash(v)) {
      throw ProviderError.invalidHash(hash, this.name);
    }
    const url = this.requireLive();

    const raw = await rpcCall<EvmRawTransaction | null>(url, 'eth_getTransactionByHash', [v], this.id, this.policy);
    if (!raw) throw ProviderError.transactionNotFound(v, this.name);

    // Resolve the block timestamp so the transaction is not reported at epoch 0.
    let timestamp: number | undefined;
    if (raw.blockNumber) {
      try {
        timestamp = await this.getBlockTimestamp(raw.blockNumber);
      } catch {
        // A missing timestamp is survivable; the transaction itself is not.
      }
    }

    // The receipt carries status and fee. Enrichment is best-effort: a provider
    // that answers the transaction but not the receipt should still produce a
    // usable result rather than a hard failure.
    let receipt: EvmTransactionReceipt | null = null;
    try {
      receipt = await rpcCall<EvmTransactionReceipt | null>(
        url,
        'eth_getTransactionReceipt',
        [v],
        this.id,
        this.policy
      );
    } catch {
      receipt = null;
    }

    let tip = 0;
    try {
      tip = hexToNumber(await rpcCall<string>(url, 'eth_blockNumber', [], this.id, this.policy));
    } catch {
      tip = 0;
    }

    return this.buildTransaction(
      { ...raw, timestamp },
      { receipt, logs: receipt?.logs ?? [], tip }
    );
  }

  override async getHistory(_address: string, _options: HistoryOptions = {}): Promise<Transaction[]> {
    // Walking an address's history needs an indexer; a bare node cannot answer
    // "every transaction touching this address". Say so rather than returning an
    // empty list that reads as "this wallet has never transacted".
    this.requireLive();
    throw ProviderError.notImplemented(
      `${this.name} address history requires an indexing provider (Etherscan, BSCScan or a dedicated indexer).`,
      this.id
    );
  }

  override async getAsset(identifier: string): Promise<never> {
    this.requireLive();
    void identifier;
    throw ProviderError.notImplemented(
      `${this.name} asset metadata requires an explorer API such as Etherscan or BSCScan.`,
      this.id
    );
  }

  override async getTip(): Promise<ChainTip> {
    const url = this.requireLive();
    const height = await rpcCall<string>(url, 'eth_blockNumber', [], this.id, this.policy);
    return { chain: this.id, height: hexToNumber(height), unit: 'block' };
  }

  /** Confirm this provider really is the chain the adapter claims to be. */
  async verifyChain(): Promise<boolean> {
    const url = this.config.rpcUrl;
    if (!url) return false;
    try {
      const id = await rpcCall<string>(url, 'eth_chainId', [], this.id, this.policy);
      return hexToNumber(id) === this.evmChainId;
    } catch {
      return false;
    }
  }
}

export { sameValue };
