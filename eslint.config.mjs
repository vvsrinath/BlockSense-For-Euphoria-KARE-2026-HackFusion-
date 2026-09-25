// The real configuration lives in config/eslint so it sits alongside the rest of
// the shared tooling. ESLint only auto-discovers a file at the repository root,
// so this re-export is the bridge.
export { default } from './config/eslint/index.mjs';
