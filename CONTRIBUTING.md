# Contributing to BlockSense

Thanks for your interest. BlockSense is a hackathon project and contributions
are genuinely welcome — especially new chains, which are the clearest way to
make it more useful.

## Quick start

```bash
pnpm install
pnpm dev
```

Full setup, including live data, is in
[docs/getting-started.md](docs/getting-started.md).

## The four commands that matter

Run these before every push:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

All four must pass. CI runs exactly these, so anything that passes locally will
pass there.

## Where to put your code

```
apps/web/          pages, routing, state
apps/api/          the HTTP API
packages/shared/   types, schemas, constants          (no logic)
packages/blockchain/       chain adapters              (no analysis)
packages/transaction-engine/  parsing and amounts     (no scoring, ever)
packages/intelligence/     signals and scoring        (no React, no I/O)
packages/ui/               components and tokens      (no data fetching)
```

Two boundaries cause most merge conflicts and are worth stating explicitly:

- **Adapters do not analyse.** No scoring in `packages/blockchain`.
- **`@blocksense/intelligence` is headless.** No React, no CSS, no network
  calls. If you need to show something, return a label and let
  `packages/ui` decide what it looks like.

The reasoning behind each boundary is in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Adding a chain

The most valuable contribution. Follow
[docs/blockchain/adding-a-chain.md](docs/blockchain/adding-a-chain.md) — it
should take under an hour, and no file outside your new folder and the registries
needs to change.

## Pull requests

1. Branch from `main`: `git checkout -b your-branch`
2. Make the change
3. Run the four commands
4. Open a PR describing what changed and why

Keep the diff focused. A PR that reformats unrelated files is hard to review and
will be asked to split.

## Code style

Prettier and ESLint decide formatting; do not hand-format. The rules that are
not stylistic are the ones to respect:

- **Amounts are `bigint`, always.** Base units in, decimal string out. Never
  `parseFloat` a token amount. `tests/amount.test.ts` enforces this.
- **Type-only imports are explicit.** `import type { Foo }`, which
  `verbatimModuleSyntax` enforces.
- **Adapters throw `ProviderError`**, never a raw `fetch` failure, so the API
  can map it to a status code without knowing the chain.
- **Comments explain why, not what.** The codebase already documents the
  non-obvious decisions; a comment restating the code is noise.

## Tests

New behaviour needs a test. The existing suites protect the properties that are
expensive to get wrong:

| File | Protects |
| --- | --- |
| `tests/amount.test.ts` | bigint exactness |
| `tests/scoring.test.ts` | risk band boundaries |
| `tests/detect.test.ts` | identifier detection, including ambiguity |
| `tests/api.test.ts` | routing, validation and error mapping, end to end |

If you add a chain, add a detection test for its identifier format and an amount
test if its decimal count is unusual.

## Reporting bugs

Open an issue with what you did, what you expected, what happened, and your Node
and pnpm versions. If it is a visual bug, a screenshot helps enormously.

## Security

Do not open a public issue for a vulnerability. See
[SECURITY.md](SECURITY.md).

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
