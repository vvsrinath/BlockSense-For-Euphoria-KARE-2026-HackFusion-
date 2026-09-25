import type { ChainId, RelatedWallet, TechnicalField, Transaction, TransactionAsset } from '@blocksense/shared';
import type { AdapterConfig, Balance, ChainTip, HistoryOptions } from '../core/adapter';
import { BaseAdapter } from '../core/base';
import { httpGet, httpPost } from '../core/client';
import { ProviderError } from '../core/errors';
import { sha256 } from '../core/sha256';

export const TRON_ENV = {
  rpcUrl: 'TRON_RPC_URL',
  apiKey: 'TRON_API_KEY'
} as const;

/** TRON transaction hashes are hex. */
export function isTronHash(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value.trim());
}

/** TRON's default public endpoint when `TRON_RPC_URL` is unset. */
export const TRON_DEFAULT_URL = 'https://api.trongrid.io';

/** A key raises the rate limit; without one the public quota is very low. */
function tronHeaders(apiKey?: string): Record<string, string> {
  return apiKey ? { 'TRON-PRO-API-KEY': apiKey } : {};
}

/** Shape of the fields TRON returns. Only what we normalise is declared. */
interface TronTransaction {
  txID: string;
  blockNumber?: number;
  block_timestamp?: number;
  ret?: { contractRet?: string }[];
  raw_data?: {
    contract?: { type?: string; parameter?: { value?: TronContractValue } }[];
    /** Broadcast time in ms; used when block placement is unknown. */
    timestamp?: number;
  };
}

/**
 * The flat shape `/v1/accounts/…/transactions/trc20` returns.
 *
 * This endpoint is not the node's shape at all: it has already decoded the
 * contract call, and it hands back the token's own `decimals` and `symbol`.
 * Feeding it to the node-shape builder produced transactions with an empty
 * sender, receiver and amount, so it gets its own builder.
 */
interface TronTrc20Transfer {
  transaction_id: string;
  from: string;
  to: string;
  value: string;
  type?: string;
  block_timestamp?: number;
  blockNumber?: number;
  token_info?: { address?: string; symbol?: string; name?: string; decimals?: number };
}

interface TronContractValue {
  owner_address?: string;
  to_address?: string;
  amount?: number;
  asset_name?: string;
  contract_address?: string;
  /** ABI-encoded calldata, which is where a TRC-20 transfer hides its data. */
  data?: string;
}

/** TRON marks success with a `SUCCESS` contract result. */
function isSuccessful(tx: TronTransaction): boolean {
  const ret = tx.ret?.[0]?.contractRet;
  return ret === undefined || ret === 'SUCCESS';
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Plain base58 over raw bytes. */
export function base58Encode(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);

  let out = '';
  while (value > 0n) {
    out = BASE58_ALPHABET[Number(value % 58n)] + out;
    value /= 58n;
  }
  // Each leading zero byte is a literal '1'.
  for (const byte of bytes) {
    if (byte !== 0) break;
    out = `1${out}`;
  }
  return out || '1';
}

/**
 * Base58Check: the four-byte checksum that turns raw bytes into a
 * `T…` address.
 *
 * Plain base58 of a 21-byte TRON payload is only ~29 characters. The 34-character
 * form everyone recognises comes from appending the first four bytes of
 * double-SHA-256, which is also what guarantees the leading `T`.
 */
export function base58CheckEncode(payload: Uint8Array): string {
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const full = new Uint8Array(payload.length + checksum.length);
  full.set(payload);
  full.set(checksum, payload.length);
  return base58Encode(full);
}

/** Plain base58 decode, or null when a character is outside the alphabet. */
function base58Decode(value: string): Uint8Array | null {
  let total = 0n;
  for (const char of value) {
    const digit = BASE58_ALPHABET.indexOf(char);
    if (digit < 0) return null;
    total = total * 58n + BigInt(digit);
  }

  const bytes: number[] = [];
  while (total > 0n) {
    bytes.unshift(Number(total % 256n));
    total /= 256n;
  }
  for (const char of value) {
    if (char !== '1') break;
    bytes.unshift(0);
  }
  return new Uint8Array(bytes);
}

