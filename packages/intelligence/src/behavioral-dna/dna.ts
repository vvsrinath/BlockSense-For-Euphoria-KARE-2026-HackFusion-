/**
 * Behavioral DNA.
 *
 * A behavioural fingerprint is a small set of traits describing how a wallet
 * habitually behaves, so a later transaction can be judged against the wallet's
 * own norms rather than a population average. Each trait is a 0-1 score with a
 * human descriptor, because "0.82 — consistent" is more useful than 0.82.
 */

import type { DnaTrait, WalletActivity } from '@blocksense/shared';
import { formatMoney, formatRelative } from '@blocksense/shared';
import { mostActiveHour, transactionsPerWeek } from '../temporal/patterns';

export interface DnaProfile {
  typicalAmount: string;
  typicalFrequency: string;
  mostActive: string;
  commonAsset: string;
  counterparties: number;
  medianUsd: number;
  txPerWeek: number;
  traits: DnaTrait[];
}

/** Above this multiple of the median, a transfer is outside the wallet's norm. */
export const AMOUNT_NORM_FACTOR = 5;

/** Coefficient of variation above which a wallet is considered erratic. */
export const VOLATILITY_THRESHOLD = 1.0;

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Standard deviation, guarded against the single-sample case. */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Coefficient of variation: stddev / mean. 0 means perfectly steady. */
export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  return standardDeviation(values) / mean;
}

/** The asset a wallet moves most often, or '—' when there is no history. */
export function commonAsset(activity: WalletActivity[]): string {
  if (activity.length === 0) return '—';
  const counts = new Map<string, number>();
  activity.forEach((a) => counts.set(a.symbol, (counts.get(a.symbol) ?? 0) + 1));
  let best = '—';
  let bestCount = 0;
  counts.forEach((count, symbol) => {
    if (count > bestCount) {
      best = symbol;
      bestCount = count;
    }
  });
  return best;
}

/** Distinct counterparties across a wallet's activity. */
export function counterpartyCount(activity: WalletActivity[]): number {
  return new Set(activity.map((a) => a.counterparty.toLowerCase())).size;
}

function describeAmount(value: number, typical: number): { descriptor: string; score: number } {
  if (typical === 0) return { descriptor: 'No history', score: 0 };
  const ratio = value / typical;
  if (ratio <= 0.5) return { descriptor: 'Much smaller than usual', score: clamp01(1 - ratio) };
  if (ratio <= 2) return { descriptor: 'Typical size', score: 0.5 };
  return { descriptor: 'Larger than usual', score: clamp01(ratio / AMOUNT_NORM_FACTOR) };
}

/** Build the full behavioural profile for a wallet. */
export function buildDna(
  activity: WalletActivity[],
  options: { now?: number } = {}
): DnaProfile {
  const now = options.now ?? Date.now();
  const values = activity.map((a) => a.valueUsd);
  const medianUsd = median(values);
  const txPerWeek = transactionsPerWeek(
    activity.map((a) => ({ timestamp: a.timestamp, valueUsd: a.valueUsd })),
    now
  );
  const hour = mostActiveHour(activity.map((a) => ({ timestamp: a.timestamp, valueUsd: a.valueUsd })));

  const traits: DnaTrait[] = [
    {
      label: 'Amount consistency',
      value: round2(1 - Math.min(1, coefficientOfVariation(values))),
      descriptor:
        coefficientOfVariation(values) <= 0.5
          ? 'Steady transfer sizes'
          : coefficientOfVariation(values) <= VOLATILITY_THRESHOLD
            ? 'Moderately varied sizes'
            : 'Highly variable transfer sizes',
      description: 'How much transfer sizes vary, based on the coefficient of variation.'
    },
    {
      label: 'Activity rhythm',
      value: round2(clamp01(1 - txPerWeek / 50)),
      descriptor:
        txPerWeek < 2 ? 'Occasional activity' : txPerWeek < 10 ? 'Regular activity' : 'High-frequency activity',
      description: 'Transactions per week, measured from first activity up to now.'
    },
    {
      label: 'Directional bias',
      value: round2(directionalBias(activity)),
      descriptor: directionalLabel(activity),
      description: 'Whether the wallet mostly receives value, mostly sends it, or splits evenly.'
    }
  ];

  if (hour !== null) {
    traits.push({
      label: 'Peak activity hour',
      value: round2(hour / 23),
      descriptor: `${String(hour).padStart(2, '0')}:00 UTC`,
      description: 'The hour of day with the most transactions, in UTC.'
    });
  }

  return {
    typicalAmount: medianUsd > 0 ? formatMoney(medianUsd) : '—',
    typicalFrequency: txPerWeek > 0 ? `${txPerWeek} tx/week` : 'No history',
    mostActive: hour !== null ? `${String(hour).padStart(2, '0')}:00 UTC` : '—',
    commonAsset: commonAsset(activity),
    counterparties: counterpartyCount(activity),
    medianUsd,
    txPerWeek,
    traits
  };
}

/** 0 = always receives, 1 = always sends. */
function directionalBias(activity: WalletActivity[]): number {
  if (activity.length === 0) return 0.5;
  const out = activity.filter((a) => a.direction === 'out').length;
  return out / activity.length;
}

function directionalLabel(activity: WalletActivity[]): string {
  if (activity.length === 0) return 'No history';
  const bias = directionalBias(activity);
  if (bias > 0.8) return 'Mostly sends';
  if (bias < 0.2) return 'Mostly receives';
  return 'Balanced flow';
}

/** Human summary of how a transaction compares to the wallet's fingerprint. */
export function compareToDna(valueUsd: number, profile: DnaProfile): string {
  if (profile.medianUsd === 0) return 'No baseline history for this wallet yet.';
  const { descriptor } = describeAmount(valueUsd, profile.medianUsd);
  return `${formatMoney(valueUsd)} — ${descriptor} (median ${formatMoney(profile.medianUsd)}).`;
}

/** How long ago the wallet was last active, in words. */
export function lastActiveLabel(lastActive: number, now = Date.now()): string {
  return formatRelative(lastActive, now);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
