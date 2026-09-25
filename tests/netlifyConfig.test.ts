/**
 * The two Netlify configurations must agree.
 *
 * Netlify reads `netlify.toml` from the site's base directory, so a site
 * pointed at `apps/web` never sees the root file. Both exist so the base
 * directory is not something you have to get right, which means they can drift
 * apart — and a drifted redirect order or publish path is a broken deploy that
 * only shows up after a build.
 *
 * These tests are the guard rail.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(import.meta.dirname, '..');
const root = readFileSync(resolve(repo, 'netlify.toml'), 'utf8');
const web = readFileSync(resolve(repo, 'apps/web/netlify.toml'), 'utf8');

interface Redirect {
  from: string;
  to: string;
  status: number;
  force?: boolean;
}

/** Minimal reader for the `[[redirects]]` blocks, which is all we compare. */
function redirects(toml: string): Redirect[] {
  const blocks = toml.split('[[redirects]]').slice(1);
  return blocks.map((block) => {
    const get = (key: string) => {
      const match = block.match(new RegExp(`${key}\\s*=\\s*"([^"]*)"`));
      return match?.[1];
    };
    const status = Number(block.match(/status\s*=\s*(\d+)/)?.[1] ?? 0);
    const force = /force\s*=\s*true/.test(block);
    return { from: get('from') ?? '', to: get('to') ?? '', status, ...(force ? { force: true } : {}) };
  });
}

describe('netlify.toml, root variant', () => {
  it('publishes the web build from the repository root', () => {
    expect(root).toMatch(/publish\s*=\s*"apps\/web\/dist"/);
  });

  it('builds the API as well as the web app', () => {
    // The function imports the prebuilt bundle, so building only the frontend
    // leaves apps/api/dist missing and the function fails at import.
    expect(root).toMatch(/pnpm build/);
  });

  it('installs before building', () => {
    expect(root.indexOf('pnpm install')).toBeLessThan(root.indexOf('pnpm build'));
  });

  it('points at the functions directory', () => {
    expect(root).toMatch(/functions\s*=\s*"netlify\/functions"/);
  });

  it('pins the Node version the project declares', () => {
    expect(root).toMatch(/NODE_VERSION\s*=\s*"20"/);
  });
});

describe('netlify.toml, apps/web variant', () => {
  it('publishes relative to its own base directory', () => {
    expect(web).toMatch(/publish\s*=\s*"dist"/);
  });

  it('installs and builds from the workspace root', () => {
    // Installing from apps/web would fetch only that package's dependencies.
    expect(web).toMatch(/cd \.\.\/\.\./);
  });

  it('reaches the functions directory from two levels down', () => {
    expect(web).toMatch(/functions\s*=\s*"\.\.\/\.\.\/netlify\/functions"/);
  });
});

describe('the two configurations agree', () => {
  it('declares identical redirects', () => {
    expect(redirects(web)).toEqual(redirects(root));
  });

  it('serves the API before the SPA catch-all', () => {
    // Order is load-bearing. The catch-all would otherwise answer /api/v1/health
    // with index.html.
    const rules = redirects(root);
    const api = rules.findIndex((r) => r.from === '/api/*');
    const spa = rules.findIndex((r) => r.from === '/*');
    expect(api).toBeGreaterThanOrEqual(0);
    expect(spa).toBeGreaterThan(api);
  });

  it('forces the API rewrite so the static handler cannot claim it', () => {
    const api = redirects(root).find((r) => r.from === '/api/*');
    expect(api?.force).toBe(true);
    expect(api?.to).toBe('/.netlify/functions/api/:splat');
  });

  it('pins the same Node version in both', () => {
    const version = (toml: string) => toml.match(/NODE_VERSION\s*=\s*"([^"]*)"/)?.[1];
    expect(version(web)).toBe(version(root));
  });
});
