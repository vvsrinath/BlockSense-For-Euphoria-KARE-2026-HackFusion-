# API reference

Base URL: `http://localhost:8787`

Every response is JSON. Every request may carry an `X-Request-Id` header, which
is echoed in the response and in the server log so a single request can be
traced.

## Response shape

Successful responses are the resource, possibly with sibling metadata:

```json
{
  "chain": "ethereum",
  "transaction": { "...": "..." },
  "explorer": "https://etherscan.io/tx/0x4a5e..."
}
```

Errors are always:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Transaction \"0x4a5e...\" was not found on Ethereum.",
    "chain": "Ethereum"
  }
}
```

Validation failures add field-level detail:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request could not be validated.",
    "details": [{ "path": "hash", "message": "String must contain at least 8 character(s)" }]
  }
}
```

### Status codes

| Status | When |
| --- | --- |
| `200` | Success |
| `204` | Success with no body (CORS preflight) |
| `400` | Malformed parameter, or an unsupported chain |
| `404` | Unknown route, or a hash/address the chain does not have |
| `405` | Known path, wrong method |
| `413` | Request body over 1 MB |
| `422` | Body failed schema validation |
| `429` | Upstream provider rate limit |
| `500` | Unexpected error |
| `501` | The adapter cannot answer this |
| `502` / `503` | The upstream node errored, timed out or is unreachable |

## Chain inference

Every resource route exists in two forms:

- `/api/transaction/:chain/:hash` — authoritative
- `/api/transaction/:hash` — the chain is inferred from the identifier

**Prefer the explicit form.** Inference is genuinely ambiguous: 64 hex
characters are simultaneously a valid Bitcoin txid and a valid TRON hash, and an
EVM address is equally valid on Ethereum and BNB. When you care which chain you
are on, say so.

## Endpoints

### `GET /api`

The route table, so the API is explorable without this document.

### `GET /api/health`

```json
{
  "status": "ok",
  "env": "development",
  "useLiveData": false,
  "chains": [
    { "id": "ethereum", "live": false },
    { "id": "bnb", "live": false }
  ]
}
```

`live` is per chain: adapters fall back to mock data independently, so you can
run one live chain while the rest stay mocked.

### `GET /api/chains`

Chain metadata with block-explorer links and a `live` flag per chain.

### `GET /api/detect?q=<input>&chain=<hint>`

Identifies an arbitrary string. Used by the search box.

| Query | Required | Notes |
| --- | --- | --- |
| `q` | yes | The address, hash or block number |
| `chain` | no | A hint that narrows ambiguous identifiers |

```bash
curl "localhost:8787/api/detect?q=bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
```

```json
{
  "input": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  "kind": "address",
  "chains": ["bitcoin"],
  "label": "Bitcoin address detected",
  "action": "wallet"
}
```

`kind` is one of `address`, `transaction`, `block`, `shortened`, `unknown`.
`shortened` means the input is a truncated identifier and will not be searched —
an investigator who pastes `0x742d...0bEb` needs the full value.

Note that `chains` may contain more than one entry. That is deliberate: it is
the honest answer for an ambiguous identifier.

### `GET /api/transaction/:chain/:hash`

A normalised transaction, plus an explorer link.

### `GET /api/wallet/:chain/:address`

The wallet, its activity and its behavioural DNA.

### `GET /api/wallet/:chain/:address/history?limit=25`

Recent transactions, newest first. `limit` is 1–100.

### `GET /api/wallet/:chain/:address/network?depth=2`

A counterparty graph. `depth` is 1–4 and is capped internally, because an
unbounded traversal of a real blockchain will not terminate in a usable time.

```json
{
  "centerId": "0x742d...",
  "chain": "ethereum",
  "entities": [],
  "links": [],
  "depth": 2,
  "stats": { "entities": 1, "links": 0, "flaggedLinks": 0, "volumeUsd": 0 }
}
```

### `GET /api/asset/:chain/:address`

Asset metadata. Adapters that cannot answer this return `501` with a
`NOT_IMPLEMENTED` code rather than a fabricated placeholder.

### `POST /api/analyze`

The full analysis pipeline. This is the endpoint that matters.

```bash
curl -X POST localhost:8787/api/analyze \
  -H 'content-type: application/json' \
  -d '{"hash":"0x4a5e...92a3b","chain":"ethereum"}'
```

| Field | Required | Notes |
| --- | --- | --- |
| `hash` | yes | 8–256 characters |
| `chain` | no | Omit to infer from the hash shape |
| `focusAddress` | no | Use this wallet as the baseline instead of the sender |

Response:

```json
{
  "chain": "ethereum",
  "explorer": "https://etherscan.io/tx/0x4a5e...",
  "transaction": { "anomaly": { "score": 72, "level": "high", "signals": [], "details": [] } },
  "score": { "score": 72, "level": "high", "contributions": [] },
  "findings": [
    { "level": "high", "title": "Unusual amount", "body": "…", "signalIds": ["amount"] }
  ],
  "headline": "Large transfer compared to this wallet's history.",
  "dna": { "medianUsd": 240, "txPerWeek": 1.2, "traits": [] }
}
```

`focusAddress` matters. An amount is only anomalous relative to a baseline, and
the sender's own history is the best baseline available. When no baseline can be
loaded, the amount detector stays quiet rather than guessing a threshold.

## CORS

`Access-Control-Allow-Origin` is restricted to the configured origins, which
default to `http://localhost:5173` and `http://127.0.0.1:5173`. Override with a
comma-separated `CORS_ORIGINS`. `*` is honoured if you set it explicitly.

## Configuration

All optional. See `.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_PORT` | `8787` | Port to listen on |
| `API_HOST` | `0.0.0.0` | Interface to bind |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn` or `error` |
| `USE_LIVE_DATA` | `false` | `false` forces every adapter to mock data |
| `MOCK_LATENCY` | `120` | Simulated latency in ms for the mock transport |
| `CORS_ORIGINS` | localhost:5173 | Comma-separated allowlist |

`USE_LIVE_DATA=false` overrides any RPC URL present. That is intentional: a
developer who has a key exported locally should not silently start hitting a
paid API during a demo run.

## Extending

The router is `apps/api/src/middleware/router.ts`, the route table is
`apps/api/src/routes/index.ts`, and controllers return plain data with no access
to `res`. Adding an endpoint is one `router.get(...)` line and one handler that
returns an object.

If the API grows streaming, websockets or a large middleware requirement, replace
the router with Fastify or Hono. Only `routes/` and `index.ts` would change —
the services and the packages are framework-agnostic by construction.
