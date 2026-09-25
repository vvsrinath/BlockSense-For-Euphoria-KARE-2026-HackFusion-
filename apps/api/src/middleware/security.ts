/**
 * Rate limiting and response security headers.
 *
 * The API is a free, keyless, public surface in front of rate-limited public RPC
 * endpoints. Without a limiter, one client looping on `/transactions/...` would
 * spend the provider quota and the service would degrade for everyone.
 *
 * A fixed window per client IP is deliberate. A sliding log would be more
 * precise, but it needs a lock or a sorted structure per key; for a single
 * process the simpler counter is the right trade.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Best-effort client identity.
 *
 * `x-forwarded-for` is trusted because the API is expected to sit behind a proxy
 * or platform router in production. On a direct connection the socket address
 * is used instead.
 */
export function clientKey(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(',')[0]?.trim();
  if (first) return first;
  return req.socket.remoteAddress ?? 'unknown';
}

export class RateLimiter {
  private readonly windows = new Map<string, Window>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor({ windowMs, maxRequests }: RateLimitOptions) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /** Consume one unit of quota. */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number; retryAfterSeconds: number } {
    const now = Date.now();
    const existing = this.windows.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.windows.set(key, { count: 1, resetAt });
      this.sweep(now);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
        retryAfterSeconds: Math.ceil(this.windowMs / 1000)
      };
    }

    existing.count += 1;
    const allowed = existing.count <= this.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - existing.count),
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  /** Drop windows that have already reset, so the map cannot grow forever. */
  private sweep(now: number): void {
    if (this.windows.size < 1000) return;
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
  }

  get size(): number {
    return this.windows.size;
  }
}

/**
 * Baseline hardening headers.
 *
 * The API only ever returns JSON, so the policy can be strict: no framing, no
 * sniffing, and a referrer that leaks nothing. A CSP is included because a
 * browser that renders an API error page should still be sandboxed.
 */
export function securityHeaders(res: ServerResponse): void {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('cross-origin-resource-policy', 'same-site');
  res.setHeader('permissions-policy', 'geolocation=(), camera=(), microphone=()');
  // The API never caches a personalised response.
  res.setHeader('cache-control', 'no-store');
}
