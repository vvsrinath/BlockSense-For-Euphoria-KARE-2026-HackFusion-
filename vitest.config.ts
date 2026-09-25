import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Tests import workspace packages by their public name, exactly as the apps do,
 * so the aliases have to be mirrored here. The path-alias config lives in
 * `config/typescript/base.json`; this is the Vite equivalent.
 */
export default defineConfig({
  resolve: {
    // Order matters: Vite matches aliases in the order they are declared, so
    // the subpath must come before the bare package name. These mirror the
    // `exports` map in each package.json; the TS-side equivalent lives in
    // `config/typescript/base.json`.
    alias: [
      { find: '@blocksense/shared', replacement: r('./packages/shared/src') },
      { find: '@blocksense/blockchain', replacement: r('./packages/blockchain/src') },
      { find: '@blocksense/transaction-engine', replacement: r('./packages/transaction-engine/src') },
      { find: '@blocksense/intelligence', replacement: r('./packages/intelligence/src') },
      { find: '@blocksense/ui', replacement: r('./packages/ui/src') }
    ]
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: 'default'
  }
});
