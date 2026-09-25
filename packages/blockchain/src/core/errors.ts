/**
 * Error types shared by every chain adapter.
 *
 * Adapters are expected to throw these (never raw `fetch` failures) so that
 * `apps/api` can map them onto HTTP status codes without knowing which chain
 * the request targeted.
 *
 * The code strings are part of the public API contract: clients switch on them,
 * so they must stay stable even if the message text changes.
 */

export type ProviderErrorCode =
  // The request itself is wrong.
  | 'INVALID_REQUEST'
  | 'INVALID_ADDRESS'
  | 'INVALID_TRANSACTION_HASH'
  | 'UNSUPPORTED_CHAIN'
  | 'NOT_FOUND'
  // The chain provider could not answer.
  | 'RPC_UNAVAILABLE'
  | 'RPC_TIMEOUT'
  | 'RPC_RATE_LIMITED'
  | 'PROVIDER_ERROR'
  // BlockSense could not produce a result.
  | 'TRANSACTION_NOT_FOUND'
  | 'WALLET_NOT_FOUND'
  | 'ASSET_NOT_FOUND'
  | 'ANALYSIS_FAILED'
  | 'NETWORK_LIMIT_EXCEEDED'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ProviderErrorCode, number> = {
  INVALID_REQUEST: 400,
  INVALID_ADDRESS: 400,
  INVALID_TRANSACTION_HASH: 400,
  UNSUPPORTED_CHAIN: 400,
  NOT_FOUND: 404,

  RPC_UNAVAILABLE: 503,
  RPC_TIMEOUT: 504,
  RPC_RATE_LIMITED: 429,
  PROVIDER_ERROR: 502,

  TRANSACTION_NOT_FOUND: 404,
  WALLET_NOT_FOUND: 404,
  ASSET_NOT_FOUND: 404,
  ANALYSIS_FAILED: 500,
  NETWORK_LIMIT_EXCEEDED: 400,
  NOT_IMPLEMENTED: 501,
  INTERNAL_ERROR: 500
};

/** Kinds of resource a lookup can fail to find, mapped to their error code. */
type ResourceKind = 'Transaction' | 'Wallet' | 'Asset' | 'Account' | 'Block';

const NOT_FOUND_CODE: Record<string, ProviderErrorCode> = {
  Transaction: 'TRANSACTION_NOT_FOUND',
  Wallet: 'WALLET_NOT_FOUND',
  Account: 'WALLET_NOT_FOUND',
  Asset: 'ASSET_NOT_FOUND',
  Block: 'TRANSACTION_NOT_FOUND'
};

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly status: number;
  /** Chain the failure came from, when known. */
  readonly chain?: string;
  /**
   * How long the provider asked us to wait, from its `Retry-After` header.
   *
   * A shared public endpoint knows exactly when its quota refills, so guessing
   * a backoff is worse than obeying the number it gave us.
   */
  readonly retryAfterMs?: number;

  constructor(code: ProviderErrorCode, message: string, chain?: string, retryAfterMs?: number) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.chain = chain;
    this.retryAfterMs = retryAfterMs;
  }

  /**
   * A resource lookup came back empty. The message reads naturally for every
   * caller while the code stays specific enough for a client to branch on.
   */
  static notFound(what: ResourceKind, id: string, chain?: string): ProviderError {
    const code = NOT_FOUND_CODE[what] ?? 'NOT_FOUND';
    return new ProviderError(code, `${what} "${id}" was not found${chain ? ` on ${chain}` : ''}.`, chain);
  }

  static transactionNotFound(hash: string, chain?: string): ProviderError {
    return ProviderError.notFound('Transaction', hash, chain);
  }

  static walletNotFound(address: string, chain?: string): ProviderError {
    return ProviderError.notFound('Wallet', address, chain);
  }

  static assetNotFound(identifier: string, chain?: string): ProviderError {
    return ProviderError.notFound('Asset', identifier, chain);
  }

  static invalidAddress(address: string, chain?: string): ProviderError {
    return new ProviderError('INVALID_ADDRESS', `"${address}" is not a valid address on ${chain ?? 'this chain'}.`, chain);
  }

  static invalidHash(hash: string, chain?: string): ProviderError {
    return new ProviderError(
      'INVALID_TRANSACTION_HASH',
      `"${hash}" is not a valid transaction hash on ${chain ?? 'this chain'}.`,
      chain
    );
  }

  static invalidRequest(message: string, chain?: string): ProviderError {
    return new ProviderError('INVALID_REQUEST', message, chain);
  }

  static unsupportedChain(chain: string): ProviderError {
    return new ProviderError('UNSUPPORTED_CHAIN', `Chain "${chain}" is not supported.`, chain);
  }

  static rpcUnavailable(message: string, chain?: string): ProviderError {
    return new ProviderError('RPC_UNAVAILABLE', message, chain);
  }

  static rpcTimeout(chain: string, timeoutMs: number): ProviderError {
    return new ProviderError('RPC_TIMEOUT', `${chain} provider timed out after ${timeoutMs}ms.`, chain);
  }

  static rateLimited(chain?: string, retryAfterMs?: number): ProviderError {
    return new ProviderError(
      'RPC_RATE_LIMITED',
      `Upstream provider rate limit exceeded${chain ? ` (${chain})` : ''}.`,
      chain,
      retryAfterMs
    );
  }

  static providerError(message: string, chain?: string): ProviderError {
    return new ProviderError('PROVIDER_ERROR', message, chain);
  }

  /**
   * The chain is supported but the operation needs a provider this deployment
   * has not configured — an explorer API or an indexer, for example.
   */
  static notImplemented(message: string, chain?: string): ProviderError {
    return new ProviderError('NOT_IMPLEMENTED', message, chain);
  }

  static analysisFailed(message: string): ProviderError {
    return new ProviderError('ANALYSIS_FAILED', message);
  }

  static networkLimitExceeded(message: string): ProviderError {
    return new ProviderError('NETWORK_LIMIT_EXCEEDED', message);
  }

  toJSON(): { error: { code: ProviderErrorCode; message: string; chain?: string } } {
    return { error: { code: this.code, message: this.message, ...(this.chain ? { chain: this.chain } : {}) } };
  }
}

/** Narrow an unknown thrown value into a `ProviderError`. */
export function toProviderError(err: unknown, chain?: string): ProviderError {
  if (err instanceof ProviderError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return ProviderError.rpcUnavailable(message, chain);
}

export function isProviderError(err: unknown): err is ProviderError {
  return err instanceof ProviderError;
}
