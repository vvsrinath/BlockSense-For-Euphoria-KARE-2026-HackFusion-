/**
 * Error normalisation into the shared response envelope.
 *
 * Adapters throw `ProviderError`, validation throws a zod error, and handlers may
 * throw anything. Every one of them becomes the same predictable JSON body, so
 * a client can branch on `error.code` without parsing prose.
 */

import { isProviderError, ProviderError } from '@blocksense/blockchain';
import type { ServerResponse } from 'node:http';
import { logger } from './logger';

export interface ErrorDetail {
  path: string;
  message: string;
}

export interface ErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    chain?: string;
  };
  meta: { requestId: string };
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

export function toErrorPayload(err: unknown, requestIdValue: string): { status: number; body: ErrorPayload } {
  const meta = { requestId: requestIdValue };

  if (isProviderError(err)) {
    return {
      status: err.status,
      body: {
        success: false,
        error: { code: err.code, message: err.message, ...(err.chain ? { chain: err.chain } : {}) },
        meta
      }
    };
  }

  if (isZodError(err)) {
    return {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'The request could not be validated.',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
        },
        meta
      }
    };
  }

  // A handler may throw anything with a status attached, for example a rate limit.
  const status = (err as { status?: number })?.status;
  if (typeof status === 'number' && status >= 400 && status < 600) {
    const code = (err as { code?: string })?.code ?? 'INVALID_REQUEST';
    return {
      status,
      body: { success: false, error: { code, message: err instanceof Error ? err.message : String(err) }, meta }
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      meta
    }
  };
}

export function sendError(err: unknown, res: ServerResponse, requestIdValue: string): void {
  const { status, body } = toErrorPayload(err, requestIdValue);

  if (status >= 500) {
    // 5xx means we have a bug, so the real message is logged even though the
    // client only ever sees a generic one.
    logger.error('Unhandled error', {
      id: requestIdValue,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
  } else {
    logger.debug('Request rejected', { id: requestIdValue, status, code: body.error.code });
  }

  if (res.headersSent) return;
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'x-request-id': requestIdValue });
  res.end(JSON.stringify(body));
}

export { ProviderError };
