# Intelligence Package

The analysis layer. This is where BlockSense earns its name: everything above
this package moves data, everything in it interprets it.

```
anomaly/     detect signals   → what looks wrong?
scoring/     blend signals    → how wrong, numerically?
explanations/ phrase it        → say why, in plain language
behavioral-dna/ fingerprint   → what is normal for this wallet?
relationship/ classify peers   → who is this address?
temporal/    timing patterns  → when does it behave oddly?
network/     build the graph  → how is everything connected?
```

## Design rule: headless

Nothing in this package imports React, lucide-react or any CSS. Levels are
`{ level, label, severity, headline }`, not Tailwind class strings. Icons and
colours for these same concepts live in `apps/web/src/theme/`.

This is not pedantry. It means the API server, the browser and the test suite
all run identical analysis code, and a presentation change can never silently
alter a score.

## Anomaly scoring

Signals are weighted by kind and blended, rather than summed, so a wallet with
one noisy signal is not punished as hard as one where every signal agrees:

```ts
import { analyzeTransaction } from '@blocksense/intelligence';

const result = analyzeTransaction(tx, wallet);
result.score.score;   // 0-100
result.score.level;   // 'normal' | 'unusual' | 'high'
result.headline;      // '2 unusual signals detected.'
result.findings;      // ranked, plain-language, each traceable to a signal
```

Weights live in `scoring/score.ts`:

| Signal kind  | Weight | Rationale                                    |
| ------------ | ------ | -------------------------------------------- |
| `amount`     | 1.0    | Strongest single indicator                    |
| `relationship` | 0.9  | Unexpected counterparties                     |
| `frequency`  | 0.7    | Automation and batching                       |
| `asset`      | 0.6    | Unusual asset selection                       |
| `time`       | 0.5    | Off-hours activity                            |
| `history`    | 0.4    | Wallet age                                    |

Score bands: `>= 70` high, `>= 40` unusual, otherwise normal.

## Anomaly is relative

`detectAmountAnomaly` compares a transfer to **the wallet's own median**, not to
an absolute dollar threshold. The same $50,000 transfer is unremarkable for an
exchange and alarming for a wallet that has never moved more than $200. An
absolute threshold cannot express that; a per-wallet baseline can.

## Behavioural DNA

```ts
import { buildDna, compareToDna } from '@blocksense/intelligence';

const dna = buildDna(wallet.activity);
dna.traits;        // [{ label: 'Amount consistency', value: 0.82, descriptor: 'Steady transfer sizes', … }]
compareToDna(tx.asset.valueUsd ?? 0, dna);
```

Every trait carries a 0-1 score *and* a descriptor. `0.82 — steady transfer
sizes` is interpretable; a bare `0.82` is not.

## Relationships

Counterparties are classified from evidence — interaction count, volume,
upstream labels — rather than a hardcoded address list, so labels keep working
for addresses the project has never seen. `assessRelationship` returns the
evidence alongside the verdict, so a classification can be audited.

## Graph construction

`buildGraph` prunes to a bounded neighbourhood (default depth 2, 120 entities).
This limit is not a shortcut: a real hub address has millions of counterparties,
and an unbounded traversal will never finish. Links pointing outside the
retained set are dropped, so the result is always internally consistent.

## Adding a detector

1. Write a function in `anomaly/` returning `AnomalySignal[]` — zero signals
   when nothing is wrong.
2. Include a `detail` sentence. A signal without an explanation is not
   actionable, and will be rejected in review.
3. Add it to `detectAll`.
4. If it needs a new `SignalKind`, extend the union in
   `packages/shared/src/types/transaction.ts` and give it a weight in
   `scoring/score.ts`.
5. Add a test with both a positive and a negative case.
