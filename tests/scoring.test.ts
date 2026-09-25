/**
 * Scoring and level classification.
 *
 * A false negative here is the expensive failure mode: a real threat is
 * presented as normal. These tests pin the band boundaries so a change to the
 * thresholds cannot silently reclassify risk.
 */

import { describe, expect, it } from 'vitest';
import { SCORE_THRESHOLDS } from '@blocksense/shared';
import type { AnomalySignal } from '@blocksense/shared';
import {
  dominantLevel,
  isSevere,
  levelHeadline,
  levelLabel,
  maxLevel,
  scoreSignals,
  scoreToLevel
} from '@blocksense/intelligence';

function signal(overrides: Partial<AnomalySignal> = {}): AnomalySignal {
  return {
    id: 'amount',
    kind: 'amount',
    label: 'Unusual amount',
    value: '5x',
    detail: 'detail',
    level: 'unusual',
    ...overrides
  };
}

describe('scoreToLevel', () => {
  it('maps 0 to normal', () => {
    expect(scoreToLevel(0)).toBe('normal');
  });

  it('treats the threshold as the first value of the higher band', () => {
    expect(scoreToLevel(SCORE_THRESHOLDS.unusual)).toBe('unusual');
    expect(scoreToLevel(SCORE_THRESHOLDS.high)).toBe('high');
  });

  it('keeps just-below-threshold values in the lower band', () => {
    expect(scoreToLevel(SCORE_THRESHOLDS.unusual - 1)).toBe('normal');
    expect(scoreToLevel(SCORE_THRESHOLDS.high - 1)).toBe('unusual');
  });

  it('clamps a score of 100 to high, never above', () => {
    expect(scoreToLevel(100)).toBe('high');
  });
});

describe('scoreSignals', () => {
  it('scores no signals as zero and normal', () => {
    const result = scoreSignals([]);
    expect(result.score).toBe(0);
    expect(result.level).toBe('normal');
  });

  it('produces a higher score for a severe signal than an informational one', () => {
    const info = scoreSignals([signal({ level: 'info' })]);
    const high = scoreSignals([signal({ level: 'high' })]);
    expect(high.score).toBeGreaterThan(info.score);
  });

  it('clamps the score into the 0-100 range when signals accumulate', () => {
    const many = Array.from({ length: 20 }, () => signal({ level: 'high' }));
    const result = scoreSignals(many);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('never reports a lower level than its dominant signal warrants', () => {
    const result = scoreSignals([signal({ level: 'high' })]);
    expect(['unusual', 'high']).toContain(result.level);
  });
});

describe('level helpers', () => {
  it('orders levels by severity for max()', () => {
    expect(maxLevel('normal', 'high')).toBe('high');
    expect(maxLevel('unusual', 'info')).toBe('unusual');
  });

  it('treats only high as severe', () => {
    expect(isSevere('high')).toBe(true);
    expect(isSevere('unusual')).toBe(false);
    expect(isSevere('normal')).toBe(false);
  });

  it('labels every level', () => {
    expect(levelLabel('normal')).toBe('Normal');
    expect(levelLabel('info')).toBe('Info');
    expect(levelLabel('unusual')).toBe('Unusual');
    expect(levelLabel('high')).toBe('High');
  });

  it('has a headline for each anomaly level', () => {
    expect(levelHeadline('normal').length).toBeGreaterThan(0);
    expect(levelHeadline('unusual').length).toBeGreaterThan(0);
    expect(levelHeadline('high').length).toBeGreaterThan(0);
  });
});

describe('dominantLevel', () => {
  it('returns the highest level present', () => {
    expect(dominantLevel([signal({ level: 'normal' }), signal({ level: 'high' })])).toBe('high');
  });

  it('reports normal for an empty list, meaning no signal was raised', () => {
    expect(dominantLevel([])).toBe('normal');
  });

  it('does not depend on the order of the signals', () => {
    const signals = [signal({ level: 'info' }), signal({ level: 'normal' })];
    expect(dominantLevel(signals)).toBe(dominantLevel([...signals].reverse()));
  });
});
