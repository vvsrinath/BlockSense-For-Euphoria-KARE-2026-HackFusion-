/**
 * Severity levels and score bands.
 *
 * Deliberately free of icons, colours and CSS class names. Presentation lives
 * in `apps/web/src/theme`, so this package stays usable from the API, from
 * tests and from any future non-web client.
 */

import {
  LEVEL_LABELS,
  LEVEL_SEVERITY,
  SCORE_THRESHOLDS,
  type AnomalyLevel,
  type SignalLevel
} from '@blocksense/shared';

export interface LevelInfo {
  level: SignalLevel;
  label: string;
  /** Higher is worse. Used for sorting and max() reductions. */
  severity: number;
  /** Short sentence describing what this level means. */
  headline: string;
}

export const LEVEL_INFO: Record<SignalLevel, LevelInfo> = {
  normal: {
    level: 'normal',
    label: LEVEL_LABELS.normal,
    severity: LEVEL_SEVERITY.normal,
    headline: 'Behavior matches history'
  },
  info: {
    level: 'info',
    label: LEVEL_LABELS.info,
    severity: LEVEL_SEVERITY.info,
    headline: 'Contextual information'
  },
  unusual: {
    level: 'unusual',
    label: LEVEL_LABELS.unusual,
    severity: LEVEL_SEVERITY.unusual,
    headline: 'Some behavior differs from history'
  },
  high: {
    level: 'high',
    label: LEVEL_LABELS.high,
    severity: LEVEL_SEVERITY.high,
    headline: 'Unusual behavior detected'
  }
};

/** Map a 0-100 anomaly score onto a level. */
export function scoreToLevel(score: number): AnomalyLevel {
  if (score >= SCORE_THRESHOLDS.high) return 'high';
  if (score >= SCORE_THRESHOLDS.unusual) return 'unusual';
  return 'normal';
}

export function levelHeadline(level: AnomalyLevel): string {
  return LEVEL_INFO[level].headline;
}

export function levelLabel(level: SignalLevel): string {
  return LEVEL_INFO[level].label;
}

/**
 * The more severe of two levels.
 *
 * `info` and `normal` share a severity of zero, so the tie is broken explicitly
 * in favour of `normal`. Without that, `maxLevel('info', 'normal')` and
 * `maxLevel('normal', 'info')` would return different values and any
 * reduction over signals would depend on their order.
 */
export function maxLevel(a: SignalLevel, b: SignalLevel): SignalLevel {
  if (LEVEL_SEVERITY[a] !== LEVEL_SEVERITY[b]) {
    return LEVEL_SEVERITY[a] > LEVEL_SEVERITY[b] ? a : b;
  }
  return a === 'normal' || b === 'normal' ? 'normal' : a;
}

export function isSevere(level: SignalLevel): boolean {
  return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY.high;
}
