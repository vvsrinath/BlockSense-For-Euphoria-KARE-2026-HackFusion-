/**
 * The end-to-end analysis pipeline.
 *
 * This is the function the API calls and the UI mirrors. It is deliberately a
 * pure composition of the modules below it, so any stage can be used on its own
 * or replaced without touching the rest.
 */

import type { Transaction, Wallet } from '@blocksense/shared';
import { detectAll, type SignalContext } from './anomaly/signals';
import { scoreSignals, type ScoreResult } from './scoring/score';
import { buildDna, type DnaProfile } from './behavioral-dna/dna';
import { headlineFor, toFindings, type Finding } from './explanations/explain';

export interface AnalysisResult {
  transaction: Transaction;
  score: ScoreResult;
  findings: Finding[];
  headline: string;
  dna: DnaProfile;
}

/**
 * Analyse a transaction in the context of the wallet that sent or received it.
 *
 * Passing the wallet matters: an amount is only anomalous relative to a
 * baseline, and the wallet's own history is the best available baseline.
 */
export function analyzeTransaction(
  transaction: Transaction,
  wallet: Wallet | null,
  options: { now?: number } = {}
): AnalysisResult {
  const context: SignalContext = {
    focusAddress: transaction.from,
    ...(wallet ? { medianUsd: wallet.dna.medianUsd, txPerWeek: wallet.dna.txPerWeek } : {}),
    ...(options.now !== undefined ? { now: options.now } : {})
  };

  const signals = detectAll(transaction, context);
  const score = scoreSignals(signals);
  const dna = buildDna(wallet?.activity ?? [], options);

  return {
    transaction: {
      ...transaction,
      anomaly: {
        score: score.score,
        level: score.level,
        confidence: score.confidence,
        signals: signals.map((s) => s.id),
        details: signals
      }
    },
    score,
    findings: toFindings(signals),
    headline: headlineFor(signals, { hasBaseline: wallet !== null }),
    dna
  };
}

/** Analyse a wallet on its own, without a specific transaction. */
export function analyzeWallet(wallet: Wallet, options: { now?: number } = {}): DnaProfile {
  return buildDna(wallet.activity, options);
}
