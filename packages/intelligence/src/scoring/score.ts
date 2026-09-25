/**
 * Anomaly scoring.
 *
 * The score is a weighted blend of independent signals rather than a single
 * heuristic, so that one noisy signal cannot dominate the result. Weights are
 * normalised, which means a missing signal is skipped rather than counted as
 * zero — a wallet with no frequency data should not look "safe" because of it.
 */

import type { AnomalySignal, SignalKind, SignalLevel, Transaction } from '@blocksense/shared';
import { maxLevel, scoreToLevel } from './levels';

export type { SignalKind };

/** Relative importance of each signal kind. Higher means more suspicious. */
export const SIGNAL_WEIGHTS: Record<SignalKind, number> = {
  amount: 1.0,
  relationship: 0.9,
  frequency: 0.7,
  asset: 0.6,
  time: 0.5,
  history: 0.4
};

/** Per-level contribution to the final 0-100 score. */
export const LEVEL_CONTRIBUTION: Record<SignalLevel, number> = {
  normal: 0,
  info: 10,
  unusual: 45,
  high: 85
};

export interface ScoreResult {
  score: number;
  level: ReturnType<typeof scoreToLevel>;
  /** Signals that actually contributed, in descending order of weight. */
  contributing: AnomalySignal[];
}

/**
 * Blend signals into a single 0-100 score.
 *
 * ```ts
 * scoreTransaction([{ kind: 'amount', level: 'high', … }]).score // 85
 * ```
 */
export function scoreSignals(signals: AnomalySignal[]): ScoreResult {
  if (signals.length === 0) {
    return { score: 0, level: 'normal', contributing: [] };
  }

  const totalWeight = signals.reduce((sum, s) => sum + SIGNAL_WEIGHTS[s.kind], 0);
  if (totalWeight === 0) return { score: 0, level: 'normal', contributing: [] };

  const weighted = signals.reduce(
    (sum, s) => sum + LEVEL_CONTRIBUTION[s.level] * SIGNAL_WEIGHTS[s.kind],
    0
  );

  const score = clamp(Math.round(weighted / totalWeight), 0, 100);
  const contributing = [...signals].sort(
    (a, b) => SIGNAL_WEIGHTS[b.kind] - SIGNAL_WEIGHTS[a.kind]
  );

  return { score, level: scoreToLevel(score), contributing };
}

/** Reduce a full transaction to a score, if it carries signals. */
export function scoreTransaction(tx: Transaction): ScoreResult | null {
  const signals = tx.anomaly?.details ?? [];
  if (signals.length === 0) return null;
  return scoreSignals(signals);
}

/** The most severe level present across a set of signals. */
export function dominantLevel(signals: AnomalySignal[]): SignalLevel {
  return signals.reduce<SignalLevel>((worst, s) => maxLevel(worst, s.level), 'normal');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
