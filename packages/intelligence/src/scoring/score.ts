/**
 * Anomaly scoring.
 *
 * The score is a weighted blend of independent signals rather than a single
 * heuristic, so that one noisy signal cannot dominate the result. Weights are
 * normalised, which means a missing signal is skipped rather than counted as
 * zero — a wallet with no frequency data should not look "safe" because of it.
 *
 * A score on its own invites over-trust, so every result also carries a
 * confidence. The two answer different questions: the score says how unusual
 * this looks, the confidence says how much the inputs justify claiming that.
 */

import type { AnomalySignal, Confidence, SignalKind, SignalLevel, Transaction } from '@blocksense/shared';
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
  elevated: 70,
  high: 85
};

/** Re-exported so callers need only one import for a scored result. */
export type { Confidence };

export interface ScoreResult {
  score: number;
  level: ReturnType<typeof scoreToLevel>;
  confidence: Confidence;
  /** Signals that actually contributed, in descending order of weight. */
  contributing: AnomalySignal[];
}

/**
 * Number of distinct signal kinds that fired.
 *
 * This is the basis for confidence rather than a count of signals: three amount
 * signals are one opinion, while amount, time and frequency are three.
 */
function distinctKinds(signals: AnomalySignal[]): number {
  return new Set(signals.map((s) => s.kind)).size;
}

/**
 * Confidence from the breadth of agreeing evidence.
 *
 * A single signal is never enough for `high`, and none at all is reported as
 * `low` rather than as a confident zero, because "nothing was detected" and
 * "nothing could be evaluated" are different claims.
 */
export function confidenceFor(signals: AnomalySignal[]): Confidence {
  if (signals.length === 0) return 'low';

  const kinds = distinctKinds(signals);
  const totalWeight = signals.reduce((sum, s) => sum + SIGNAL_WEIGHTS[s.kind], 0);

  if (kinds >= 3 && totalWeight >= 1.8) return 'high';
  if (kinds >= 2) return 'medium';
  return 'low';
}

/**
 * Blend signals into a single 0-100 score.
 *
 * ```ts
 * scoreSignals([{ kind: 'amount', level: 'high', … }]).score // 85
 * ```
 */
export function scoreSignals(signals: AnomalySignal[]): ScoreResult {
  if (signals.length === 0) {
    return { score: 0, level: 'normal', confidence: 'low', contributing: [] };
  }

  const totalWeight = signals.reduce((sum, s) => sum + SIGNAL_WEIGHTS[s.kind], 0);
  if (totalWeight === 0) {
    return { score: 0, level: 'normal', confidence: 'low', contributing: [] };
  }

  const weighted = signals.reduce(
    (sum, s) => sum + LEVEL_CONTRIBUTION[s.level] * SIGNAL_WEIGHTS[s.kind],
    0
  );

  const score = clamp(Math.round(weighted / totalWeight), 0, 100);
  const contributing = [...signals].sort(
    (a, b) => SIGNAL_WEIGHTS[b.kind] - SIGNAL_WEIGHTS[a.kind]
  );

  return { score, level: scoreToLevel(score), confidence: confidenceFor(signals), contributing };
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