/**
 * A full Base58Check test: shape *and* checksum.
 *
 * The shape alone is not enough. A mistyped address still starts with `T` and is
 * still 34 characters, so it passes a regex and then comes back from TronGrid as
 * an opaque `400`, which reads as a provider outage rather than a typo. The
 * checksum is what makes an address self-validating, so it is checked.
 */
export function isTronAddress(value: string): boolean {
  const clean = value.trim();
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(clean)) return false;

  const decoded = base58Decode(clean);
  if (!decoded || decoded.length !== 25) return false;

  // Byte 0 is the `0x41` mainnet byte; the last four are the checksum.
  if (decoded[0] !== 0x41) return false;
  const payload = decoded.subarray(0, 21);
  const expected = sha256(sha256(payload)).slice(0, 4);
  return expected.every((byte, i) => byte === decoded[21 + i]);
}

/**
 * Normalise a TRON address to its base58 form.
 *
 * The `/wallet/*` node endpoints return addresses as hex prefixed with the
 * `0x41` network byte, while `/v1/*` returns base58. Users paste base58 (that is
 * what Tronscan shows), so everything is converted on the way out.
 */
export function normalizeTronAddress(value: string | undefined): string {
  if (!value) return '';
  const clean = (value.startsWith('0x') ? value.slice(2) : value).trim();
  if (isTronAddress(clean)) return clean;
  // `41` is TRON's network byte; the 20 bytes after it are the account hash.
  if (/^41[0-9a-fA-F]{40}$/.test(clean)) {
    return base58CheckEncode(new Uint8Array(clean.match(/.{2}/g)!.map((h) => Number.parseInt(h, 16))));
  }
  return value;
}

/** Best-effort symbol for well-known TRC-20 contracts; the chain stores no name. */
/**
 * A short address, used when the contract cannot be asked for its own symbol.
 *
 * TRON keeps no token registry. Reading a name means calling the contract's
 * `symbol()`, which is one provider round trip per distinct token, so it is
 * worth doing — but a shortened address is the honest fallback when the call
 * fails, because it says "we know the contract, not the name".
 */
export function symbolFromContract(address: string): string {
  const normalized = normalizeTronAddress(address);
  return normalized ? `TRC20-${normalized.slice(0, 4)}` : 'TRC20';
}

/**
 * The token contract a transaction moved, if it moved one at all.
 *
 * A native TRX transfer names an owner, not a contract, so this returns an empty
 * string and the caller skips metadata entirely.
 */
export function tokenContractOf(tx: TronTransaction): string {
  if (tx.raw_data?.contract?.[0]?.type !== 'TriggerSmartContract') return '';
  return normalizeTronAddress(tx.raw_data.contract[0].parameter?.value?.contract_address);
}

/** What a token contract says about itself. */
export interface Trc20Meta {
  symbol: string;
  decimals: number;
  /** Full token name, when the source reports one. */
  name?: string;
}

/**
 * Per-process token cache.
 *
 * A single wallet's history usually touches one or two tokens, and every
 * balance or profile read re-derives the same metadata. Caching the promise
 * rather than the value also collapses the concurrent duplicates that a
 * parallel history scan would otherwise create.
 */
const tokenCache = new Map<string, Promise<Trc20Meta | null>>();

/** How many uncached contracts one read may interrogate. */
const MAX_TOKEN_LOOKUPS = 5;


/**
 * Normalise the `trc20` field of an account.
 *
 * TronGrid returns it as an array of one-key objects (`[{A: "1"}, {B: "2"}]`),
 * which is not the flat record it looks like. Reading it as a record silently
 * produces holdings whose "amount" is an object, so it is flattened here and
 * anything unrecognised is dropped rather than coerced to a number.
 */
