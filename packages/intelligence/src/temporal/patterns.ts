/**
 * Temporal patterns.
 *
 * Activity over time is often more revealing than any single transaction: a
 * wallet that is quiet for months and then moves everything at once is a
 * different story from one that transacts steadily.
 */

import type { AnomalyLevel } from '@blocksense/shared';

export interface ActivitySample {
  timestamp: number;
  valueUsd: number;
  level?: AnomalyLevel;
}

export interface BurstWindow {
  start: number;
  end: number;
  count: number;
  totalUsd: number;
}

/** A burst is this many transactions inside the window. */
export const BURST_THRESHOLD = 8;

/** Window length for burst detection. */
export const BURST_WINDOW_MS = 60 * 60 * 1000;

export function groupByHour(samples: ActivitySample[]): Map<number, ActivitySample[]> {
  const buckets = new Map<number, ActivitySample[]>();
  samples.forEach((s) => {
    const hour = Math.floor(s.timestamp / 3_600_000);
    const existing = buckets.get(hour);
    if (existing) existing.push(s);
    else buckets.set(hour, [s]);
  });
  return buckets;
}

/** Find windows containing an unusual concentration of activity. */
export function findBursts(
  samples: ActivitySample[],
  windowMs = BURST_WINDOW_MS,
  threshold = BURST_THRESHOLD
): BurstWindow[] {
  if (samples.length < threshold) return [];
  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp);
  const bursts: BurstWindow[] = [];

  let windowStart = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    while (sorted[i].timestamp - sorted[windowStart].timestamp > windowMs) windowStart += 1;
    const inWindow = i - windowStart + 1;
    if (inWindow >= threshold) {
      const slice = sorted.slice(windowStart, i + 1);
      const last = bursts[bursts.length - 1];
      const start = slice[0].timestamp;
      if (last && start - last.end <= windowMs) {
        last.end = slice[slice.length - 1].timestamp;
        last.count = Math.max(last.count, inWindow);
        last.totalUsd += slice[slice.length - 1].valueUsd;
      } else {
        bursts.push({
          start,
          end: slice[slice.length - 1].timestamp,
          count: inWindow,
          totalUsd: slice.reduce((sum, s) => sum + s.valueUsd, 0)
        });
      }
    }
  }

  return bursts;
}

/** Longest gap with no activity, in days. 0 when there is no gap. */
export function longestSilenceDays(samples: ActivitySample[]): number {
  if (samples.length < 2) return 0;
  const sorted = [...samples].sort((a, b) => a.timestamp - b.timestamp);
  let longest = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (gap > longest) longest = gap;
  }
  return Math.round(longest / 86_400_000);
}

/** Transactions per week over the observed span. */
export function transactionsPerWeek(samples: ActivitySample[], now?: number): number {
  if (samples.length < 2) return 0;
  const timestamps = samples.map((s) => s.timestamp);
  const first = Math.min(...timestamps);
  // Measuring to the last observed transaction would make a wallet that stopped
  // a year ago look as busy as one that was busy until yesterday. Measuring to
  // `now` is what makes dormancy visible.
  const last = now ?? Math.max(...timestamps);
  const weeks = (last - first) / (7 * 86_400_000);
  if (weeks <= 0) return samples.length;
  return Math.round((samples.length / weeks) * 10) / 10;
}

/** The hour of day a wallet is most active, or null when there is no data. */
export function mostActiveHour(samples: ActivitySample[]): number | null {
  if (samples.length === 0) return null;
  const counts = new Array(24).fill(0) as number[];
  samples.forEach((s) => {
    counts[new Date(s.timestamp).getUTCHours()] += 1;
  });
  const max = Math.max(...counts);
  return max === 0 ? null : counts.indexOf(max);
}
