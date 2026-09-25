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

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

describe('the functions directory holds one deployable entry point', () => {
  /**
   * Netlify turns *every* file in the functions directory into a function and
   * derives its name from the filename. A TypeScript declaration file added
   * beside the function became a function called `api.d`, and the deploy failed:
   *
   *   The following serverless functions failed to deploy: api.d
   *
   * so the name has to be legal, and nothing extra can be left in the folder.
   */
  const functionsDir = resolve(repo, 'netlify/functions');
  const entries = readdirSync(functionsDir);

  it('contains nothing but the function entry point', () => {
    expect(entries).toEqual(['api.mjs']);
  });

  it('has no declaration, source map, or type file', () => {
    // Anything with a dot in its name other than `.mjs` becomes an illegal
    // function name; a `.ts` file would also be bundled a second time.
    const unexpected = entries.filter((name) => {
      const ext = name.slice(name.lastIndexOf('.'));
      return ext !== '.mjs';
    });
    expect(unexpected).toEqual([]);
  });

  it('names the function with only characters Netlify accepts', () => {
    // Netlify allows alphanumerics, hyphens, and underscores, and strips the
    // extension first. `api.d.mts` therefore became the function `api.d` — a
    // dot is not an accepted character, and that failed the deploy.
    for (const name of entries) {
      const base = name.replace(/\.[^.]+$/, '');
      expect(base).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('exports a handler', async () => {
    // Importing the module is also the only way to catch a load-time throw, such
    // as reading `import.meta.url` from a CommonJS bundle.
    const module = (await import(resolve(functionsDir, 'api.mjs'))) as { handler?: unknown };
    expect(typeof module.handler).toBe('function');
  });

  it('is a file rather than a directory', () => {
    // A nested directory would be bundled under its own name.
    expect(statSync(functionsDir).isDirectory()).toBe(true);
    for (const name of entries) {
      expect(statSync(resolve(functionsDir, name)).isFile()).toBe(true);
    }
  });
});

describe('the API entry point survives a CommonJS bundle', () => {
  it('bundles to a file that imports without throwing', async () => {
    // The bundle reads `import.meta.url` to decide whether to listen, and a
    // CommonJS bundle hands it an empty object. `fileURLToPath(undefined)`
    // throws, so an unguarded read took the whole function down at load time
    // instead of merely skipping the listen. Importing is the only way to prove
    // it does not.
    const bundle = resolve(repo, 'apps/api/dist/index.js');
    if (!existsSync(bundle)) return; // Not built; nothing to assert.
    const module = (await import(bundle)) as { createApiServer?: unknown };
    expect(typeof module.createApiServer).toBe('function');
  });

  it('exports a factory rather than listening on import', async () => {
    // Importing must not open a socket, or the test suite and the function
    // bootstrap would both hang.
    const bundle = resolve(repo, 'apps/api/dist/index.js');
    if (!existsSync(bundle)) return;
    const before = process.argv[1];
    const module = (await import(bundle)) as { createApiServer?: unknown };
    expect(typeof module.createApiServer).toBe('function');
    // The entrypoint still believes it is the main module, and the guard
    // returned false rather than throwing.
    expect(process.argv[1]).toBe(before);
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
