# Blockchain Package

Chain connectivity for BlockSense. This package **fetches and normalises**; it
contains no analysis, scoring or presentation logic.

```
blockchain/
├── core/
│   ├── adapter.ts     ← the BlockchainAdapter contract
│   ├── base.ts        ← mock-backed default implementation
│   ├── client.ts      ← transport (mock + JSON-RPC + REST)
│   ├── detect.ts      ← address / hash / block detection
│   ├── errors.ts      ← ProviderError and its HTTP mapping
│   ├── registry.ts    ← chain metadata and explorer links
│   └── resolve.ts     ← builds an adapter from environment config
├── evm/               ← shared EVM machinery
├── ethereum/
├── bnb/
├── tron/
├── solana/
└── bitcoin/
```

## Supported chains

| Chain      | Folder              | Model           | Unit    | Decimals |
| ---------- | ------------------- | --------------- | ------- | -------- |
| Bitcoin    | `bitcoin/`          | UTXO            | block   | 8        |
| Ethereum   | `ethereum/`         | EVM             | block   | 18       |
| BNB Chain  | `bnb/`              | EVM             | block   | 18       |
| TRON       | `tron/`             | DPoS            | block   | 6        |
| Solana     | `solana/`           | Account         | slot    | 9        |

## The adapter interface

Every chain implements `BlockchainAdapter`:

```ts
interface BlockchainAdapter {
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

Because the contract is fixed, `apps/api` and the intelligence layer never
branch on chain — they just call the method.

## Adding a new chain

1. Create the folder, e.g. `packages/blockchain/polygon/`.
2. For an EVM chain, subclass `EvmAdapter` — you need an id, a name, decimals
   and `buildTransaction`. That is usually the whole adapter.
3. For a non-EVM chain, subclass `BaseAdapter` and override only the methods you
   can genuinely answer. Un-overridden methods return safe mock data or throw
   `NOT_IMPLEMENTED`, so a partial adapter is still useful.
4. Register the chain in `core/registry.ts` (metadata + explorer URLs) and
   `core/resolve.ts` (factory + env var names).
5. Add the id to `ChainId` in `packages/shared/src/types/chain.ts` and to
   `SUPPORTED_CHAINS` in `packages/shared/src/constants/index.ts`.
6. Add tests and update `docs/blockchain/`.

Nothing outside this package needs to change.

## Configuration

Adapters read their RPC URL and API key from the environment. See
`.env.example` at the repository root.

| Chain     | RPC variable        | API key variable     |
| --------- | ------------------- | -------------------- |
| Ethereum  | `ETHEREUM_RPC_URL`  | `ETHERSCAN_API_KEY`  |
| BNB       | `BNB_RPC_URL`       | `BSCSCAN_API_KEY`    |
| TRON      | `TRON_RPC_URL`      | `TRON_API_KEY`       |
| Solana    | `SOLANA_RPC_URL`    | —                    |
| Bitcoin   | `BITCOIN_RPC_URL`   | `MEMPOOL_API_KEY`    |

With no variables set, every adapter runs against the mock transport. That is
the default so a contributor can clone and run without credentials.

## Error handling

Adapters throw `ProviderError`, never a raw `fetch` failure. Each error carries a
`code` and the HTTP status the API should return:

| Code                 | Status | Meaning                                |
| -------------------- | ------ | -------------------------------------- |
| `NOT_FOUND`          | 404    | Unknown hash or address                |
| `INVALID_INPUT`      | 400    | Malformed identifier for this chain    |
| `UNSUPPORTED_CHAIN`  | 400    | No adapter registered                  |
| `RATE_LIMITED`       | 429    | Upstream provider throttled us         |
| `UPSTREAM_UNAVAILABLE` | 503  | Provider unreachable or timed out      |
| `RPC_ERROR`          | 502    | Provider returned an error             |
| `NOT_IMPLEMENTED`    | 501    | Adapter does not support this call     |

## Testing an adapter

```ts
import { createAdapter } from '@blocksense/blockchain';

const adapter = createAdapter('polygon');
const tx = await adapter.getTransaction('0xabc…');
```

The mock transport applies a small artificial latency so loading states in the
UI are exercised. Tune it with `configureMockTransport({ latency: 0 })`.
