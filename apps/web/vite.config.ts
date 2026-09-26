import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Workspace packages ship TypeScript source rather than a build artefact, so
 * Vite compiles them through the normal pipeline and HMR works across package
 * boundaries. This is the "just-in-time packages" pattern: no build ordering,
 * and editing a component in packages/ui hot-reloads in the running app.
 */
export default defineConfig({
  define: {
    // Explicitly injected so the browser always sees the value even when
    // no .env file is present. Anything that is not "false" is demo mode —
    // a fresh checkout should work with no provider configured.
    'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true')
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@blocksense/shared': r('../../packages/shared/src'),
      '@blocksense/blockchain': r('../../packages/blockchain/src'),
      '@blocksense/transaction-engine': r('../../packages/transaction-engine/src'),
      '@blocksense/intelligence': r('../../packages/intelligence/src'),
      '@blocksense/ui': r('../../packages/ui/src')
    }
  },
  server: {
    port: 5173,
    // The mock transport applies artificial latency, so the default 500ms
    // "slow network" warning is noise rather than signal.
    proxy: {
      '/api': {
        // Must match the API's own default port; 8787 pointed at nothing.
        target: process.env.API_BASE_URL ?? 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          // Vendor payloads that change far less often than the app itself get
          // their own file, so a deploy re-downloads only what changed.
          motion: ['framer-motion'],
          charts: ['recharts'],
          graph: ['@xyflow/react']
        }
      }
    }
  }
});
