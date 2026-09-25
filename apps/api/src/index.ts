/**
 * The API server.
 *
 * Built on `node:http` with no framework. BlockSense's API is a narrow JSON
 * surface, and a zero-dependency server means `pnpm dev` works immediately
 * after install, which is the property that matters most for a project people
 * are meant to fork and experiment with.
 *
 * The web app is a separate process in development and proxies `/api` here, so
 * the browser only ever talks to one origin.
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
import { createRouter } from './routes/index';

const router = createRouter();

function sendJson(res: ServerResponse, status: number, payload: unknown, id: string): void {
  if (res.headersSent) return;
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'x-request-id': id
  });
  res.end(JSON.stringify(payload));
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const id = (req.headers['x-request-id'] as string | undefined) ?? requestId();
  const started = Date.now();
  const origin = req.headers.origin;
  const method = req.method ?? 'GET';

  cors(origin, res);

  // Preflight never carries a body, so answer it before routing.
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  logger.debug('Request received', { id, method, path: url.pathname });

  try {
    const matched = router.match(method, url.pathname);
    if (!matched) {
      sendJson(res, 404, { error: { code: 'NOT_FOUND', message: `No route for ${method} ${url.pathname}.` } }, id);
      return;
    }

    const body = method === 'POST' || method === 'PUT' || method === 'PATCH'
      ? await readJsonBody(req)
      : undefined;

    const result = await matched.handler({
      req,
      res,
      params: matched.params,
      query: url.searchParams,
      body,
      id
    });

    const status = result === undefined ? 204 : 200;
    sendJson(res, status, result ?? null, id);
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

// Only listen when executed directly, so tests can import `createApiServer`.
// Comparing resolved paths rather than `import.meta.url` matters here: a path
// containing spaces is percent-encoded in the URL, so string comparison would
// silently never match.
const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  setLogLevel(config.logLevel);
  createApiServer().listen(config.port, config.host, () => {
    logger.info('BlockSense API listening', {
      url: `http://localhost:${config.port}/api`,
      env: config.env,
      data: config.useLiveData ? 'live' : 'mock'
    });
  });
}
