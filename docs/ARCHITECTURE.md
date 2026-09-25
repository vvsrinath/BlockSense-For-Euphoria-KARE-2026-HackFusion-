# Architecture

This document explains why BlockSense is split the way it is. For how to *use*
it, see the [README](../README.md).

## The shape of the problem

Blockchain analysis has three annoying properties, and each one drove a
decision in this codebase.

**Chains disagree about everything.** Bitcoin is UTXO-based with many inputs
and outputs; EVM chains are account-based with a single sender; Solana has
slots rather than blocks and nine decimals rather than eighteen. TRON charges
energy, not gas. If chain knowledge leaks into the analysis code, adding a chain
becomes a rewrite.

**The interesting numbers are too big.** Token amounts in base units routinely
exceed `Number.MAX_SAFE_INTEGER`. A JavaScript `number` cannot represent
`9007199254740993` wei.

**Users need an explanation, not a number.** "Risk score: 72" is not an answer
to "should I be worried?" The product's value is turning evidence into a
sentence a person can act on.

## Package boundaries

Each boundary below exists to make one of those problems someone else's problem.

### `@blocksense/shared` — the vocabulary

Types, zod schemas, constants and formatters used by two or more packages.
`Transaction` is the central type: once a chain adapter has produced one,
nothing downstream needs to know which chain it came from.

This package has no dependencies beyond zod, which is what makes it safe for
every other package to import.

### `@blocksense/blockchain` — chain connectivity

Owns `BlockchainAdapter`, the interface every chain implements:

```ts
export interface BlockchainAdapter {
  readonly id: ChainId;
  readonly name: string;
  readonly nativeSymbol: string;
  readonly isLive: boolean;

  getTransaction(hash: string): Promise<Transaction>;
  getWallet(address: string): Promise<Wallet>;
  getBalances(address: string): Promise<Balance[]>;
  getHistory(address: string, options?: HistoryOptions): Promise<Transaction[]>;
  getAsset(identifier: string): Promise<Asset>;
  getTip(): Promise<ChainTip>;
}
```

Two properties are deliberate:

- **Adapters must not analyse.** No adapter computes a risk score. That
  responsibility belongs to `@blocksense/intelligence`, which can then evolve
  without touching five adapters.
- **Every method has a mock-backed default.** `BaseAdapter` returns structurally
  valid empty data, so a new adapter only implements what it can genuinely
  answer. An adapter that cannot answer `getAsset` throws `NOT_IMPLEMENTED`
  honestly rather than inventing a value.

The package runs in both the browser and Node, so it may not touch `window`,
`document` or `localStorage` without a guard. That constraint is why the
transport layer lives in `core/client.ts` and reads configuration through a
small `env()` helper instead of assuming a bundler.

### `@blocksense/transaction-engine` — interpretation

Turns chain-native data into the shared `Transaction` type:

```
raw chain data → parse → amount → assets → normalise → Transaction
```

**Amounts are bigint from end to end.** `resolveAmount` takes a base-unit string
and returns a decimal string, performing the division as integer arithmetic:

```ts
resolveAmount({ raw: '1500000000000000000', decimals: 18 }).amount // '1.5'
```

No `parseFloat`, no `Number`, no intermediate. This is the single most
important invariant in the codebase.

**Ledger semantics are data, not code branches.** `LEDGER_SEMANTICS` describes
each chain's execution model as a record — UTXO or account, block or slot, how
many outputs, whether swaps are grouped. Code branches on that record rather
than on `if (chain === 'bitcoin')`, so adding a chain is a data change.

### `@blocksense/intelligence` — the analysis

```
signals → scoring → explanations
activity → behavioural DNA
counterparties → relationships → graph
timestamps → temporal patterns
```

Completely headless: no React, no CSS, no network. This is what lets the
browser, the API and the test suite all produce the same answer, and it is why
the package can be extracted later without a rewrite.

An anomaly is a **signal**, not a boolean. Each detector returns
`AnomalySignal[]` with its own level and a human-readable detail, and the scorer
reduces them:

```ts
const signals = detectAll(transaction, context);
const score = scoreSignals(signals);
```

`context` carries the wallet's baseline — median transfer, transactions per
week. This is why an amount is only ever described as unusual *relative to
something*: `50 ETH` is unremarkable for a whale and alarming for an account
that has only ever moved dust. With no baseline, the amount detector stays quiet
rather than guessing a threshold.

