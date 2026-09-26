import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Tests import workspace packages by their public name, exactly as the apps do,
 * so the aliases have to be mirrored here. The path-alias config lives in
 * `config/typescript/base.json`; this is the Vite equivalent.
 */
export default defineConfig({
  define: {
    // The web client picks its transport from this, and the URL-shape tests in
    // `tests/webApiClient.test.ts` assert against the real HTTP paths, so the
    // suite must not silently take the mock branch.
    'import.meta.env.VITE_DEMO_MODE': JSON.stringify('false')
  },
  resolve: {
    // Order matters: Vite matches aliases in the order they are declared, so
    // the subpath must come before the bare package name. These mirror the
    // `exports` map in each package.json; the TS-side equivalent lives in
    // `config/typescript/base.json`.
    alias: [
      { find: '@blocksense/shared', replacement: r('./packages/shared/src') },
      // `react-router-dom` is a dependency of the web app only, so a test file
      // in `tests/` cannot resolve it the way Node would. Point at the very
      // copy the components use — otherwise the app and the test would each get
      // their own React instance and the router would throw about hooks.
      { find: /^react-router-dom$/, replacement: r('./apps/web/node_modules/react-router-dom') },
      { find: '@blocksense/blockchain', replacement: r('./packages/blockchain/src') },
      { find: '@blocksense/transaction-engine', replacement: r('./packages/transaction-engine/src') },
      { find: '@blocksense/intelligence', replacement: r('./packages/intelligence/src') },
      { find: '@blocksense/ui', replacement: r('./packages/ui/src') }
    ]
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    reporters: 'default',
    env: {
      // The API resolves its mode from the environment, and it now defaults to
      // serving generated data. `tests/api.test.ts` is built around live
      // adapters — it installs stubs and asserts on provider failures — so the
      // mode is pinned here instead of depending on whatever `NODE_ENV` the
      // runner happens to set. The generated-data layer is covered separately
      // in `tests/mockData.test.ts`, which asserts on the generators directly
      // and so does not care which mode is active.
      DEMO_MODE: 'false',
      USE_LIVE_DATA: 'true'
    }
  }
});
