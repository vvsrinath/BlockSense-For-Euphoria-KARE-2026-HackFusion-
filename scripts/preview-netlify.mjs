/**
 * Preview the production topology on one port.
 *
 * Netlify serves the static app and the API function from the same origin, and
 * `VITE_API_BASE_URL` is left empty because of that. Reproducing it locally
 * needs both halves behind one origin, which `pnpm dev` does not do: the Vite
 * server has no idea Netlify rewrites `/api/*` into a function invocation.
 *
 * So this stands in for Netlify: it applies the same redirect rule, calls the
 * same handler with the same rewritten path, and serves the built app for
 * everything else, including the SPA catch-all. If a request works here it will
 * work on Netlify.
 *
 * Run `pnpm build` first — this serves `apps/web/dist` and imports the built
 * API bundle. Then `pnpm preview:netlify` and open the printed URL.
 */

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(repo, 'apps/web/dist');
const port = Number.parseInt(process.env.PREVIEW_PORT ?? '4321', 10);

/** The function mount point, matching the redirect in netlify.toml. */
const FUNCTION_MOUNT = '/.netlify/functions/api';

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`No build found at ${dist}. Run \`pnpm build\` first.`);
  process.exit(1);
}

const { handler } = await import(join(repo, 'netlify/functions/api.mjs'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

/** Resolve a URL path to a file inside dist, refusing to escape it. */
function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0]));
  if (clean.includes('..')) return null;
  const candidate = join(dist, clean);
  if (!candidate.startsWith(dist)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}

const server = createServer(async (req, res) => {
  const url = req.url ?? '/';

  if (url.startsWith('/api/')) {
    const [path = '/', search = ''] = url.split('?');
    const event = {
      httpMethod: req.method ?? 'GET',
      // Netlify rewrites the path to the function's own URL. Reproducing that
      // exactly is the point of this harness.
      path: `${FUNCTION_MOUNT}${path}`,
      rawUrl: `http://localhost:${port}${url}`,
      headers: req.headers,
      queryStringParameters: Object.fromEntries(new URLSearchParams(search)),
      multiValueQueryStringParameters: null,
      body: null,
      isBase64Encoded: false
    };

    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      event.body = Buffer.concat(chunks).toString('utf8');
    }

    try {
      const out = await handler(event, {});
      res.writeHead(out.statusCode, out.headers ?? {});
      res.end(out.body);
    } catch (err) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: String(err) } }));
    }
    return;
  }

  // Static file, else the SPA catch-all — the same order netlify.toml uses.
  const file = resolveFile(url) ?? join(dist, 'index.html');
  const extension = file.slice(file.lastIndexOf('.'));
  res.writeHead(200, { 'content-type': TYPES[extension] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, () => {
  console.log(`\n  BlockSense, as Netlify serves it`);
  console.log(`  app   http://localhost:${port}/`);
  console.log(`  api   http://localhost:${port}/api/v1/health\n`);
});
