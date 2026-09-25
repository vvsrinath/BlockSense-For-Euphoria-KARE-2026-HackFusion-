# Deploying BlockSense

The app is two deployables, and they have to be deployed separately:

| Piece | What it is | Where it runs |
| --- | --- | --- |
| `@blocksense/web` | Static React build | Netlify (already configured) |
| `@blocksense/api` | Node HTTP service | Any Node host |

The frontend is useless on its own. It calls `/api/v1` on its own origin, and a
static host has no such endpoint, so **the API must be live first**.

## 1. Deploy the API

`render.yaml` is a Render blueprint, so the quickest path is
**New → Blueprint → select this repository**. Render reads the file and does the
rest.

The blueprint builds a single self-contained bundle, so the host needs nothing
but Node and pnpm:

```
build:    pnpm install --frozen-lockfile && pnpm --filter @blocksense/api run build
start:    node apps/api/dist/index.js
health:   /api/v1/health
```

Any Node host works — Render, Railway, Fly.io, Koyeb, or a VM. The only
requirements are Node 20 or newer and a build command that produces
`apps/api/dist/index.js`.

### Settings that must be set

| Variable | Why |
| --- | --- |
| `FRONTEND_URL` | The deployed web origin, e.g. `https://blocksense.netlify.app`. Defaults to `http://localhost:5173`, which will not match the live site, so the browser blocks every request until this is set. A comma-separated list is accepted. |
| `PORT` | Render injects `10000`. Set this only if your host does not. |
| `REQUEST_TIMEOUT_MS` | Governs every provider call. `25000` suits slow public endpoints. |

### Optional: your own providers

With nothing else configured, every chain falls back to a public endpoint. That
works, but those endpoints are shared and rate limited, so requests start
failing under any real use. Setting your own is the difference between a demo
and something dependable:

```
ETHEREUM_RPC_URL   BNB_RPC_URL   TRON_API_KEY   MEMPOOL_API_KEY
ETHERSCAN_API_KEY  BSCSCAN_API_KEY
```

Run `pnpm check:env` to see what the API resolves at boot.

## 2. Point the web app at the API

Set `VITE_API_BASE_URL` on the Netlify site to the API's public URL — the one
ending in `/api/v1`'s host, without `/api/v1` itself, because the client appends
that prefix.

```
VITE_API_BASE_URL=https://blocksense-api.onrender.com
```

Then redeploy. The value is baked in at build time, so an environment change
alone does nothing until a new build runs.

## 3. Verify

```bash
curl https://<api-host>/api/v1/health          # status ok, five chains live
curl https://<web-host>/                        # loads
```

Then, in the browser: open a real transaction, and confirm the network tab shows
`/api/v1/...` requests returning 200 rather than 404.

## Things worth knowing before you rely on this

- **Reports live in process memory.** They are lost on every restart or deploy,
  and two instances will not share them. A database is the fix.
- **Network graphs are one hop wide.** `depth` is validated and capped at 3, but
  expansion currently visits direct counterparties only.
- **Ethereum and BNB have no transaction history yet.** `eth_getLogs` cannot
  answer "everything this address ever did", so those profiles are built from
  balances alone until an explorer/indexer is wired in. Add `ETHERSCAN_API_KEY`
  and `BSCSCAN_API_KEY` if you extend the adapter.
- **The public price feed is DefiLlama**, cached for five minutes. A token it
  does not list keeps no `valueUsd` at all rather than being given a zero.
- **Nothing is committed from the public endpoints' perspective** — there is no
  database, and no write path.
