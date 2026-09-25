/**
 * The Netlify configuration, and the one thing that will break the deploy.
 *
 * Netlify reads `netlify.toml` from the site's **base directory**, and a base
 * directory of anything other than the repository root cannot build this
 * project at all: the pnpm lockfile, the workspace manifest, and the functions
 * directory all live above `apps/web`, and a base directory hides them.
 *
 * That is not hypothetical. A previous `apps/web/netlify.toml` was added to
 * support that setting, and Netlify failed the build outright:
 *
 *   Configuration property "functionsDirectory" "../../netlify/functions"
 *   must be inside the repository root directory.
 *
 * So there is exactly one configuration, at the root, and this test fails if a
 * second one appears anywhere else. A stray config in a subdirectory is not
 * harmless — Netlify prefers it and then refuses to build.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(import.meta.dirname, '..');
const root = readFileSync(resolve(repo, 'netlify.toml'), 'utf8');

interface Redirect {
  from: string;
  to: string;
  status: number;
  force?: boolean;
}

/** Minimal reader for the `[[redirects]]` blocks, which is all we compare. */
function redirects(toml: string): Redirect[] {
  return toml
    .split('[[redirects]]')
    .slice(1)
    .map((block) => {
      const get = (key: string) => block.match(new RegExp(`${key}\\s*=\\s*"([^"]*)"`))?.[1];
      const force = /force\s*=\s*true/.test(block);
      return {
        from: get('from') ?? '',
        to: get('to') ?? '',
        status: Number(block.match(/status\s*=\s*(\d+)/)?.[1] ?? 0),
        ...(force ? { force: true } : {})
      };
    });
}

describe('netlify.toml lives only at the repository root', () => {
  it('exists at the root', () => {
    expect(existsSync(resolve(repo, 'netlify.toml'))).toBe(true);
  });

  it('has no second copy anywhere in the repository', () => {
    // Netlify prefers a netlify.toml in the base directory over the root one,
    // so a stray copy in a subdirectory silently takes over and then fails.
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === 'netlify.toml' && full !== resolve(repo, 'netlify.toml')) found.push(full);
      }
    };
    walk(repo);
    expect(found).toEqual([]);
  });

  it('keeps the functions directory inside the repository', () => {
    // The exact property Netlify rejected. A path escaping the build root is
    // rejected at parse time, before any build runs.
    const dir = root.match(/functions\s*=\s*"([^"]*)"/)?.[1];
    expect(dir).toBeTruthy();
    expect(dir!.startsWith('/')).toBe(false);
    expect(dir!.includes('..')).toBe(false);
  });
});

describe('build configuration', () => {
  it('publishes the web build', () => {
    expect(root).toMatch(/publish\s*=\s*"apps\/web\/dist"/);
  });

  it('installs before building', () => {
    expect(root.indexOf('pnpm install')).toBeLessThan(root.indexOf('pnpm build'));
  });

  it('builds the API as well as the web app', () => {
    // The function imports the prebuilt bundle, so building only the frontend
    // leaves apps/api/dist missing and the function fails at import.
    expect(root).toMatch(/command\s*=\s*"pnpm install --frozen-lockfile && pnpm build"/);
  });

  it('pins the Node version the project declares', () => {
    expect(root).toMatch(/NODE_VERSION\s*=\s*"20"/);
  });
});

describe('redirects', () => {
  it('serves the API before the SPA catch-all', () => {
    // Order is load-bearing: the catch-all would otherwise answer /api/v1/health
    // with index.html, and the client would render HTML where it expects JSON.
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

  it('falls back to the SPA shell for everything else', () => {
    const spa = redirects(root).find((r) => r.from === '/*');
    expect(spa?.to).toBe('/index.html');
    expect(spa?.status).toBe(200);
  });
});
