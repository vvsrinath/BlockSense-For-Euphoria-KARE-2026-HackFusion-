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
    alias: {
      '@blocksense/shared': r('./packages/shared/src'),
      '@blocksense/blockchain': r('./packages/blockchain/src'),
      '@blocksense/transaction-engine': r('./packages/transaction-engine/src'),
      '@blocksense/intelligence': r('./packages/intelligence/src'),
      '@blocksense/ui': r('./packages/ui/src')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: 'default'
  }
});
