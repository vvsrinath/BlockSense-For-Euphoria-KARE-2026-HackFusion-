# Transaction Engine Package

Turns a chain-native transaction into a normalised `Transaction` with an amount
you can trust.

```
Transaction → Parse → Amount → Asset → Normalize
```

## Why this is a separate package

Extracting an amount correctly is the hardest part of reading a blockchain, and
getting it wrong is worse than showing nothing. A USDC transfer has 6 decimals;
a raw on-chain value of `1500000` is `1.5 USDC`, not `1500000`. If that logic
lives in a React component it will be duplicated, and eventually one copy will
drift.

## Structure

```
transaction-engine/
├── parser/           raw chain shape → intermediate RawTransaction
│   └── ledger.ts     per-chain semantics (UTXO vs account, block vs slot)
├── amount/           exact decimal arithmetic
│   └── amount.ts     base units ⇄ human decimals, no floats
├── assets/           asset identity and display labels
│   ├── catalog.ts    namespaced asset ids
│   └── display.ts    human-readable labels
├── normalization/    intermediate → shared Transaction
└── types/            re-exports
```

## Amount arithmetic

All conversion uses `bigint` and strings. Floating point is never used for
base-unit conversion because it loses precision above 2^53 — which is below the
value of a single token in some transactions.

```ts
import { resolveAmount, toRawAmount, formatResolvedAmount } from '@blocksense/transaction-engine';

resolveAmount({ raw: '1500000', decimals: 6 }).amount;      // '1.5'
toRawAmount('1.5', 6);                                       // '1500000'
formatResolvedAmount(resolveAmount({ raw: '1', decimals: 18 }), 'ETH'); // '0.000000000000000001 ETH'
```

Native decimals per chain:

| Chain    | Decimals |
| -------- | -------- |
| Bitcoin  | 8        |
| Ethereum | 18       |
| BNB      | 18       |
| TRON     | 6        |
| Solana   | 9        |

## Ledger semantics

Chains do not agree on what a transaction is, so the parser records the
differences instead of hiding them:

```ts
import { semanticsFor } from '@blocksense/transaction-engine';

semanticsFor('bitcoin');
// { model: 'utxo', multipleInputs: true, multipleOutputs: true, heightUnit: 'block', nativeDecimals: 8, … }

semanticsFor('solana');
// { model: 'account', heightUnit: 'slot', groupsSwaps: true, … }
```

Bitcoin is UTXO-based: there are no accounts, so a transaction can have many
senders and many receivers. Solana is account-based but groups swaps into a
single record, and its height unit is a slot rather than a block. Code that
ignores these distinctions will produce confidently wrong answers.

## Normalisation

```ts
import { normalizeTransaction } from '@blocksense/transaction-engine';

const tx = normalizeTransaction(raw, { focusAddress: '0xabc…' });
tx.asset.amount;   // '1.5', already divided by decimals
tx.related;        // counterparties, labelled and de-duplicated
tx.technical;      // hash, chain, height, status, fee
```

`focusAddress` labels each transfer `sent` or `received` relative to the wallet
under investigation, which is the perspective an analyst actually cares about.

## Adding support for a new shape

1. Add the chain's semantics to `LEDGER_SEMANTICS` in `parser/ledger.ts`.
2. If the chain has an asset format not covered by `assetType`, extend
   `RawTransfer` and handle it in `assets/display.ts`.
3. Extend `normalizeTransfer` only if the shared `TransactionAsset` type
   genuinely cannot express the result — prefer widening the shared type, so
   the frontend stays chain-agnostic.
