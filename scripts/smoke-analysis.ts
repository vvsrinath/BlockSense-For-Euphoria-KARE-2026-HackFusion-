/**
 * Analysis smoke test.
 *
 * Run with `pnpm smoke:analysis`.
 *
 * BlockSense has no database, so there is nothing to seed. What this does is
 * pull real transactions from the live API and run them through the real
 * analysis pipeline, printing the score each one produces. That serves two
 * purposes: it is the fastest way to confirm the scoring engine behaves
 * sensibly on genuine data, and it shows what a real analysis looks like
 * end to end.
 *
 * Unlike a fixture-based check, this can surface provider surprises — a chain
 * that stops reporting, or a transaction shape the parser does not yet handle —
 * which is exactly what you want to find before a user does.
 */

import { analyzeTransaction, type Confidence } from '@blocksense/intelligence';
import type { AnomalyLevel, Transaction } from '@blocksense/shared';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const API = process.env.SMOKE_API_URL ?? 'http://localhost:3000';

/** Real transactions, one per chain, that resolve against public endpoints. */
const TARGETS: { chain: string; hash: string }[] = [
  { chain: 'tron', hash: 'b40bfdb07e4e4b466582328917bb8f4aef0cb1d8948bab794771eae9d4213352' },
  { chain: 'solana', hash: '2s3KJu2sYriyebHBLkQcboiFR6R9Hi1zJwdv2hAMJCfLoKDRZwu9isM8gxn9hSvRznVDPUY469CLTnwmLaA4bhRS' }
];

const COLOUR: Record<AnomalyLevel, string> = {
  normal: '\x1b[32m',
  unusual: '\x1b[33m',
  elevated: '\x1b[38;5;208m',
  high: '\x1b[31m'
};

const CONFIDENCE_NOTE: Record<Confidence, string> = {
  low: 'little evidence either way',
  medium: 'several signals',
  high: 'independent signals agree'
};

/**
 * Confidence is about evidence, not about the score being low.
 *
 * With no wallet baseline almost nothing can be compared, so a zero score
 * reflects an absence of evaluation rather than a clean result — the wording
 * should not imply we checked and found nothing.
 */
function confidenceNote(score: { confidence: Confidence; contributing: unknown[] }): string {
  if (score.contributing.length === 0) return 'nothing to compare against';
  return CONFIDENCE_NOTE[score.confidence];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function fetchTransaction(chain: string, hash: string): Promise<Transaction | null> {
  const res = await fetch(`${API}/api/v1/transactions/${chain}/${hash}`);
  const body = (await res.json()) as ApiEnvelope<Transaction>;
  if (!body.success || !body.data) {
    process.stdout.write(`  ${DIM}skipped${RESET} ${chain.padEnd(9)} ${body.error?.code ?? res.status}\n`);
    return null;
  }
  return body.data;
}

async function main(): Promise<void> {
  process.stdout.write(`\n${BOLD}BlockSense analysis smoke test${RESET}\n`);
  process.stdout.write(`${DIM}  API ${API}\n\n`);

  const counts = {} as Record<AnomalyLevel, number>;
  counts.normal = 0;
  counts.unusual = 0;
  counts.elevated = 0;
  counts.high = 0;
  let analysed = 0;

  for (const target of TARGETS) {
    const tx = await fetchTransaction(target.chain, target.hash);
    if (!tx) continue;
    analysed += 1;

    // `null` for the wallet: the baseline is unavailable, so only the signals
    // that do not need history can fire.
    const result = analyzeTransaction(tx, null);
    const level = result.score.level;
    counts[level] += 1;
    const colour = COLOUR[level];

    process.stdout.write(
      `  ${colour}${level.toUpperCase().padEnd(8)}${RESET} ${tx.chain.padEnd(9)} ` +
        `${tx.asset.symbol.padEnd(5)} ${String(tx.hash).slice(0, 14)}…  ` +
        `${DIM}score ${result.score.score}/100 · ${result.score.confidence} confidence (${confidenceNote(result.score)})${RESET}\n`
    );
    process.stdout.write(`  ${' '.repeat(10)}${DIM}${result.headline}${RESET}\n`);

    for (const finding of result.findings.slice(0, 3)) {
      process.stdout.write(`           ${DIM}· ${finding.title}: ${finding.body}${RESET}\n`);
    }
  }

  process.stdout.write(`\n${BOLD}Summary${RESET}  ${DIM}(${analysed}/${TARGETS.length} reachable)${RESET}\n`);
  for (const [level, count] of Object.entries(counts)) {
    const colour = count > 0 ? COLOUR[level as AnomalyLevel] : DIM;
    process.stdout.write(`  ${colour}${level.padEnd(8)}${RESET} ${count}\n`);
  }

  process.stdout.write(
    `\n${DIM}Open a transaction in the app to see the full analysis with a wallet baseline.${RESET}\n\n`
  );

  if (analysed === 0) {
    process.stdout.write(`${BOLD}No transaction could be analysed.${RESET} Is the API running at ${API}?\n\n`);
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${BOLD}Smoke test failed${RESET} ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
