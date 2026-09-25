/**
 * The BlockSense API, as a Netlify Function.
 *
 * Everything deploys to one host this way: Netlify serves the static app from
 * the same origin that runs this function, so the browser never makes a
 * cross-origin request and `VITE_API_BASE_URL` can stay empty.
 *
 * The API is a normal `node:http` listener, so rather than duplicating its
 * routing the function hands the request straight to it. `serverless-http`
 * bridges Netlify's invocation to that listener.
 *
 * The pre-built bundle is imported rather than the TypeScript source. It is
 * self-contained, so Netlify's bundler has no path aliases to resolve, and the
 * artifact that runs here is byte-for-byte the one `pnpm build` verified.
 */

import serverless from 'serverless-http';
import { createApiServer } from '../../apps/api/dist/index.js';

/**
 * Put the request path back into the shape the router expects.
 *
 * Netlify rewrites the path to the function's own URL, so a request that
 * arrived at `/api/v1/health` reaches the function as
 * `/.netlify/functions/api/api/v1/health`. Invoking the function directly adds
 * one more layer. Both are normalised here, and the query string is left alone
 * because the cache-busting and `?limit=` parameters depend on it.
 */
function normalisePath(url) {
  if (!url) return '/api/v1/health';

  // Drop the function mount point, with or without a name.
  let path = url.replace(/^\/\.netlify\/functions\/[^/]+/, '');

  // A direct invocation of the function yields `/v1/health`, which is the API
  // minus its prefix. Put the prefix back rather than 404.
  if (!path.startsWith('/api')) {
    path = `/api${path.startsWith('/') ? path : `/${path}`}`;
  }

  return path || '/api';
}

// Created once at module scope so warm invocations reuse the server rather
// than rebuilding it per request.
const server = createApiServer();
const [listener] = server.listeners('request');

const bridge = serverless((req, res) => {
  req.url = normalisePath(req.url);
  listener(req, res);
});

export const handler = async (event) => bridge(event, {});
export default handler;
