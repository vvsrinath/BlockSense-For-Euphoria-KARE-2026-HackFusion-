/**
 * Cross-origin headers.
 *
 * The web app runs on a different origin from the API in production, so the API
 * has to allow it explicitly. The allowlist comes from `FRONTEND_URL` rather
 * than being hardcoded, so one variable configures a deployment.
 */

import type { ServerResponse } from 'node:http';
import { allowedOrigins } from '../config/index';

export function cors(origin: string | undefined, res: ServerResponse): void {
  const allowed = allowedOrigins();
  const requestOrigin = origin ?? '';

  if (allowed.includes('*')) {
    res.setHeader('access-control-allow-origin', '*');
  } else if (requestOrigin && allowed.includes(requestOrigin)) {
    res.setHeader('access-control-allow-origin', requestOrigin);
    // Without Vary, a shared cache could hand one origin's response to another.
    res.setHeader('vary', 'origin');
  }

  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,x-request-id');
  res.setHeader('access-control-max-age', '86400');
}
