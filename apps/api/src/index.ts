/**
 * The API server.
 *
 * Built on `node:http` with no framework. BlockSense's API is a narrow JSON
 * surface, and a zero-dependency server means `pnpm dev` works immediately
 * after install, which is the property that matters most for a project people
 * are meant to fork and experiment with.
 *
 * The web app is a separate origin and calls `/api/v1` here, so the browser
 * only ever talks to one API contract.
 */

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/index';
import { cors } from './middleware/cors';
import { sendError } from './middleware/errors';
import { logger, requestId, setLogLevel } from './middleware/logger';
import { readJsonBody } from './middleware/router';
import { RateLimiter, clientKey, securityHeaders } from './middleware/security';
import { createRouter } from './routes/index';
import { USE_MOCK } from './services/index';

const router = createRouter();
const rateLimiter = new RateLimiter(config.rateLimit);

/** The success envelope from the API contract. */
function sendData(res: ServerResponse, status: number, data: unknown, id: string): void {
  if (res.headersSent) return;
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'x-request-id': id
  });
  res.end(JSON.stringify({ success: true, data, meta: { requestId: id, timestamp: Date.now() } }));
}

/** The failure envelope. Sent directly so a 404 is never wrapped as a success. */
function sendFailure(res: ServerResponse, status: number, body: unknown, id: string): void {
  if (res.headersSent) return;
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'x-request-id': id
  });
  res.end(JSON.stringify(body));
}

function sendNotFound(res: ServerResponse, method: string, pathname: string, id: string): void {
  sendFailure(
    res,
    404,
    {
      success: false,
      error: { code: 'NOT_FOUND', message: `No route for ${method} ${pathname}.` },
      meta: { requestId: id }
    },
    id
  );
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const id = (req.headers['x-request-id'] as string | undefined) ?? requestId();
  const started = Date.now();
  const method = req.method ?? 'GET';

  securityHeaders(res);
  cors(req.headers.origin, res);

  // Preflight carries no body, so answer it before routing and before spending
  // a rate limit token on a request that does no work.
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // Health checks are how a platform router learns whether the process is alive.
  // Charging them quota means a monitoring ping could throttle real users.
  const isHealth = url.pathname.endsWith('/health') || url.pathname.endsWith('/health/chains');

  if (!isHealth) {
    const limit = rateLimiter.check(clientKey(req));
    res.setHeader('x-ratelimit-limit', String(config.rateLimit.maxRequests));
    res.setHeader('x-ratelimit-remaining', String(limit.remaining));
    res.setHeader('x-ratelimit-reset', String(limit.resetAt));

    if (!limit.allowed) {
      res.setHeader('retry-after', String(limit.retryAfterSeconds));
      sendFailure(
        res,
        429,
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many requests. Try again in ${limit.retryAfterSeconds}s.`
          },
          meta: { requestId: id }
        },
        id
      );
      return;
    }
  }

  logger.debug('Request received', { id, method, path: url.pathname });

  try {
    const matched = router.match(method, url.pathname);
    if (!matched) {
      sendNotFound(res, method, url.pathname, id);
      return;
    }

    const body = method === 'POST' || method === 'PUT' || method === 'PATCH' ? await readJsonBody(req) : undefined;

    const result = await matched.handler({ req, res, params: matched.params, query: url.searchParams, body, id });
    sendData(res, 200, result ?? null, id);
  } catch (err) {
    sendError(err, res, id);
  } finally {
    logger.info('Request handled', { id, method, path: url.pathname, ms: Date.now() - started });
  }
}

export function createApiServer() {
  return createServer((req, res) => {
    void handle(req, res);
  });
}

/**
 * Whether this module was executed directly, rather than imported.
 *
 * The entrypoint has to be safe to import, or the test suite cannot reach
 * `createApiServer` without opening a socket.
 *
 * The comparison is on resolved paths because a path containing spaces — which
 * this repository's does — arrives percent-encoded in a URL, so comparing the
 * raw strings would silently never match.
 *
 * `import.meta` is read defensively. The Netlify function is bundled by
 * esbuild, and when the nearest package.json has no `type: module` the bundler
 * emits CommonJS, where `import.meta` is an empty object. Calling
 * `fileURLToPath` on that throws at module load, which takes the whole function
 * down rather than merely skipping the listen.
 */
function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;

  const meta = import.meta as ImportMeta & { url?: string };
  if (typeof meta.url !== 'string' || meta.url.length === 0) return false;

  try {
    return fileURLToPath(meta.url) === path.resolve(entry);
  } catch {
    // A bundled or otherwise unresolvable module URL means "not a direct run".
    return false;
  }
}

if (isDirectRun()) {
  setLogLevel(config.logLevel);

  if (USE_MOCK) {
    logger.warn('Demo mode: serving generated data. No live chain is contacted.', {
      resolvedBy: process.env.DEMO_MODE ? 'DEMO_MODE' : 'USE_LIVE_DATA'
    });
  }

  createApiServer().listen(config.port, config.host, () => {
    logger.info('BlockSense API listening', {
      url: `http://localhost:${config.port}/api/v1`,
      env: config.env,
      data: USE_MOCK ? 'mock' : 'live',
      chains: ['ethereum', 'bnb', 'tron', 'solana', 'bitcoin']
    });
  });
}
