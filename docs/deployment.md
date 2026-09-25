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

Point Netlify at this repository. The build, publish directory, function, and
redirects are picked up automatically — no settings to enter by hand.

- **Base directory: `/`** (the repository root). This is the recommended setting
  and the one the root `netlify.toml` is written for.
- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Publish directory: `apps/web/dist`
- Node: 20

### If your site already has its base directory set to `apps/web`

Netlify only reads `netlify.toml` from the base directory, so a site pointed at
`apps/web` ignores the root file completely and falls back to whatever is in the
dashboard. That usually means no build command and no function, which looks like
a build that randomly fails.

There is a configuration for that case at `apps/web/netlify.toml`, written
relative to its own directory, so a site with that base directory deploys
correctly as-is. `tests/netlifyConfig.test.ts` asserts the two files declare the
same redirects in the same order, so they cannot drift.

Either way, setting the base directory back to `/` is the cleaner fix.

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
