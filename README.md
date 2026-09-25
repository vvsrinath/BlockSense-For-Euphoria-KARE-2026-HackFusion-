# BlockSense

**Multi-chain blockchain intelligence for people who need to trust a number.**

Paste an address or a transaction hash. BlockSense works out which chain it
belongs to, reconstructs what happened, and explains what is unusual about it in
plain language. Five chains, one interface, no API key required to try it.

```bash
git clone https://github.com/vvsrinath/BlockSense-For-Euphoria-KARE-2026-HackFusion-.git
cd BlockSense-For-Euphoria-KARE-2026-HackFusion-
pnpm install
pnpm dev
```

That is the whole setup. BlockSense starts in **mock mode** with realistic
bundled data, so you get a working product before you have configured anything.

---

## Why it is built this way

Three decisions shape the entire codebase.

**1. Adding a chain must not touch anything else.**
Each chain implements one interface, `BlockchainAdapter`
(`packages/blockchain/src/core/adapter.ts`). Everything downstream — the
transaction engine, the scoring, the UI — consumes the shared `Transaction` type
and has no idea which chain produced it. Polygon, Base, Arbitrum and Avalanche
are all EVM chains, so they are ~30 lines each on top of `EvmAdapter`. See
[adding a chain](docs/blockchain/adding-a-chain.md).

**2. Money is never a floating-point number.**
Token amounts are handled as `bigint` in base units and only become a decimal
string at the edge, where a human reads them. `1e18` wei is exactly `1 ETH` and
exactly `0.000000000000000001` in this codebase. A balance that is off by a
rounding error is worse than no balance, so `tests/amount.test.ts` is the most
important test file in the repository.

**3. The analysis is headless.**
`@blocksense/intelligence` has no React, no CSS and no network calls. The same
scoring code runs in the browser, in the API and in tests, which is why the
product can never show a score the API would disagree with.

---

## Architecture

```
apps/
  web/          React 18 + Vite + TypeScript interface
  api/          Node HTTP API (zero framework dependencies)
packages/
  shared/               Types, zod schemas, constants, formatters
  blockchain/           Chain adapters. Ethereum, BNB, TRON, Solana, Bitcoin
  transaction-engine/   Raw chain data → a normalised Transaction
  intelligence/         Signals → scoring → explanations, graphs, DNA
  ui/                   The design system
```

Data flows one way, and each package knows only the one below it:

```
chain adapter → transaction engine → intelligence → ui → web app
                                                      ↘ api
```

```
packages/blockchain      fetch and normalise.  No analysis.
packages/transaction-engine   parse, convert amounts, normalise.  No scoring.
packages/intelligence     detect signals, score, explain.  No React, no I/O.
packages/ui               components and visual tokens.  No data fetching.
apps/web                  routes, pages, state.
apps/api                  the same analysis over HTTP, for any client.
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the reasoning behind the
package boundaries and the "just-in-time packages" approach.

---

## Commands

| Command | What it does |
| --- | --- |
| `pnpm install` | Install everything. The only required step. |
| `pnpm dev` | Web app on <http://localhost:5173> |
| `pnpm dev:api` | API on <http://localhost:8787> |
| `pnpm build` | Production build of the web app, then a typecheck of the API |
| `pnpm typecheck` | Type-check every package and app at once |
| `pnpm lint` | ESLint across the repository |
| `pnpm test` | 65 tests: amounts, scoring, detection, and the API end to end |
| `pnpm check:env` | Report which chains can reach live data |
| `pnpm seed:demo` | Run the demo transactions through the real analysis pipeline |
| `pnpm setup` | Create `.env` from the example and print next steps |
| `pnpm format` | Format the repository with Prettier |

The web app proxies `/api` to the API during development, so run both with
`pnpm dev` and `pnpm dev:api` in separate terminals. The web app works on its
own in mock mode; the API is needed for live data or an external client.

---

## Live data

Mock mode is the default and needs no credentials. To use a real node, copy
`.env.example` to `.env`, add an RPC URL, and set `USE_LIVE_DATA=true`:

```bash
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
USE_LIVE_DATA=true
```

```bash
pnpm check:env   # confirms which chains went live
```

Adapters fall back to mock data independently, so you can run one live chain
while the rest stay mocked. Keys are read from the environment and are never
committed or logged — `pnpm check:env` prints only whether a variable is set,
never its value.

---

## The API

Every analysis the interface can perform is available over HTTP, so BlockSense
is usable without the UI.

```bash
curl -X POST localhost:8787/api/analyze \
  -H 'content-type: application/json' \
  -d '{"hash":"0x4a5e...92a3b","chain":"ethereum"}'
```

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api` | The route table |
| `GET` | `/api/health` | Status and live-vs-mocked state per chain |
| `GET` | `/api/chains` | Chain metadata and explorer links |
| `GET` | `/api/detect?q=` | Identify an address, hash or block number |
| `GET` | `/api/transaction/:chain/:hash` | A normalised transaction |
| `GET` | `/api/wallet/:chain/:address` | A wallet and its behavioural DNA |
| `GET` | `/api/wallet/:chain/:address/network` | A bounded counterparty graph |
| `GET` | `/api/asset/:chain/:address` | Asset metadata |
| `POST` | `/api/analyze` | Full analysis with score and findings |

Every route also exists without the `:chain` segment, in which case the chain is
inferred from the identifier. That inference is genuinely ambiguous — the same
64 hex characters are a valid Bitcoin txid and a valid TRON hash — so the
`/api/detect` response always reports every plausible chain rather than guessing
silently. Full reference in [docs/api](docs/api/README.md).

---

## Contributing

BlockSense is a hackathon project, and the clearest way to improve it is to add
a chain. [docs/blockchain/adding-a-chain.md](docs/blockchain/adding-a-chain.md)
is a step-by-step guide that should take under an hour.

Before opening a pull request:

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) first.

---

## Acknowledgements

The interface was designed with
[Magic Patterns](https://magicpatterns.com) from
[this design](https://www.magicpatterns.com/c/565w3ztrhtbgaicb2mkwl2).

Built for Euphoria · KARE HackFusion 2026.

## License

[MIT](LICENSE)
