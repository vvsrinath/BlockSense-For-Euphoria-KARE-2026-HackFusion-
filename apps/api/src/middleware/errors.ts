/**
 * Error normalisation.
 *
 * Adapters throw `ProviderError`, validation throws a zod error, and handlers
 * may throw anything. Every one of them has to become a predictable JSON body
 * with a correct status code, so clients never have to parse a stack trace.
 */

import { isProviderError, ProviderError } from '@blocksense/blockchain';
import type { ServerResponse } from 'node:http';
import { logger } from './logger';

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    /** Field-level detail, present for validation failures. */
    details?: { path: string; message: string }[];
    chain?: string;
  };
}

/** zod is a dependency of @blocksense/shared; narrow on shape, not on identity. */
function isZodError(err: unknown): err is { issues: { path: (string | number)[]; message: string }[] } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'issues' in err &&
    Array.isArray((err as { issues: unknown }).issues)
  );
}

export function toErrorBody(err: unknown): { status: number; body: ErrorBody } {
  if (isProviderError(err)) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, ...(err.chain ? { chain: err.chain } : {}) } }
    };
  }

  if (isZodError(err)) {
    return {
      status: 422,
      body: {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request could not be validated.',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
        }
      }
    };
  }

  const status = (err as { status?: number })?.status;
  if (typeof status === 'number' && status >= 400 && status < 600) {
    const code = (err as { code?: string })?.code ?? 'BAD_REQUEST';
    return {
      status,
      body: { error: { code, message: err instanceof Error ? err.message : String(err) } }
    };
  }

  return {
    status: 500,
    body: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } }
  };
}

export function sendError(err: unknown, res: ServerResponse, requestIdValue: string): void {
  const { status, body } = toErrorBody(err);

  if (status >= 500) {
    logger.error('Unhandled error', { id: requestIdValue, message: err instanceof Error ? err.message : String(err) });
  } else {
    logger.debug('Request rejected', { id: requestIdValue, status, code: body.error.code });
  }

  if (res.headersSent) return;
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

export { ProviderError };
