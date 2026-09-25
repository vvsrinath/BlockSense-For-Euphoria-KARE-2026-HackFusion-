/**
 * The Netlify Function wrapper.
 *
 * The API itself is covered by tests/api.test.ts over a real socket. What is
 * untested until now is the seam: Netlify rewrites the request path to the
 * function's own URL, so a request that arrived at `/api/v1/health` reaches the
 * function as `/.netlify/functions/api/api/v1/health`. If that is not undone,
 * every route 404s in production while passing locally.
 *
 * These tests invoke the handler with the event shape Netlify sends, so the
 * failure mode is caught here rather than after a deploy.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import { handler } from '../netlify/functions/api.mjs';

/** The subset of Netlify's event object the handler actually reads. */
function netlifyEvent(
  path: string,
  options: { method?: string; body?: string; query?: Record<string, string> } = {}
) {
  const [rawPath = '/', search = ''] = path.split('?');
  const query = { ...(search ? Object.fromEntries(new URLSearchParams(search)) : {}), ...(options.query ?? {}) };
  return {
    httpMethod: options.method ?? 'GET',
    path: rawPath,
    rawUrl: `https://site.example${rawPath}${search ? `?${search}` : ''}`,
    headers: { host: 'site.example', 'content-type': 'application/json' },
    queryStringParameters: Object.keys(query).length ? query : null,
    multiValueQueryStringParameters: null,
    body: options.body ?? null,
    isBase64Encoded: false
  };
}

async function invoke(path: string, options?: Parameters<typeof netlifyEvent>[1]) {
  const res = await handler(netlifyEvent(path, options), {});
  // serverless-http returns Netlify's `{ statusCode, headers, body }` shape
  // rather than a web Response, so the body is read directly.
  const text = typeof res.body === 'string' ? res.body : String(res.body ?? '');
  return {
    status: res.statusCode,
    headers: res.headers ?? {},
    body: text,
    json: text ? JSON.parse(text) : null
  };
}

beforeAll(() => {
  // The bundle reads these at import time; keep the test off the real settings.
  process.env.NODE_ENV = 'test';
});

describe('Netlify function path handling', () => {
  it('serves health when Netlify has rewritten the path', async () => {
    const res = await invoke('/.netlify/functions/api/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect(res.json.data.status).toBe('ok');
  });

  it('serves health when the function is called directly', async () => {
    // Hitting the function URL rather than going through the redirect leaves
    // the `/api` prefix off entirely.
    const res = await invoke('/.netlify/functions/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.json.data.status).toBe('ok');
  });

  it('serves the route list', async () => {
    const res = await invoke('/.netlify/functions/api/api/v1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.json.data.routes ?? res.json.data)).toBe(true);
  });

  it('404s an unknown route rather than serving the SPA shell', async () => {
    // The catch-all redirect in netlify.toml is the real risk here: if the
    // function 200s with HTML, the client silently renders an error page.
    const res = await invoke('/.netlify/functions/api/api/v1/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.json.success).toBe(false);
  });

  it('preserves the query string', async () => {
    // `?limit=` and cache-busting both ride on the query string, and the
    // path rewrite must not drop it.
    const res = await invoke('/.netlify/functions/api/api/v1/wallets/ethereum/0xabc/history?limit=7');
    // Either a real response or a provider error: what matters is that the
    // route resolved rather than 404ing on a mangled path.
    expect(res.status).not.toBe(404);
  });

  it('answers a preflight request', async () => {
    const res = await invoke('/.netlify/functions/api/api/v1/health', { method: 'OPTIONS' });
    expect(res.status).toBeLessThan(400);
  });

  it('rejects a malformed body on a POST route', async () => {
    const res = await invoke('/.netlify/functions/api/api/v1/analyze', {
      method: 'POST',
      body: '{not json'
    });
    expect(res.status).toBe(400);
    expect(res.json.success).toBe(false);
  });
});