export function parseTrc20Holdings(field: unknown): Array<{ contract: string; raw: string }> {
  if (!field) return [];

  const pairs: Array<[string, unknown]> = Array.isArray(field)
    ? field.flatMap((entry) => (entry && typeof entry === 'object' ? Object.entries(entry) : []))
    : typeof field === 'object'
      ? Object.entries(field)
      : [];

  const holdings: Array<{ contract: string; raw: string }> = [];
  for (const [contract, value] of pairs) {
    // Some deployments nest the amount under `value`.
    const raw = typeof value === 'object' && value !== null ? (value as { value?: unknown }).value : value;
    if (typeof raw !== 'string' && typeof raw !== 'number') continue;
    const text = String(raw);
    if (!/^\d+$/.test(text)) continue;
    if (BigInt(text) === 0n) continue;
    holdings.push({ contract, raw: text });
  }
  return holdings;
}

/** Placeholder for callers that build before any metadata is known. */
const EMPTY_TOKENS = new Map<string, Trc20Meta>();

/** Decode an ABI-encoded `uint256`. */
export function abiDecodeUint(hex: string): number | null {
  const clean = hex.replace(/^0x/, '');
  if (clean.length < 64) return null;
  const value = BigInt(`0x${clean.slice(-64)}`);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(value);
}

/**
 * Decode an ABI-encoded `string`.
 *
 * Dynamic types are returned as offset, then length, then the padded bytes, so
 * the payload has to be read twice. Any short or inconsistent return is
 * treated as "no name" rather than parsed loosely.
 */
export function abiDecodeString(hex: string): string | null {
  const clean = hex.replace(/^0x/, '');
  // A dynamic string is a head word (the byte offset of the tail) followed by
  // the tail: a length word, then the bytes. The head is measured in BYTES
  // while the payload is a hex string, so every index has to be doubled on the
  // way out. Reading the length from the raw byte offset silently produced
  // garbage and made every token name fall back to its contract address.
  if (clean.length < 128) return null;

  const headBytes = Number.parseInt(clean.slice(0, 64), 16);
  if (!Number.isFinite(headBytes) || headBytes % 32 !== 0) return null;

  const lengthAt = headBytes * 2;
  const length = Number.parseInt(clean.slice(lengthAt, lengthAt + 64), 16);
  if (!Number.isFinite(length) || length === 0 || length > 128) return null;

  // The bytes start one word past the length word.
  const dataAt = lengthAt + 64;
  const dataEnd = dataAt + length * 2;
  if (dataEnd > clean.length) return null;

  const bytes = Uint8Array.from(clean.slice(dataAt, dataEnd).match(/.{2}/g)!.map((b) => Number.parseInt(b, 16)));
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Names commonly contain spaces ("Tether USD", "Binance Peg WETH"), so
    // rejecting them wholesale left the product showing a contract address
    // where a token name belonged. The set is still narrow on purpose: it
    // keeps a decode error from rendering as control characters in the UI.
    return /^[A-Za-z0-9 .$_-]{1,48}$/.test(text) ? text : null;
  } catch {
    return null;
  }
}

/**
 * Whether a token name is short and dense enough to double as its ticker.
 *
 * The node's `symbol()` returns an empty result for many TRC-20 contracts, so
 * `name()` is often the only usable answer. "WINK" is a ticker; "Tether USD" is
 * not, and shortening it would invent information the chain never gave us.
 */
function tickerFrom(name: string | null): string | null {
  if (!name) return null;
  return name.length <= 10 && /^[A-Za-z0-9._-]+$/.test(name) ? name : null;
}

