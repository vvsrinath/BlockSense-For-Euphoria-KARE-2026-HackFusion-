/**
 * A very small HTTP router built on `node:http`.
 *
 * BlockSense's API surface is narrow and entirely JSON, so a framework would
 * add more install weight and indirection than it removes. This supports
 * path parameters, JSON bodies, and typed handlers — which is all the service
 * actually needs.
 *
 * If the API grows streaming, websockets or a large middleware ecosystem, swap
 * this for Fastify or Hono; only `routes/` and `index.ts` would change.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  /** Path parameters extracted from the route pattern. */
  params: Record<string, string>;
  query: URLSearchParams;
  /** Parsed JSON body, or undefined when there was none. */
  body: unknown;
  /** Correlation id, echoed in the response and in every log line. */
  id: string;
}

export type Handler = (ctx: RequestContext) => unknown | Promise<unknown>;

interface Route {
  method: Method;
  segments: string[];
  handler: Handler;
}

/** `/wallet/:address` -> ['wallet', ':address'] */
function toSegments(pattern: string): string[] {
  return pattern.split('/').filter(Boolean);
}

export class Router {
  private routes: Route[] = [];

  add(method: Method, pattern: string, handler: Handler): this {
    this.routes.push({ method, segments: toSegments(pattern), handler });
    return this;
  }

  get(pattern: string, handler: Handler): this {
    return this.add('GET', pattern, handler);
  }

  post(pattern: string, handler: Handler): this {
    return this.add('POST', pattern, handler);
  }

  /**
   * Find a handler for a method and path.
   * Returns null when no route matches, so the caller can 404 or 405.
   */
  match(method: string, pathname: string): { handler: Handler; params: Record<string, string> } | null {
    const parts = toSegments(pathname);
    let pathMatched = false;

    for (const route of this.routes) {
      if (route.segments.length !== parts.length) continue;

      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < route.segments.length; i += 1) {
        const seg = route.segments[i];
        if (seg.startsWith(':')) {
          params[seg.slice(1)] = decodeURIComponent(parts[i]);
        } else if (seg !== parts[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      pathMatched = true;
      if (route.method === method) return { handler: route.handler, params };
    }

    // Path exists but the verb does not: signal 405 rather than a misleading 404.
    if (pathMatched) {
      const err = new Error(`Method ${method} is not allowed on this route.`) as Error & {
        status?: number;
        code?: string;
      };
      err.status = 405;
      err.code = 'METHOD_NOT_ALLOWED';
      throw err;
    }
    return null;
  }

  /** Every registered route, for the self-documenting index endpoint. */
  list(): { method: Method; path: string }[] {
    return this.routes.map((r) => ({
      method: r.method,
      path: `/${r.segments.map((s) => (s.startsWith(':') ? `{${s.slice(1)}}` : s)).join('/')}`
    }));
  }
}

/** Read and parse a JSON request body, with a size ceiling. */
export async function readJsonBody(req: IncomingMessage, limitBytes = 1_000_000): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.length;
    if (size > limitBytes) {
      const err = new Error('Request body too large') as Error & { status?: number };
      err.status = 413;
      throw err;
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error('Request body is not valid JSON') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
}