Two details worth knowing:

- `maxLevel` breaks the `info`/`normal` severity tie explicitly. Both are
  severity 0, and without an explicit tie-break a reduction over signals would
  depend on their order.
- `transactionsPerWeek` measures to *now*, not to the last observed
  transaction, so a dormant wallet reads as dormant rather than as busy.

### `@blocksense/ui` — the design system

Components and visual tokens (`levelStyles`, `nodeKindStyles`), nothing else. No
fetching, no business rules.

The split of `levelStyles` out of `@blocksense/intelligence` is worth calling
out. Icons and Tailwind class strings are presentation, and a headless analysis
package should not know about either. The intelligence package exposes the
semantic `levelLabel()`; the UI package owns what "high" actually looks like.
Restyling the product means editing one package rather than grepping the app for
hardcoded class strings.

### `apps/web` — the interface

React 18, Vite, React Router. Owns routing, pages and state.

### `apps/api` — the same product over HTTP

Controllers validate and delegate; `services/` holds the only code that knows how
an adapter, the engine and the intelligence layer fit together. Validation
reuses `@blocksense/shared`'s zod schemas, so the browser and the API reject the
same malformed input.

The server is `node:http` with no framework. The API surface is a narrow set of
JSON endpoints, and a zero-dependency server means `pnpm install && pnpm dev:api`
works immediately. If the API grows streaming or websockets, only `routes/` and
`index.ts` would change.

## Just-in-time packages

Workspace packages export **TypeScript source**, not a build artefact:

```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

Vite, tsx, vitest and `tsc` all compile it as they go. Consequences:

- No build step, no build ordering, no stale `dist/`.
- Editing a component in `packages/ui` hot-reloads in the running app.
- Adding a package means creating a folder — nothing to wire up.

The trade-off is that a bundler must be able to compile TypeScript from a
dependency, which Vite does. This would not work for a library published to npm,
which is why these packages are all `"private": true`.

TypeScript **path aliases** are configured in `config/typescript/base.json` and
mirrored in `apps/web/vite.config.ts` and `vitest.config.ts`. Project references
were rejected because they require emit, which contradicts shipping source.

## Error handling

Adapters throw `ProviderError`, never a raw `fetch` failure. Each error code
carries its own HTTP status:

| Code | Status | Meaning |
| --- | --- | --- |
| `NOT_FOUND` | 404 | The hash or address does not exist |
| `INVALID_INPUT` | 400 | The identifier is malformed for that chain |
| `UNSUPPORTED_CHAIN` | 400 | No adapter is registered |
| `RATE_LIMITED` | 429 | The upstream provider is throttling |
| `RPC_ERROR` | 502 | The node returned an error response |
| `UPSTREAM_UNAVAILABLE` | 503 | The node timed out or is unreachable |
| `NOT_IMPLEMENTED` | 501 | The adapter genuinely cannot answer |

`apps/api/src/middleware/errors.ts` maps these onto JSON without knowing which
chain was involved, which is why adding a chain never touches the HTTP layer.

## Testing strategy

Four suites, chosen to protect the properties that are expensive to get wrong:

- `tests/amount.test.ts` — bigint arithmetic and the exactness guarantee
- `tests/scoring.test.ts` — score band boundaries, so a threshold change cannot
  silently reclassify risk
- `tests/detect.test.ts` — identifier detection, including the cases that are
  genuinely ambiguous
- `tests/api.test.ts` — the real server on an ephemeral port, exercising routing,
  validation, services and error mapping without mocks

The API suite is end-to-end on purpose. A router test that mocks the service
layer cannot catch a route that is registered but unreachable, which is the
failure mode that actually occurs.

## Known limitations

Honest about what is not finished:

- Adapters ship with mock-backed implementations. Only Ethereum and BNB make
  real JSON-RPC calls when an RPC URL is set; TRON, Solana and Bitcoin have the
  structure but not the live indexing. `isLive` reports the truth, and
  `getAsset` throws `NOT_IMPLEMENTED` rather than inventing data.
- The web app reads from bundled mock data rather than the API. The API is a
  complete alternative front end, not the app's backing store.
- There is no persistence. The watchlist lives in `localStorage`.
- Scoring weights are hand-tuned against the demo dataset, not calibrated
  against labelled real-world cases. They are documented and adjustable in
  `packages/intelligence/src/scoring/score.ts`.
