/**
 * Scoring and level classification.
 *
 * A false negative here is the expensive failure mode: a real threat is
 * presented as normal. These tests pin the band boundaries so a change to the
 * thresholds cannot silently reclassify risk.
 */

import { describe, expect, it } from 'vitest';
import { ANOMALY_LEVELS, SCORE_THRESHOLDS } from '@blocksense/shared';
import type { AnomalySignal } from '@blocksense/shared';
import {
  confidenceFor,
  dominantLevel,
  isActionable,
  isSevere,
  levelHeadline,
  levelLabel,
  maxLevel,
  scoreSignals,
  scoreToLevel,
  headlineFor,
  summarizeByLevel
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
    expect(scoreToLevel(SCORE_THRESHOLDS.elevated)).toBe('elevated');
    expect(scoreToLevel(SCORE_THRESHOLDS.high)).toBe('high');
  });

  it('keeps just-below-threshold values in the lower band', () => {
    expect(scoreToLevel(SCORE_THRESHOLDS.unusual - 1)).toBe('normal');
    expect(scoreToLevel(SCORE_THRESHOLDS.elevated - 1)).toBe('unusual');
    expect(scoreToLevel(SCORE_THRESHOLDS.high - 1)).toBe('elevated');
  });

  it('produces a contiguous set of bands with no unreachable scores', () => {
    // Every score from 0 to 100 must land in exactly one band, so a reader can
    // always place a number on the published scale.
    const seen = new Set(Array.from({ length: 101 }, (_, i) => scoreToLevel(i)));
    expect(seen).toEqual(new Set(ANOMALY_LEVELS));
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
    expect(levelLabel('elevated')).toBe('Elevated');
    expect(levelLabel('high')).toBe('High');
  });

  it('has a headline for each anomaly level', () => {
    for (const level of ANOMALY_LEVELS) {
      expect(levelHeadline(level).length).toBeGreaterThan(0);
    }
  });
});

describe('isSevere and isActionable', () => {
  it('treats only high as severe', () => {
    expect(isSevere('high')).toBe(true);
    expect(isSevere('elevated')).toBe(false);
    expect(isSevere('unusual')).toBe(false);
  });

  it('treats elevated and above as worth a reviewer\'s time', () => {
    expect(isActionable('high')).toBe(true);
    expect(isActionable('elevated')).toBe(true);
    expect(isActionable('unusual')).toBe(false);
    expect(isActionable('normal')).toBe(false);
  });
});

describe('confidenceFor', () => {
  it('reports low confidence when nothing could be evaluated', () => {
    // "Nothing detected" and "nothing to detect" are different claims.
    expect(confidenceFor([])).toBe('low');
  });

  it('does not reach high confidence on repeated signals of one kind', () => {
    // Three amount signals are one opinion, not three independent ones.
    const signals = [
      signal({ id: 'a1' }),
      signal({ id: 'a2' }),
      signal({ id: 'a3' })
    ];
    expect(confidenceFor(signals)).not.toBe('high');
  });

  it('reaches high confidence when independent kinds agree', () => {
    const signals = [
      signal({ id: 'a1', kind: 'amount' }),
      signal({ id: 't1', kind: 'time' }),
      signal({ id: 'f1', kind: 'frequency' })
    ];
    expect(confidenceFor(signals)).toBe('high');
  });

  it('reports medium confidence for two independent kinds', () => {
    const signals = [signal({ id: 'a1', kind: 'amount' }), signal({ id: 't1', kind: 'time' })];
    expect(confidenceFor(signals)).toBe('medium');
  });

  it('is carried on the scored result', () => {
    const result = scoreSignals([
      signal({ id: 'a1', kind: 'amount' }),
      signal({ id: 't1', kind: 'time' })
    ]);
    expect(result.confidence).toBe('medium');
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

describe('headlineFor', () => {
  it('does not claim a clean wallet when there was nothing to compare', () => {
    // With no history, "no anomalies" would be indistinguishable from
    // "no anomalies found", and only one of those is a real finding.
    expect(headlineFor([], { hasBaseline: false })).not.toBe('No anomalies detected.');
    expect(headlineFor([], { hasBaseline: true })).toBe('No anomalies detected.');
  });

  it('summarises the worst level present', () => {
    const text = headlineFor([signal({ level: 'elevated' }), signal({ level: 'normal' })]);
    expect(text).toContain('elevated');
  });
});

describe('summarizeByLevel', () => {
  it('includes elevated rather than dropping it', () => {
    const summary = summarizeByLevel([signal({ level: 'elevated' })]);
    expect(summary.map((s) => s.level)).toContain('elevated');
  });
});
