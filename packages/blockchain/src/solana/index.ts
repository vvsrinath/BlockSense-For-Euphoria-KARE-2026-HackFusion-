import type { ChainId, RelatedWallet, TechnicalField, Transaction, TransactionAsset } from '@blocksense/shared';
import type { AdapterConfig, Balance, ChainTip, HistoryOptions } from '../core/adapter';
import { BaseAdapter } from '../core/base';
import { httpPost, rpcCall } from '../core/client';
import { ProviderError } from '../core/errors';

export const SOLANA_ENV = {
  rpcUrl: 'SOLANA_RPC_URL',
  apiKey: 'SOLANA_API_KEY'
} as const;

/** Solana's default public endpoint. It is rate limited, so production should set its own. */
export const SOLANA_DEFAULT_URL = 'https://api.mainnet-beta.solana.com';

/** Base58 alphabet — the encoding Solana uses for every identifier. */
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSolanaAddress(value: string): boolean {
  return BASE58.test(value.trim());
}

export function isSolanaSignature(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(value.trim());
}

export function isSolanaHash(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(value.trim());
}

/** SOL has 9 decimals. */
export function fromLamports(value: number | bigint | undefined): number {
  return Number(value ?? 0) / 1e9;
}

/**
 * Instruction names that move SOL.
 *
 * `jsonParsed` reports these in lower case, but older RPCs used the mixed-case
 * names, so the comparison is case-insensitive.
 */
const SYSTEM_MOVE = new Set(['transfer', 'transferwithseed']);

/** SPL token instructions carry a mint and a scaled amount. */
const TOKEN_MOVE = new Set(['transfer', 'transferchecked']);

interface SolanaMeta {
  err?: unknown;
  fee?: number;
  preBalances?: number[];
  postBalances?: number[];
  logMessages?: string[];
}

interface SolanaInstruction {
  program?: string;
  programId?: string;
  /** Present only when the transaction is requested with `jsonParsed`. */
  parsed?: {
    /** `transfer` for a SOL move, `transfer`/`transferChecked` for SPL tokens. */
    type?: string;
    info?: {
      source?: string;
      destination?: string;
      /** Wallet behind a token account; falls back to the token account itself. */
      sourceOwner?: string;
      destinationOwner?: string;
      authority?: string;
      lamports?: number;
      mint?: string;
      tokenAmount?: { amount?: string; decimals?: number; uiAmount?: number };
    };
  };
  accounts?: string[];
}

/** `getSignaturesForAddress` returns signature stubs, not full transactions. */
interface SolanaSignature {
  signature: string;
  slot: number;
  err: unknown;
  blockTime: number | null;
}

/** `getTransaction` returns a list of entries; the confirmed one is the real result. */
interface SolanaEntry {
  transaction: {
    signatures: string[];
    message: { instructions: SolanaInstruction[]; accountKeys: { pubkey: string }[] };
  };
  meta: SolanaMeta | null;
  blockTime: number | null;
  slot: number;
}

/** Read the first transfer instruction, whether it moves SOL or an SPL token. */
function transferInstruction(tx: SolanaEntry): SolanaInstruction['parsed'] | undefined {
  return tx.transaction.message.instructions.find(
    (ix) => ix.parsed?.type && SYSTEM_MOVE.has(ix.parsed.type.toLowerCase())
  )?.parsed;
}

/** The wallet behind a transfer, preferring the owner over a token account. */
function transferSender(parsed: SolanaInstruction['parsed']): string {
  return parsed?.info?.sourceOwner ?? parsed?.info?.authority ?? parsed?.info?.source ?? '';
}

function transferReceiver(parsed: SolanaInstruction['parsed']): string {
  return parsed?.info?.destinationOwner ?? parsed?.info?.destination ?? '';
}

/**
 * Solana is account-based and has no blocks in the EVM sense — the closest
 * equivalent is a slot. Accounts are 32-byte ed25519 public keys encoded in
 * base58, so they are 32–44 characters. A signature is the same alphabet and
 * slightly longer.
 *
 * This talks straight to the JSON-RPC endpoint rather than pulling in
 * `@solana/kit`, because every method BlockSense needs is a single RPC call and
 * the extra dependency would add bundle weight to the web build for no gain.
 */
export class SolanaAdapter extends BaseAdapter {
  readonly id: ChainId = 'solana';
  readonly name = 'Solana';
  readonly nativeSymbol = 'SOL';
  readonly decimals = 9;

  private readonly config: AdapterConfig;

  constructor(config: AdapterConfig = {}) {
    // Resolve the default now so `requireLive()` and `isLive` see a real URL.
    super({ ...config, id: 'solana', name: 'Solana', nativeSymbol: 'SOL', decimals: 9, rpcUrl: config.rpcUrl ?? SOLANA_DEFAULT_URL });
    this.config = config;
  }

  override get isLive(): boolean {
    return true;
  }

  private get url(): string {
    return this.config.rpcUrl ?? SOLANA_DEFAULT_URL;
  }

  private headers(): Record<string, string> {
    return this.config.apiKey ? { 'x-api-key': this.config.apiKey } : {};
  }

  private async call<T>(method: string, params: unknown[]): Promise<T> {
    return httpPost<T>(
      this.url,
      { jsonrpc: '2.0', id: 1, method, params },
      this.name,
      this.policy,
      this.headers()
    ) as Promise<T>;
  }

