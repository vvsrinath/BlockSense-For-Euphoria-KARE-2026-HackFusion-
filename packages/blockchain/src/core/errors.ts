/**
 * Error types shared by every chain adapter.
 *
 * Adapters are expected to throw these (never raw `fetch` failures) so that
 * `apps/api` can map them onto HTTP status codes without knowing which chain
 * the request targeted.
 */

export type ProviderErrorCode =
  | 'NOT_FOUND'
  | 'RPC_ERROR'
  | 'RATE_LIMITED'
  | 'UNSUPPORTED_CHAIN'
  | 'INVALID_INPUT'
  | 'UPSTREAM_UNAVAILABLE'
  | 'NOT_IMPLEMENTED';

const STATUS_BY_CODE: Record<ProviderErrorCode, number> = {
  NOT_FOUND: 404,
  RPC_ERROR: 502,
  RATE_LIMITED: 429,
  UNSUPPORTED_CHAIN: 400,
  INVALID_INPUT: 400,
  UPSTREAM_UNAVAILABLE: 503,
  NOT_IMPLEMENTED: 501
};

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly status: number;
  /** Chain the failure came from, when known. */
  readonly chain?: string;

  constructor(code: ProviderErrorCode, message: string, chain?: string) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.chain = chain;
  }

  static notFound(what: string, id: string, chain?: string): ProviderError {
    return new ProviderError('NOT_FOUND', `${what} "${id}" was not found${chain ? ` on ${chain}` : ''}.`, chain);
  }

  static rateLimited(chain?: string): ProviderError {
    return new ProviderError('RATE_LIMITED', `Upstream provider rate limit exceeded${chain ? ` (${chain})` : ''}.`, chain);
  }

  toJSON(): { error: { code: ProviderErrorCode; message: string; chain?: string } } {
    return { error: { code: this.code, message: this.message, ...(this.chain ? { chain: this.chain } : {}) } };
  }
}

/** Narrow an unknown thrown value into a `ProviderError`. */
export function toProviderError(err: unknown, chain?: string): ProviderError {
  if (err instanceof ProviderError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new ProviderError('UPSTREAM_UNAVAILABLE', message, chain);
}

export function isProviderError(err: unknown): err is ProviderError {
  return err instanceof ProviderError;
}
