/**
 * Demo data check.
 *
 * Run with `pnpm seed:demo`.
 *
 * BlockSense has no database, so there is nothing to seed. What this does
 * instead is run the bundled demo transactions through the real analysis
 * pipeline and print the result, which serves two purposes: it is a fast way to
 * confirm the scoring engine is working, and it documents what the demo data
 * actually demonstrates.
 */

import { mockTransactions } from '../apps/web/src/mock/mockTransactions';
import { analyzeTransaction } from '@blocksense/intelligence';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const COLOUR: Record<string, string> = {
  high: '\x1b[31m',
  unusual: '\x1b[33m',
  normal: '\x1b[32m'
};

process.stdout.write(`\n${BOLD}BlockSense demo data${RESET}\n`);
process.stdout.write(
  `${DIM}  ${mockTransactions.length} bundled transactions, analysed with no wallet baseline.${RESET}\n\n`
);

const counts = { normal: 0, unusual: 0, high: 0 } as Record<string, number>;

for (const tx of mockTransactions) {
  // `null` for the wallet: the baseline is unavailable, so only the signals
  // that do not need history can fire.
  const result = analyzeTransaction(tx, null);
  const level = result.score.level;
  counts[level] = (counts[level] ?? 0) + 1;
  const colour = COLOUR[level] ?? '';

  process.stdout.write(
    `  ${colour}${level.toUpperCase().padEnd(8)}${RESET} ${tx.chain.padEnd(9)} ` +
      `${tx.asset.symbol.padEnd(5)} ${String(tx.hash).slice(0, 14)}…  ${DIM}${result.headline}${RESET}\n`
  );

  for (const finding of result.findings.slice(0, 3)) {
    process.stdout.write(`           ${DIM}· ${finding.title}: ${finding.body}${RESET}\n`);
  }
}

process.stdout.write(`\n${BOLD}Summary${RESET}\n`);
for (const [level, count] of Object.entries(counts)) {
  const colour = count > 0 ? COLOUR[level] ?? '' : DIM;
  process.stdout.write(`  ${colour}${level.padEnd(8)}${RESET} ${count}\n`);
}

process.stdout.write(
  `\n${DIM}Open a transaction in the app to see the full analysis with a wallet baseline.${RESET}\n\n`
);
