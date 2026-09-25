/**
 * Bundle the API for production.
 *
 * The API imports its workspace packages by TypeScript source path
 * (`@blocksense/shared` → `packages/shared/src`), which a plain `node` process
 * cannot load. So the deployment target is a single bundled file rather than
 * compiled output plus a node_modules tree.
 *
 * Everything is inlined so the artifact runs with `node dist/index.js` and
 * nothing else. esbuild reads the tsconfig `paths` for us, so the alias table
 * has one home.
 */

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(root, '../..');

const result = await build({
  entryPoints: [resolve(root, 'src/index.ts')],
  outfile: resolve(root, 'dist/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  // Node 20 is the floor declared in the root package.json.
  target: 'node20',
  // Everything is inlined, including third-party packages, so the deployed
  // artifact is one self-contained file with no node_modules tree to install.
  //
  // The workspace packages reach for dependencies the API server has no other
  // use for — `@blocksense/shared` pulls in a CSS-class merger for its `cn`
  // helper — and pnpm's strict layout will not resolve those from here, so
  // leaving them external produces a bundle that throws ERR_MODULE_NOT_FOUND
  // on boot.
  packages: 'bundle',
  sourcemap: true,
  minify: true,
  // Read `paths` from the package tsconfig rather than repeating them here.
  tsconfig: resolve(root, 'tsconfig.json'),
  logLevel: 'info',
  metafile: true
});

const bytes = Object.values(result.metafile.outputs).reduce((sum, o) => sum + o.bytes, 0);
console.log(`bundled ${(bytes / 1024).toFixed(0)} kB -> apps/api/dist/index.js (repo root: ${repo})`);