/** Base58 TRON address to the `41…` hex form the node endpoints expect. */
export function tronAddressToHex(address: string): string | null {
  const decoded = base58Decode(normalizeTronAddress(address));
  return decoded && decoded.length === 25 ? toHex(decoded.subarray(0, 21)) : null;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Divide raw base units by `10 ** decimals`, exactly.
 *
 * Floating point would turn 1000000 at six decimals into 0.9999999999999999,
 * which then reads as a different amount than the chain recorded. This keeps
 * the integer part and only ever touches the fraction.
 */
export function scaleDown(raw: bigint, decimals: number): string {
  if (decimals <= 0) return raw.toString();

  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  if (fraction === 0n) return whole.toString();

  const padded = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${padded}`;
}


/**
 * TRC-20 methods worth decoding.
 *
 * A token transfer is a contract call, so the parties and amount are ABI
 * encoded inside `data`. Only the selectors that actually move value are
 * decoded; anything else (a swap, a bridge call) is reported as a plain
 * contract interaction rather than guessed at.
 */
const TRC20_SELECTORS: Record<string, { method: string; words: number }> = {
  // transfer(address to, uint256 amount)
  a9059cbb: { method: 'transfer', words: 2 },
  // transferFrom(address from, address to, uint256 amount)
  '23b872dd': { method: 'transferFrom', words: 3 }
};

/**
 * Raw 4-byte selectors for the optional metadata view, hex encoded.
 *
 * The node accepts these in the `data` field of a constant call. Passing them
 * as a `function_selector` argument instead — as a name, base64, or base58 —
 * makes it answer CONTRACT_VALIDATE_ERROR with an empty result; see
 * `readToken`.
 */
const TRC20_METADATA_SELECTORS = {
  decimals: '313ce567', // decimals()
  symbol: '95d5fca3', // symbol()
  name: '06fdde03' // name()
} as const;

/** Pull a left-padded 32-byte address word out of calldata. */
function addressWord(body: string, index: number): string {
  const start = index * 64;
  return `41${body.slice(start + 24, start + 64)}`;
}

/**
 * Decode a TRC-20 transfer's calldata into its sender, receiver and amount.
 *
 * Returns `null` for a non-transfer call, which is the common case: most TRON
 * traffic is a contract interaction rather than a plain token move.
 */
export function decodeTrc20Transfer(
  data: string | undefined
): { from: string; to: string; amount: number; method: string } | null {
  if (!data || data.length < 8) return null;
  const method = data.slice(0, 8).toLowerCase();
  const selector = TRC20_SELECTORS[method];
  if (!selector) return null;

  const body = data.slice(8);
  // 7 hex characters of a 32-byte word is the minimum for the last argument.
  if (body.length < selector.words * 64) return null;

  const amount = Number.parseInt(body.slice((selector.words - 1) * 64, selector.words * 64), 16);
  if (!Number.isFinite(amount)) return null;

  return selector.method === 'transfer'
    ? { from: '', to: addressWord(body, 0), amount, method }
    : { from: addressWord(body, 0), to: addressWord(body, 1), amount, method };
}

/** TRX amounts arrive in sun (1 TRX = 1e6 sun). */
export function fromSun(value: number | undefined): number {
  return (value ?? 0) / 1e6;
}

/**
 * TRON uses a delegated-proof-of-stake model: energy and bandwidth are consumed
 * instead of a gas limit, and TRX has 6 decimals rather than 18. The wallet
 * itself is Base58Check-encoded, so addresses start with `T` and are 34
 * characters long.
 *
 * Talking to TronGrid's HTTP API rather than the gRPC endpoint keeps this free
 * of a heavy client dependency, and the API key is only ever read server-side.
 */
export class TronAdapter extends BaseAdapter {
  readonly id: ChainId = 'tron';
  readonly name = 'TRON';
  readonly nativeSymbol = 'TRX';
  readonly decimals = 6;

  private readonly config: AdapterConfig;

  constructor(config: AdapterConfig = {}) {
    // Resolve the default now so `requireLive()` and `isLive` see a real URL.
    super({ ...config, id: 'tron', name: 'TRON', nativeSymbol: 'TRX', decimals: 6, rpcUrl: config.rpcUrl ?? TRON_DEFAULT_URL });
    this.config = config;
  }

  override get isLive(): boolean {
    return true;
  }

  private get baseUrl(): string {
    return (this.config.rpcUrl ?? TRON_DEFAULT_URL).replace(/\/+$/, '');
  }

  /**
   * Call TronGrid and return the payload.
   *
   * TronGrid has two response shapes. The `/v1/*` API wraps everything in
   * `{ data, success }`, while the legacy `/wallet/*` node endpoints return the
   * object itself. Both are supported so each method can use the endpoint with
   * the best rate limit.
   */
  private async call<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const body = await httpGet<{ data?: T; success?: boolean; Error?: string } & T>(
      url,
      this.name,
      this.policy,
      tronHeaders(this.config.apiKey)
    );

    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        throw ProviderError.providerError(body.Error ?? `TRON provider returned an error for ${path}.`, this.id);
      }
      if (body.data === undefined || body.data === null) {
        throw ProviderError.providerError(`TRON provider returned no data for ${path}.`, this.id);
      }
      return body.data as T;
    }

    if (body === undefined || body === null) {
      throw ProviderError.providerError(`TRON provider returned no data for ${path}.`, this.id);
    }
    return body as T;
  }

  /** The `/wallet/*` node endpoints are POST-only and return unwrapped JSON. */
  private async post<T>(path: string, body: unknown): Promise<T> {
    return httpPost<T>(`${this.baseUrl}${path}`, body, this.name, this.policy, tronHeaders(this.config.apiKey));
  }

  private buildTransaction(
    tx: TronTransaction,
    tokens: Map<string, Trc20Meta>,
    blockNumber = 0,
    blockTimeMs = 0
  ): Transaction {
    const contract = tx.raw_data?.contract?.[0]?.parameter?.value;
    const isTrc20Call = tx.raw_data?.contract?.[0]?.type === 'TriggerSmartContract';

    // A token transfer hides the parties and amount in calldata; a native
    // transfer exposes them directly.
    const decoded = isTrc20Call ? decodeTrc20Transfer(contract?.data) : null;
    const isTrc20 = Boolean(isTrc20Call && (decoded || contract?.asset_name));

    // The node endpoint omits `asset_name`, so the contract address is the only
    // way to name the token. `transferFrom` also names the real payer.
    const tokenContract = normalizeTronAddress(contract?.contract_address);
    const from = normalizeTronAddress(decoded?.from || contract?.owner_address);
    const to = normalizeTronAddress(decoded?.to ?? contract?.to_address);
    const rawAmount = decoded?.amount ?? contract?.amount ?? 0;
    const amount = fromSun(rawAmount);

    // A token movement carries no TRX, so the token itself is the asset.
    // Prefer what the contract says about itself; fall back to a short label.
    const token = tokens.get(tokenContract);
    const tokenSymbol = token?.symbol ?? symbolFromContract(tokenContract);
    // Prefer the contract's own name for the long label; it reads better than a
    // ticker, and falls back to the ticker when the contract does not answer.
    const tokenName = token?.name ?? tokenSymbol;
    const tokenDecimals = token?.decimals ?? 0;

    const asset: TransactionAsset = isTrc20
      ? {
          type: 'token',
          name: tokenName,
          symbol: tokenSymbol,
          // Scaled by the contract's own `decimals()`, so this is tokens, not
          // base units. A 100 USDT transfer reads as "100", not "100000000".
          amount: scaleDown(BigInt(rawAmount), tokenDecimals),
          decimals: tokenDecimals,
          contractAddress: tokenContract,
          standard: 'TRC-20',
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

    const related: RelatedWallet[] = [
      { address: from, label: 'From', kind: 'wallet', relationship: 'sender', level: 'normal' },
      { address: to, label: 'To', kind: 'wallet', relationship: 'receiver', level: 'normal' }
    ];

    const technical: TechnicalField[] = [
      { label: 'Block', value: String(blockNumber) },
      { label: 'Contract type', value: tx.raw_data?.contract?.[0]?.type ?? 'TransferContract' },
      { label: 'Energy/bandwidth', value: 'DPoS resource model', hint: 'TRON has no gas limit.' }
    ];
    if (isTrc20) {
      technical.push({
        label: 'Token contract',
        value: normalizeTronAddress(contract?.contract_address) || 'unknown',
        hint: tokenDecimals
          ? `Token decimals read from the contract: ${tokenDecimals}.`
          : 'The contract did not answer `decimals()`, so the amount is shown in base units.'
      });
    }

    // `block_timestamp` is the inclusion time; `raw_data.timestamp` is when the
    // broadcast was signed. Prefer the former, fall back to the latter.
    const timestamp = blockTimeMs || tx.block_timestamp || tx.raw_data?.timestamp || 0;

    return {
      hash: tx.txID,
      chain: this.id,
      from,
      to,
      timestamp,
      // TRON has no mempool: a transaction is either broadcast or final.
      status: isSuccessful(tx) ? 'confirmed' : 'failed',
      block: blockNumber,
      confirmations: blockNumber > 0 ? 1 : 0,
      asset,
      assets: [asset],
      summary: isTrc20
        ? [`${asset.amount} ${asset.symbol} transferred`]
        : [`${amount} ${this.nativeSymbol} transferred`],
      technical,
      related
    };
  }

  override async getTransaction(hash: string): Promise<Transaction> {
    const v = hash.trim().toLowerCase();
    if (!isTronHash(v)) throw ProviderError.invalidHash(hash, this.name);
    this.requireLive();

    // Two node endpoints: one carries the signed payload, the other reports
    // which block included it. The info call is best-effort — a transaction
    // that exists but is not yet indexed should still render.
    const tx = await this.post<TronTransaction>('/wallet/gettransactionbyid', { value: v });
    if (!tx || !tx.txID) throw ProviderError.transactionNotFound(v, this.name);

    let blockNumber = 0;
    let blockTimeMs = 0;
    try {
      const info = await this.post<{ blockNumber?: number; blockTimeStamp?: number }>(
        '/wallet/gettransactioninfobyid',
        { value: v }
      );
      blockNumber = info.blockNumber ?? 0;
      blockTimeMs = info.blockTimeStamp ?? 0;
    } catch {
      blockNumber = 0;
    }

    return this.buildTransaction(tx, await this.resolveTokens([tokenContractOf(tx)]), blockNumber, blockTimeMs);
  }

  /**
   * Ask each token contract what it is.
   *
   * `decimals()` matters most: without it a transfer of 100 tokens is
   * indistinguishable from 100000000 base units, and every downstream number
   * is wrong by a factor of a million. `symbol()` is a nicety, so a failure
   * there does not discard a good `decimals()` answer.
   *
   * These are constant calls, so they cost energy but no fees. Results are
   * cached process-wide, including the failures, because a contract that does
   * not answer will not answer next time either.
   */
  private async resolveTokens(contracts: string[]): Promise<Map<string, Trc20Meta>> {
    const distinct = [...new Set(contracts.filter(Boolean))];
    if (distinct.length === 0) return new Map();

    // TronGrid meters constant calls, and a wallet that trades a hundred
    // scammy tokens would otherwise spend a hundred calls to decorate a page.
    // Cached answers are always free, so the cap only bounds new work.
    const cached = distinct.filter((c) => tokenCache.has(c));
    const fresh = distinct.filter((c) => !tokenCache.has(c)).slice(0, MAX_TOKEN_LOOKUPS);

    const settled = await Promise.all([...cached, ...fresh].map((contract) => this.resolveToken(contract)));
    const map = new Map<string, Trc20Meta>();
    settled.forEach((meta, i) => {
      if (meta) map.set([...cached, ...fresh][i], meta);
    });
    return map;
  }

  private resolveToken(contract: string): Promise<Trc20Meta | null> {
    const key = normalizeTronAddress(contract);
    const cached = tokenCache.get(key);
    if (cached) return cached;

    // Only a *definitive* answer is cached. A rate limit or timeout says
    // nothing about the contract, and caching that would leave the token
    // permanently nameless for the life of the process — which is exactly what
    // happened before this was separated out.
    const pending = this.readToken(key)
      .then((meta) => {
        if (meta) tokenCache.set(key, Promise.resolve(meta));
        return meta;
      })
      .catch(() => null);
    return pending;
  }

  private async readToken(contract: string): Promise<Trc20Meta | null> {
    const hex = tronAddressToHex(contract);
    if (!hex) return null;

    /**
     * One constant call, retried once, tolerant of failure.
     *
     * The node answers these intermittently: the same selector can return a
     * value on one attempt and an empty result on the next, usually when
     * several calls land at once. A single dropped `decimals()` answer is not a
     * cosmetic problem — it scales every amount by the wrong power of ten — so
     * one retry is worth the latency, while repeated failure still falls back
     * rather than hanging the page.
     *
     * The calls are independent on purpose: a contract that implements
     * `decimals()` but not `symbol()` must still yield a usable scale, and a
     * failure on one must not throw away the other one's answer.
     */
    const attempt = async (selector: string): Promise<string | null> => {
      try {
        // The selector goes in `data` as raw hex. Sending it in
        // `function_selector` instead — whether as a name, base64, or base58 —
        // makes the node answer CONTRACT_VALIDATE_ERROR with an empty result,
        // which used to be swallowed here and left every token displaying a
        // placeholder like "TRC20-TLa2" with a scale of 0.
        const result = await this.post<{
          result?: { result?: boolean; code?: string; constant_result?: string[] };
          constant_result?: string[];
        }>(
          '/wallet/triggerconstantcontract',
          { owner_address: hex, contract_address: hex, data: selector }
        );
        // A contract that does not implement the method answers with a validate
        // error rather than a revert, so both shapes have to be rejected.
        if (result?.result?.code || result?.result?.result === false) return null;
        const value = result?.result?.constant_result?.[0] ?? result?.constant_result?.[0];
        return value && value !== '0' ? value : null;
      } catch {
        return null;
      }
    };

    const call = async (selector: string): Promise<string | null> => {
      const first = await attempt(selector);
      if (first) return first;
      // A short pause is enough to step out of the node's burst window.
      await new Promise((resolve) => setTimeout(resolve, 250));
      return attempt(selector);
    };

    const [decimalsHex, symbolHex, nameHex] = await Promise.all([
      call(TRC20_METADATA_SELECTORS.decimals),
      call(TRC20_METADATA_SELECTORS.symbol),
      call(TRC20_METADATA_SELECTORS.name)
    ]);
    const decimals = decimalsHex ? abiDecodeUint(decimalsHex) : null;
    const symbol = symbolHex ? abiDecodeString(symbolHex) : null;
    const name = nameHex ? abiDecodeString(nameHex) : null;

    // Nothing readable at all: the caller falls back to a short contract label.
    if (decimals === null && !symbol && !name) return null;

    return {
      symbol: symbol ?? tickerFrom(name) ?? name ?? symbolFromContract(contract),
      name: name ?? undefined,
      decimals: decimals ?? 0
    };
  }

  override async getHistory(address: string, options: HistoryOptions = {}): Promise<Transaction[]> {
    const addr = address.trim();
    if (!isTronAddress(addr)) throw ProviderError.invalidAddress(address, this.name);
    this.requireLive();

    const limit = Math.min(Math.max(options.limit ?? 20, 1), 200);
    const params = new URLSearchParams({
      address: addr,
      limit: String(limit),
      order_by: 'block_timestamp,desc',
      only_confirmed: 'true'
    });
    if (options.since) params.set('min_block_timestamp', String(Math.floor(options.since / 1000)));
    if (options.until) params.set('max_block_timestamp', String(Math.floor(options.until / 1000)));

    // The native feed is the history source. It honours `order_by`, and it
    // contains token transfers too, so it alone gives a correct newest-first
    // window. The TRC-20 feed is fetched for *metadata only*: it reports each
    // token's real `symbol` and `decimals` for free, whereas the native shape
    // hides a token's scale inside the contract.
    //
    // The TRC-20 feed cannot be used as a history source: it ignores `order_by`
    // and returns a stale, unordered window, so trusting its ordering produced
    // histories that were months out of date.
    const [native, trc20] = await Promise.all([
      this.call<TronTransaction[]>(`/v1/accounts/${addr}/transactions?${params.toString()}`),
      this.call<TronTrc20Transfer[]>(`/v1/accounts/${addr}/transactions/trc20?limit=${Math.min(limit, 50)}`)
    ]);

    const described = new Map<string, Trc20Meta>();
    for (const tx of trc20) {
      const contract = normalizeTronAddress(tx.token_info?.address);
      if (!contract) continue;
      described.set(contract, {
        symbol: tx.token_info?.symbol || symbolFromContract(contract),
        decimals: Number.isInteger(tx.token_info?.decimals) ? (tx.token_info!.decimals as number) : 0,
        name: tx.token_info?.name
      });
    }

    const history = native.map((tx) => this.buildTransaction(tx, EMPTY_TOKENS, tx.blockNumber ?? 0, tx.block_timestamp ?? 0));

    // Anything the metadata feed already described needs no contract call.
    // Collect the contracts the native feed told us about but the flat
    // `/transactions/trc20` response did not describe, so those can be looked
    // up. Selecting on a *missing* address here would match nothing, since the
    // next line reads that same address.
    const unknown = [
      ...new Set(
        history
          .filter((tx) => tx.asset.type === 'token' && Boolean(tx.asset.contractAddress))
          .map((tx) => tx.asset.contractAddress)
          .filter((c): c is string => Boolean(c))
      )
    ].filter((contract) => !described.has(contract));
    const tokens = await this.resolveTokens(unknown);

    return history
      .map((tx) => {
        if (tx.asset.type !== 'token' || !tx.asset.contractAddress) return tx;
        const contract = normalizeTronAddress(tx.asset.contractAddress);
        const meta = described.get(contract) ?? tokens.get(contract);
        if (!meta) return tx;
        // The node shape carries raw base units, so dividing by the token's own
        // scale is all that is needed: a 100-token transfer is otherwise read as
        // 100000000. Scaling up first would cancel out and change nothing.
        return {
          ...tx,
          asset: { ...tx.asset, symbol: meta.symbol, name: meta.name ?? meta.symbol, decimals: meta.decimals, amount: scaleDown(BigInt(tx.asset.amount ?? '0'), meta.decimals) }
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  override async getBalances(address: string): Promise<Balance[]> {
    const addr = address.trim();
    if (!isTronAddress(addr)) throw ProviderError.invalidAddress(address, this.name);
    this.requireLive();

    // `/v1/accounts` answers with a list, one entry per matching account. The
    // native balance is on the first entry; TRC-20 holdings are keyed by token
    // contract, so they need a metadata lookup each to be given a scale.
    const accounts = await this.call<Array<{ balance?: number; trc20?: unknown }>>(`/v1/accounts/${addr}`);
    const account = accounts[0];

    const holdings = parseTrc20Holdings(account?.trc20);
    const tokens = await this.resolveTokens(holdings.map((h) => h.contract));

    return [
      {
        assetId: 'tron-trx',
        symbol: this.nativeSymbol,
        amount: fromSun(account?.balance),
        decimals: this.decimals
      },
      ...holdings.map(({ contract, raw }) => {
        const meta = tokens.get(normalizeTronAddress(contract));
        return {
          assetId: `tron-trc20-${normalizeTronAddress(contract)}`,
          symbol: meta?.symbol ?? symbolFromContract(contract),
          amount: Number(scaleDown(BigInt(raw), meta?.decimals ?? 0)),
          decimals: meta?.decimals ?? 0
        };
      })
    ];
  }

  override async getTip(): Promise<ChainTip> {
    this.requireLive();
    const block = await this.call<{ block_header?: { raw_data?: { number?: number } } }>('/wallet/getnowblock');
    return { chain: this.id, height: block.block_header?.raw_data?.number ?? 0, unit: 'block' };
  }

  /** TRON's own explorer, which resolves both base58 and hex addresses. */
  async verifyAddress(address: string): Promise<boolean> {
    if (!isTronAddress(address)) return false;
    this.requireLive();
    try {
      const account = await this.call<{ address?: string }>(`/v1/accounts/${address.trim()}`);
      return Boolean(account.address);
    } catch {
      return false;
    }
  }
}

export function createTronAdapter(config: AdapterConfig = {}): TronAdapter {
  return new TronAdapter(config);
}