  private buildTransaction(entry: SolanaEntry, signature: string): Transaction {
    const transfer = transferInstruction(entry);
    const info = transfer?.info;
    const failed = Boolean(entry.meta?.err);

    // An SPL transfer carries a mint and a pre-scaled amount; a SOL move
    // carries lamports. Both may appear in one transaction.
    const isTokenMove = Boolean(info?.mint) && TOKEN_MOVE.has((transfer?.type ?? '').toLowerCase());
    const amount = isTokenMove ? (info?.tokenAmount?.uiAmount ?? 0) : fromLamports(info?.lamports ?? 0);

    const from = transferSender(transfer) || entry.transaction.message.accountKeys[0]?.pubkey || '';
    const to = transferReceiver(transfer);

    const asset: TransactionAsset = isTokenMove
      ? {
          type: 'token',
          name: `Token ${String(info?.mint ?? '').slice(0, 8)}…`,
          symbol: 'SPL',
          amount: String(amount),
          contractAddress: info?.mint,
          standard: 'SPL Token',
          decimals: info?.tokenAmount?.decimals,
          direction: 'sent'
        }
      : {
          type: 'native',
          name: this.name,
          symbol: this.nativeSymbol,
          amount: String(amount),
          decimals: this.decimals,
          direction: 'sent'
        };

    const related: RelatedWallet[] = [];
    if (from) related.push({ address: from, label: 'From', kind: 'wallet', relationship: 'sender', level: 'normal' });
    if (to) related.push({ address: to, label: 'To', kind: 'wallet', relationship: 'receiver', level: 'normal' });

    const technical: TechnicalField[] = [
      { label: 'Slot', value: String(entry.slot) },
      { label: 'Fee', value: `${fromLamports(entry.meta?.fee)} SOL` },
      { label: 'Compute units', value: String(entry.meta?.logMessages?.length ?? 0) }
    ];

    return {
      hash: signature,
      chain: this.id,
      from,
      to,
      timestamp: (entry.blockTime ?? 0) * 1000,
      status: failed ? 'failed' : 'confirmed',
      block: entry.slot,
      confirmations: 1,
      asset,
      assets: [asset],
      ...(entry.meta?.fee
        ? { fee: { amount: String(fromLamports(entry.meta.fee)), symbol: this.nativeSymbol } }
        : {}),
      summary: [
        failed
          ? `Failed ${amount} ${asset.symbol} transfer`
          : `${amount} ${asset.symbol} transferred`,
        ...(entry.meta?.fee ? [`Fee ${fromLamports(entry.meta.fee)} ${this.nativeSymbol}`] : [])
      ],
      technical,
      related
    };
  }

  override async getTransaction(hash: string): Promise<Transaction> {
    const v = hash.trim();
    if (!isSolanaSignature(v)) throw ProviderError.invalidHash(hash, this.name);
    this.requireLive();

    const body = await this.call<{ result: SolanaEntry | SolanaEntry[] | null; error?: { message: string } }>(
      'getTransaction',
      [v, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }]
    );
    if (body.error) throw ProviderError.providerError(body.error.message, this.id);

    // `getTransaction` returns the entry directly under `result`; older docs
    // and some proxies wrap it in an array. Accept both.
    const entry = Array.isArray(body.result) ? body.result[0] : body.result;
    if (!entry) throw ProviderError.transactionNotFound(v, this.name);
    return this.buildTransaction(entry, v);
  }

  override async getHistory(address: string, options: HistoryOptions = {}): Promise<Transaction[]> {
    const addr = address.trim();
    if (!isSolanaAddress(addr)) throw ProviderError.invalidAddress(address, this.name);
    this.requireLive();

    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const body = await this.call<{ result: SolanaSignature[] | null; error?: { message: string } }>(
      'getSignaturesForAddress',
      [addr, { limit }]
    );
    if (body.error) throw ProviderError.providerError(body.error.message, this.id);
    if (!body.result?.length) return [];

    // The signature list carries no payload, so each transaction needs a second
    // call. Bounded by the limit above. One missing transaction must not lose
    // the rest of the page, so failures are collected rather than thrown.
    const settled = await Promise.allSettled(
      body.result.map(async (sig) => {
        const detail = await this.call<{ result: SolanaEntry | SolanaEntry[] | null }>('getTransaction', [
          sig.signature,
          { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' }]
        );
        const entry = Array.isArray(detail.result) ? detail.result[0] : detail.result;
        return entry ? this.buildTransaction(entry, sig.signature) : null;
      })
    );

    return settled
      .map((r) => (r.status === 'fulfilled' && r.value ? r.value : null))
      .filter((e): e is Transaction => e !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  override async getBalances(address: string): Promise<Balance[]> {
    const addr = address.trim();
    if (!isSolanaAddress(addr)) throw ProviderError.invalidAddress(address, this.name);
    this.requireLive();

    const body = await this.call<{
      result: { value: number } | null;
      error?: { message: string };
    }>('getBalance', [addr, { commitment: 'confirmed' }]);
    if (body.error) throw ProviderError.providerError(body.error.message, this.id);

    const lamports = body.result?.value ?? 0;
    return [
      {
        assetId: 'solana-sol',
        symbol: this.nativeSymbol,
        amount: fromLamports(lamports),
        decimals: this.decimals
      }
    ];
  }

  /** `getSlot` answers with a bare number inside the JSON-RPC envelope. */
  override async getTip(): Promise<ChainTip> {
    this.requireLive();
    const body = await this.call<{ result: number }>('getSlot', [{ commitment: 'finalized' }]);
    return { chain: this.id, height: body.result, unit: 'slot' };
  }

  /** A public RPC can answer with a rate limit instead of a chain, so check. */
  async health(): Promise<{ healthy: boolean; slot?: number }> {
    try {
      const body = await this.call<{ result: number }>('getSlot', [{ commitment: 'processed' }]);
      return { healthy: true, slot: body.result };
    } catch {
      return { healthy: false };
    }
  }
}

export function createSolanaAdapter(config: AdapterConfig = {}): SolanaAdapter {
  return new SolanaAdapter(config);
}

export { rpcCall };
