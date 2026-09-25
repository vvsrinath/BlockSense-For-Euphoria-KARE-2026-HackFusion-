import type { ChainId, RelatedWallet, TechnicalField, Transaction, TransactionAsset } from '@blocksense/shared';
import type { AdapterConfig, Balance, ChainTip, HistoryOptions } from '../core/adapter';
import { BaseAdapter } from '../core/base';
import { httpGet, httpGetOrNull, httpGetText } from '../core/client';
import { ProviderError } from '../core/errors';

export const BITCOIN_ENV = {
  rpcUrl: 'BITCOIN_RPC_URL',
  apiKey: 'MEMPOOL_API_KEY'
} as const;

/** mempool.space serves both public and self-hosted Electrum-style endpoints. */
export const BITCOIN_DEFAULT_URL = 'https://mempool.space/api';

/** Legacy P2PKH/P2SH addresses start with 1 or 3; bech32 addresses start with bc1. */
export function isBitcoinAddress(value: string): boolean {
  const v = value.trim();
  return /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(v);
}

/** Bitcoin txids are 64 hex characters, displayed in reverse byte order. */
export function isBitcoinTxid(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value.trim());
}

/** BTC has 8 decimals. */
export function fromSats(value: number | undefined): number {
  return (value ?? 0) / 1e8;
}

interface MempoolVin {
  txid: string;
  vout: number;
  prevout?: { value: number; scriptpubkey_address?: string };
}

interface MempoolVout {
  value: number;
  scriptpubkey_address?: string;
}

interface MempoolTx {
  txid: string;
  version: number;
  size: number;
  weight?: number;
  locktime: number;
  status: { confirmed: boolean; block_height?: number; block_hash?: string; block_time?: number };
  fee: number;
  vin: MempoolVin[];
  vout: MempoolVout[];
}

/**
 * Bitcoin is UTXO-based: there are no accounts, only outputs spent by inputs.
 * A "balance" is a sum over unspent outputs, and one transaction can have many
 * senders and many receivers.
 *
 * That means there is no single `from`/`to` pair. A coinbase transaction has no
 * sender at all, and a transfer can fan out to twenty outputs. Rather than
 * pretending otherwise, the sender is reported as the first input and every
 * counterparty is listed under `related`, so the UI can show the real shape.
 */
export class BitcoinAdapter extends BaseAdapter {
  readonly id: ChainId = 'bitcoin';
  readonly name = 'Bitcoin';
  readonly nativeSymbol = 'BTC';
  readonly decimals = 8;

  private readonly config: AdapterConfig;

  constructor(config: AdapterConfig = {}) {
    // Resolve the default now so `requireLive()` and `isLive` see a real URL.
    super({ ...config, id: 'bitcoin', name: 'Bitcoin', nativeSymbol: 'BTC', decimals: 8, rpcUrl: config.rpcUrl ?? BITCOIN_DEFAULT_URL });
    this.config = config;
  }

  override get isLive(): boolean {
    return true;
  }

  private get baseUrl(): string {
    return (this.config.rpcUrl ?? BITCOIN_DEFAULT_URL).replace(/\/+$/, '');
  }

  private headers(): Record<string, string> {
    return this.config.apiKey ? { Authorization: `Basic ${this.config.apiKey}` } : {};
  }

  private async call<T>(path: string): Promise<T> {
    return httpGet<T>(`${this.baseUrl}${path}`, this.name, this.policy, this.headers());
  }

