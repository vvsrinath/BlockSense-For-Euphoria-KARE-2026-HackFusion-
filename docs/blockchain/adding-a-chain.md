# Adding a chain

This is the highest-leverage contribution to BlockSense, and it should take
under an hour. The architecture is built so that a chain is a self-contained
addition: no other file needs to change.

## What you are actually adding

One adapter class. The transaction engine, scoring, explanations, network graph
and every page in the UI already work with the shared `Transaction` type, so
they begin supporting your chain the moment the adapter returns that type.

## 1. Add the chain to the type and the registry

`packages/shared/src/types/chain.ts`:

```ts
export type ChainId = 'bitcoin' | 'ethereum' | 'bnb' | 'tron' | 'solana' | 'polygon';
```

`packages/shared/src/schemas/schemas.ts` — keep the zod enum in sync:

```ts
export const ChainIdSchema = z.enum([
  'bitcoin', 'ethereum', 'bnb', 'tron', 'solana', 'polygon'
]);
```

`packages/shared/src/constants/index.ts`:

```ts
export const SUPPORTED_CHAINS: ChainId[] = [
  'bitcoin', 'ethereum', 'bnb', 'tron', 'solana', 'polygon'
];

// Polygon is EVM, so it shares the EVM adapter family.
export const EVM_CHAINS: ChainId[] = ['ethereum', 'bnb', 'polygon'];
```

`packages/blockchain/src/core/registry.ts` — add metadata, including the explorer
URL prefixes:

```ts
{
  id: 'polygon',
  name: 'Polygon',
  symbol: 'POL',
  color: '#8247E5',
  latestLabel: 'Latest block',
  latestHeight: 65000000,
  avgBlockTime: '~2 sec blocks',
  addressExplorer: 'https://polygonscan.com/address/',
  txExplorer: 'https://polygonscan.com/tx/'
}
```

## 2. Describe the ledger

`packages/transaction-engine/src/parser/ledger.ts` — add a
`LedgerSemantics` record to `LEDGER_SEMANTICS`. This is data, not a branch:

```ts
polygon: {
  chain: 'polygon',
  model: 'account',
  heightUnit: 'block',
  nativeDecimals: 18,
  multipleInputs: false,
  multipleOutputs: false,
  groupsSwaps: false
}
```

`model` is `'utxo'` for Bitcoin-style chains and `'account'` for everything
else. `heightUnit` is `'slot'` only for chains that use slots.

## 3. Write the adapter

### If your chain is EVM-compatible

Create `packages/blockchain/src/polygon/index.ts`. This is the easy case and the
reason `EvmAdapter` exists:

```ts
import type { ChainId, Transaction } from '@blocksense/shared';
import { EvmAdapter, fromWei, type EvmRawTransaction } from '../evm/adapter';

export const POLYGON_ENV = {
  rpcUrl: 'POLYGON_RPC_URL',
  apiKey: 'POLYGONSCAN_API_KEY'
} as const;

export class PolygonAdapter extends EvmAdapter {
  readonly id: ChainId = 'polygon';
  readonly name = 'Polygon';
  readonly nativeSymbol = 'POL';
  readonly decimals = 18;

  protected buildTransaction(raw: EvmRawTransaction): Transaction {
    return {
      hash: raw.hash,
      chain: this.id,
      from: raw.from,
      to: raw.to,
      timestamp: Number(raw.timestamp ?? 0) * 1000,
      status: 'confirmed',
      block: Number(BigInt(raw.blockNumber ?? '0x0')),
      confirmations: 0,
      asset: {
        type: 'native',
        name: this.name,
        symbol: this.nativeSymbol,
        amount: fromWei(raw.value),
        decimals: this.decimals
      },
      summary: [],
      technical: [],
      related: []
    };
  }
}

export const createPolygonAdapter = (config: AdapterConfig = {}) => new PolygonAdapter(config);
```

That is genuinely the whole adapter. `EvmAdapter` already handles JSON-RPC,
hash validation, `isLive` and the mock fallback.

### If your chain is not EVM-compatible

Extend `BaseAdapter` directly. You get safe mock-backed defaults for everything,
so you implement only what you can genuinely answer:

```ts
import { BaseAdapter } from '../core/base';
import { httpGet } from '../core/client';

export class MyChainAdapter extends BaseAdapter {
  readonly id: ChainId = '…';
  readonly name = '…';
  readonly nativeSymbol = '…';
  readonly decimals = 8;

  constructor(options: Partial<BaseAdapterOptions> = {}) {
    // Literals, not `this.id`: `super()` runs before instance fields exist.
    super({ id: '…', name: '…', nativeSymbol: '…', decimals: 8, ...options });
  }

  override async getTransaction(hash: string): Promise<Transaction> {
    if (!this.options.rpcUrl) {
      throw this.notFound('Transaction', hash);
    }
    // ...
  }
}
```

Three things to get right:

- Pass **literals** to `super()`, not `this.id`. `this` does not exist yet.
- Anything that overrides a `BaseAdapter` method needs the `override` keyword,
  or the build fails.
- If you genuinely cannot answer a method, let the base throw
  `NOT_IMPLEMENTED`. Never invent a plausible-looking value.

## 4. Register the factory

`packages/blockchain/src/core/resolve.ts`:

```ts
import { createPolygonAdapter, POLYGON_ENV } from '../polygon';

export const ENV_KEYS: Record<ChainId, { rpcUrl: string; apiKey?: string }> = {
  // …
  polygon: POLYGON_ENV
};

const FACTORIES = {
  // …
  polygon: createPolygonAdapter
} satisfies Record<ChainId, (config: AdapterConfig) => BlockchainAdapter>;
```

Finally, add the export to `packages/blockchain/src/index.ts`:

```ts
export * from './polygon';
```

## 5. Document the environment variable

Add the new variable to `.env.example` with a comment saying what it is and
where to get one.

## 6. Verify

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Then confirm the chain appears:

```bash
pnpm dev:api &
curl localhost:8787/api/chains | grep polygon
```

Add a test in `tests/detect.test.ts` if you introduced a new identifier format,
and add a case to `tests/amount.test.ts` if your chain has an unusual decimal
count.

## Adding a token standard

You do not need a new adapter. Return the token in the transaction's `assets`
array using `type: 'token'` with a `contractAddress` and `standard`, and the
asset display layer, the tables and the analysis all handle it. For NFT
transfers use `type: 'nft'` with a `tokenId`.

## If you get stuck

The three questions that unblock almost every case:

1. **Account or UTXO?** Account chains have a single `from` and `to`. UTXO
   chains have many, and the transfer list is the real transaction.
2. **Block or slot?** Solana uses slots. Confirmations and "latest height" are
   labelled differently as a result.
3. **How many decimals?** Eight for Bitcoin, eighteen for EVM, six for TRON,
   nine for Solana. Getting this wrong produces amounts that are wrong by
   twelve orders of magnitude, so check it against a known transaction.
