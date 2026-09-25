# Deploying BlockSense

Everything runs on **Netlify**: the static app and the API both, with no second
host and no environment variable to set.

## How it fits together

| Piece | Where it runs |
| --- | --- |
| `@blocksense/web` | Static build, published to `apps/web/dist` |
| `@blocksense/api` | Netlify Function in `netlify/functions/api.mjs` |

`netlify.toml` redirects `/api/*` to that function. Because both live on one
origin, the browser never makes a cross-origin request, so **`VITE_API_BASE_URL`
is not needed** and `FRONTEND_URL` is irrelevant — the API allowlist only
matters if you host the frontend somewhere else.

```
/api/v1/health  ->  /.netlify/functions/api/api/v1/health  ->  the API
/*               ->  /index.html                           ->  the app
```

## 1. Connect the repository

Point Netlify at this repository. With `netlify.toml` at the repository root,
the build, publish directory, function, and redirects are all picked up
automatically — no settings to enter by hand.

- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Publish directory: `apps/web/dist`
- Node: 20

The build command covers the API as well as the web app, because the function
imports the already-built bundle. Building only the frontend would leave
`apps/api/dist` missing and the function would fail at import.

## 2. Check it

```bash
curl https://<your-site>/api/v1/health
```

Expect `"status":"ok"` with five live chains. Then open the site and confirm a
transaction loads: the network tab should show `/api/v1/...` returning 200
rather than 404.

## 3. Before relying on it

Add your own providers. With nothing configured, every chain uses a public
endpoint, and those are shared and rate limited:

```
ETHEREUM_RPC_URL   BNB_RPC_URL   TRON_API_KEY   MEMPOOL_API_KEY
ETHERSCAN_API_KEY  BSCSCAN_API_KEY   REQUEST_TIMEOUT_MS
```

Run `pnpm check:env` to see what the API resolves at boot. Note that
`ETHERSCAN_API_KEY` also switches on Ethereum and BNB address history, which is
otherwise an explicit `NOT_IMPLEMENTED`.

## 4. Preview the same topology locally

`netlify dev` is the usual tool, but it needs the Netlify CLI. This repository
has a standalone equivalent, so the rewrite and the catch-all can be checked
without installing anything:

```bash
pnpm build
pnpm preview:netlify     # http://localhost:4321
```

It applies the same `/api/*` redirect, invokes the same handler with the same
rewritten path, and serves the SPA catch-all — so if a request works there, it
will work on Netlify.

---

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
- **Ethereum and BNB history needs an explorer key.** A bare node cannot answer
  "everything this address ever did" — `eth_getLogs` needs a block range — so
  `getHistory` uses Etherscan's V2 endpoint, which covers both chains with one
  key. Without it the route returns `NOT_IMPLEMENTED` naming the variable to
  set, rather than an empty timeline that would read as "this wallet has never
  transacted". Balances and single-transaction lookup need no key at all.
- **The public price feed is DefiLlama**, cached for five minutes. A token it
  does not list keeps no `valueUsd` at all rather than being given a zero.
- **Nothing is committed from the public endpoints' perspective** — there is no
  database, and no write path.