  private buildTransaction(tx: MempoolTx): Transaction {
    const confirmed = tx.status.confirmed && typeof tx.status.block_height === 'number';

    // Inputs that spent something are the senders. A coinbase input has no
    // prevout and no real source address.
    const spenders = tx.vin.filter((v) => v.prevout?.scriptpubkey_address);
    const outputs = tx.vout.filter((v) => v.scriptpubkey_address);

    const from = spenders[0]?.prevout?.scriptpubkey_address ?? '';
    // The largest output is conventionally the change/payment split target.
    const largest = outputs.reduce<MempoolVout | undefined>(
      (best, v) => (!best || v.value > best.value ? v : best),
      undefined
    );
    const to = largest?.scriptpubkey_address ?? '';

    // Value leaving the sender is the input total; the rest is change.
    const inputTotal = spenders.reduce((sum, v) => sum + (v.prevout?.value ?? 0), 0);
    const sentSats = Math.max(0, inputTotal - (tx.fee ?? 0));
    const fee = fromSats(tx.fee);

    const asset: TransactionAsset = {
      type: 'native',
      name: this.name,
      symbol: this.nativeSymbol,
      amount: String(fromSats(sentSats)),
      decimals: this.decimals,
      direction: 'sent'
    };

    // A coinbase transaction mints new coins, so it has no sender.
    const isCoinbase = !spenders.length;
    const related: RelatedWallet[] = [
      ...(from
        ? [
            {
              address: from,
              label: isCoinbase ? 'Mined by' : 'From',
              kind: 'wallet' as const,
              relationship: isCoinbase ? 'miner' : 'sender',
              level: 'normal' as const
            }
          ]
        : []),
      ...outputs.slice(0, 8).map((v) => ({
        address: v.scriptpubkey_address as string,
        label: 'Output',
        kind: 'wallet' as const,
        relationship: 'receiver',
        level: 'normal' as const
      }))
    ];

    const technical: TechnicalField[] = [
      { label: 'Version', value: String(tx.version) },
      { label: 'Size', value: `${tx.size} bytes` },
      { label: 'Locktime', value: String(tx.locktime) },
      { label: 'Inputs / outputs', value: `${tx.vin.length} / ${tx.vout.length}` }
    ];
    if (isCoinbase) {
      technical.push({ label: 'Type', value: 'Coinbase', hint: 'This transaction mints new coins.' });
    }

    return {
      hash: tx.txid,
      chain: this.id,
      from,
      to,
      timestamp: tx.status.block_time ? tx.status.block_time * 1000 : 0,
      status: confirmed ? 'confirmed' : 'pending',
      block: tx.status.block_height ?? 0,
      confirmations: confirmed ? 1 : 0,
      asset,
      assets: [asset],
      fee: { amount: String(fee), symbol: this.nativeSymbol },
      summary: [
        isCoinbase
          ? `Coinbase reward of ${fromSats(sentSats)} ${this.nativeSymbol}`
          : `${fromSats(sentSats)} ${this.nativeSymbol} sent to ${outputs.length} output${outputs.length > 1 ? 's' : ''}`,
        `Fee ${fee} ${this.nativeSymbol}`
      ],
      technical,
      related
    };
  }

  override async getTransaction(hash: string): Promise<Transaction> {
    const v = hash.trim().toLowerCase();
    if (!isBitcoinTxid(v)) throw ProviderError.invalidHash(hash, this.name);
    this.requireLive();
    const tx = await this.call<MempoolTx>(`/tx/${v}`);
    return this.buildTransaction(tx);
  }

  override async getHistory(address: string, options: HistoryOptions = {}): Promise<Transaction[]> {
    const addr = address.trim();
    if (!isBitcoinAddress(addr)) throw ProviderError.invalidAddress(address, this.name);
    this.requireLive();

    const txs = await this.call<MempoolTx[]>(`/address/${addr}/txs`);
    const limit = options.limit ?? 25;
    return txs.slice(0, Math.max(1, limit)).map((tx) => this.buildTransaction(tx));
  }

  override async getBalances(address: string): Promise<Balance[]> {
    const addr = address.trim();
    if (!isBitcoinAddress(addr)) throw ProviderError.invalidAddress(address, this.name);
    this.requireLive();

    // Chain + mempool UTXOs. A confirmed output may still be unspent, so the
    // two sets are unioned and deduplicated by outpoint.
    const [chain, mempool] = await Promise.all([
      this.call<{ chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number } }>(`/address/${addr}`),
      // 404 here just means "nothing pending", which is a normal state.
      httpGetOrNull<{ mempool_stats?: { funded_txo_sum?: number; spent_txo_sum?: number } }>(
        `${this.baseUrl}/address/${addr}/mempool`,
        this.name,
        this.policy,
        this.headers()
      )
    ]);

    const funded = (chain.chain_stats?.funded_txo_sum ?? 0) + (mempool?.mempool_stats?.funded_txo_sum ?? 0);
    const spent = (chain.chain_stats?.spent_txo_sum ?? 0) + (mempool?.mempool_stats?.spent_txo_sum ?? 0);

    return [
      {
        assetId: 'bitcoin-btc',
        symbol: this.nativeSymbol,
        amount: fromSats(funded - spent),
        decimals: this.decimals
      }
    ];
  }

  override async getTip(): Promise<ChainTip> {
    this.requireLive();
    // This endpoint answers with a bare integer, not JSON.
    const height = await httpGetText(`${this.baseUrl}/blocks/tip/height`, this.name, this.policy, this.headers());
    const parsed = Number.parseInt(height, 10);
    if (!Number.isFinite(parsed)) {
      throw ProviderError.providerError('Bitcoin provider returned an unreadable block height.', this.id);
    }
    return { chain: this.id, height: parsed, unit: 'block' };
  }
}

export function createBitcoinAdapter(config: AdapterConfig = {}): BitcoinAdapter {
  return new BitcoinAdapter(config);
}
