# Changelog

All notable changes to BlockSense are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [0.1.0] — 2026-09-25

The first working release. Built for Euphoria · KARE HackFusion 2026.

### Added

**Monorepo**

- pnpm workspace with two apps and five packages, configured through
  `pnpm-workspace.yaml` and `config/typescript/`.
- Workspace packages ship TypeScript source rather than build artefacts, so
  there is no build step and no build ordering. HMR works across package
  boundaries.
- Root `pnpm typecheck` covers every package, app, script and test in one pass.

**Analysis engine**

- `@blocksense/blockchain`: the `BlockchainAdapter` contract plus adapters for
  Ethereum, BNB Chain, TRON, Solana and Bitcoin. Every method has a mock-backed
  default, so an adapter implements only what it can genuinely answer.
- `ProviderError` with a code-to-status mapping, shared by every adapter and
  mapped onto HTTP without the API knowing which chain was involved.
- `@blocksense/transaction-engine`: raw chain data to a normalised
  `Transaction`, with all amount arithmetic on `bigint` base units.
- Ledger semantics expressed as data rather than chain-name branches, so a new
  chain is a record rather than a rewrite.
- `@blocksense/intelligence`: five anomaly detectors, weighted scoring, plain
  English findings, behavioural DNA, temporal burst detection and a bounded
  counterparty graph. Fully headless — no React, no CSS, no network.

**API**

- `apps/api`: a working `node:http` server with no framework dependency.
- `GET /api/health`, `/api/chains`, `/api/detect`, `/api/transaction/:chain/:hash`,
  `/api/wallet/:chain/:address` (with `/history` and `/network`), and
  `/api/asset/:chain/:address`.
- `POST /api/analyze` for the full pipeline.
- Every resource route also exists without `:chain`, inferring it from the
  identifier. `/api/detect` reports every plausible chain rather than guessing.
- Validation shared with the browser through `@blocksense/shared`'s zod
  schemas, producing 422 responses with field-level detail.
- Request correlation ids, a levelled logger, CORS allowlist and 1 MB body cap.

**Interface**

- 17-component design system in `@blocksense/ui`, with visual tokens for anomaly
  levels and node kinds kept separate from the analysis package.
- Transaction analysis, wallet DNA, network graph, asset and watchlist views.
- Tailwind configured to scan the packages directory, so a class used inside
  `packages/ui` is not purged from the build.

**Tooling**

- ESLint 9 flat config split by environment, including a domain rule set for the
  amount arithmetic.
- Prettier configuration in `config/prettier`, referenced from the root.
- 65 tests: bigint exactness, score band boundaries, identifier detection
  including genuinely ambiguous cases, and the API end to end on a real socket.
- `pnpm setup`, `pnpm check:env` and `pnpm seed:demo`.
- Mock mode as the default, so the product runs with no configuration and no
  risk of burning a paid API quota on a first run.

### Fixed

Issues found while restructuring the original single-package application:

- `packages/shared` re-exported its schemas from a file that did not exist;
  they now live in `src/schemas/` and are exported once.
- Adapters read `this.id` inside their own constructor arguments, before `super()`
  had run.
- `EvmAdapter` was imported as a type while being extended as a class.
- `BaseAdapterOptions` was declared in two modules and re-exported from both,
  making the package's public surface ambiguous.
- `detectInput` changed its label for an explicit chain hint but not its
  `chains` array, so the two disagreed.
- `maxLevel` resolved the zero-severity tie between `info` and `normal` by
  argument order, making any reduction over signals order-dependent.
- `transactionsPerWeek` measured to the last observed transaction, so a wallet
  dormant for a year read as high-frequency. It now measures to now.
- `normalizeTransaction` filtered transfers by testing the whole transaction
  rather than each transfer, so a multi-transfer transaction was never filtered.
- Network graph nodes labelled with a CSS-style token instead of the semantic
  node-kind label.
- Tailwind purged every class used inside `packages/ui`, because the content
  glob only scanned `apps/web/src`.

### Known limitations

- Only Ethereum and BNB make real JSON-RPC calls. TRON, Solana and Bitcoin have
  the adapter structure but not live indexing; `isLive` reports this honestly.
- The web app reads bundled mock data rather than the API. The API is a
  complete alternative front end, not the app's backing store.
- No persistence. The watchlist lives in `localStorage`.
- Scoring weights are hand-tuned against the demo dataset, not calibrated
  against labelled real-world cases.
