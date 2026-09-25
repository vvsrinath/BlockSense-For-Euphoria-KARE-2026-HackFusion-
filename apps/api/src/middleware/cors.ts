/**
 * Cross-origin headers.
 *
 * The web app runs on a different port in development, so the API has to allow
 * it explicitly. The allowlist is configurable rather than '*' so a
 * deployment can restrict origins.
 */

import type { ServerResponse } from 'node:http';

const DEFAULT_ALLOWED = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function allowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || !raw.trim()) return DEFAULT_ALLOWED;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function cors(origin: string | undefined, res: ServerResponse): void {
  const allowed = allowedOrigins();
  const requestOrigin = origin ?? '';

  if (allowed.includes('*')) {
    res.setHeader('access-control-allow-origin', '*');
  } else if (allowed.includes(requestOrigin)) {
    res.setHeader('access-control-allow-origin', requestOrigin);
    res.setHeader('vary', 'origin');
  }

  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,x-request-id');
  res.setHeader('access-control-max-age', '86400');
}
