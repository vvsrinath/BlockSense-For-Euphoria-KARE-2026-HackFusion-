# Getting started

## Requirements

- **Node 20 or newer.** Check with `node --version`.
- **pnpm 10 or newer.** `corepack enable pnpm`, or `npm install -g pnpm`.

That is all. No database, no Docker, no API keys.

## Install and run

```bash
git clone https://github.com/vvsrinath/BlockSense-For-Euphoria-KARE-2026-HackFusion-.git
cd BlockSense-For-Euphoria-KARE-2026-HackFusion-
pnpm install
pnpm dev
```

Open <http://localhost:5173>.

BlockSense starts in **mock mode**, which means every feature works immediately
against a realistic bundled dataset. Nothing needs to be configured first.

## The two processes

| Command | Service | URL |
| --- | --- | --- |
| `pnpm dev` | Web app | <http://localhost:5173> |
| `pnpm dev:api` | API | <http://localhost:8787> |

Run them in separate terminals. The web app proxies `/api` to the API, so the
browser only ever talks to one origin and there are no CORS problems in
development.

The web app works on its own without the API in mock mode. You need `pnpm dev:api`
for live data, or if you want to call the API directly.

## Try it

1. Land on the landing page and follow the call to action, or
2. Go to **Analyze** and paste the demo transaction hash, or
3. Open any chain card on the home page

A good first stop is a transaction marked with findings, because that shows the
explanation layer doing the work. `pnpm seed:demo` prints which bundled
transactions are the interesting ones.

## Switching to live data

Mock mode is the default so that nobody accidentally burns through a paid API
quota on their first run. When you want real data:

```bash
cp .env.example .env
```

Then edit `.env`:

```bash
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
USE_LIVE_DATA=true
```

Confirm what went live:

```bash
pnpm check:env
```

```
Chain credentials
  Adapters fall back to mock data when a URL is missing.

  ethereum   set / ETHERSCAN_API_KEY: set
  bnb        missing / BSCSCAN_API_KEY: missing
```

Each chain falls back independently, so you can have one live chain and the rest
mocked. `USE_LIVE_DATA` must be `true` for any chain to go live; with it
`false`, an exported RPC URL is deliberately ignored.

Keys are read from the environment and never committed. `.env` is in
`.gitignore`, and `pnpm check:env` prints only whether a variable is set, never
its value.

## Calling the API

```bash
curl localhost:8787/api/chains
```

```bash
curl -X POST localhost:8787/api/analyze \
  -H 'content-type: application/json' \
  -d '{"hash":"0x4a5e...92a3b","chain":"ethereum"}'
```

`GET localhost:8787/api` returns the full route table. The reference is in
[api/README.md](api/README.md).

## Before you push

```bash
pnpm typecheck   # every package and app
pnpm lint        # ESLint across the repository
pnpm test        # 65 tests
pnpm build       # production build
```

All four must pass. See [CONTRIBUTING.md](../CONTRIBUTING.md).

## Troubleshooting

**Port 5173 or 8787 already in use**
Vite will offer the next free port. For the API, set `API_PORT=9000`. If you
change the API port, point the web app at it with `API_BASE_URL`.

**`pnpm: command not found`**
`corepack enable pnpm`, or `npm install -g pnpm`.

**Everything shows mock data**
That is the default. Run `pnpm check:env` to see why, and check that
`USE_LIVE_DATA=true` and the RPC variable are both set.

**"You cannot appear to have installed pnpm" or peer-dependency warnings**
Run `pnpm install`. The repository pins `pnpm@12.6.0` via `packageManager`;
installing a different major can change resolution.

**Build fails on `esbuild` postinstall**
Approve the build script. It is already declared in `pnpm-workspace.yaml`
(`allowBuilds`), so a fresh `pnpm install` should resolve it.

**A page renders blank**
Check the browser console first, then confirm `pnpm typecheck` passes. A type
error in a lazily loaded route is the usual cause.
