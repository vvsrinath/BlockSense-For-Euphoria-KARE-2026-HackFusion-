/**
 * Amount arithmetic.
 *
 * These are the tests that matter most in the repository. Every other layer
 * can be rewritten; a balance that is off by a rounding error is worse than no
 * balance at all, so the invariant is that no amount is ever represented as a
 * JavaScript number.
 */

import { describe, expect, it } from 'vitest';
import {
  clampForDisplay,
  formatResolvedAmount,
  multiplyRaw,
  resolveAmount,
  sumRaw,
  toRawAmount,
  unitFor
} from '@blocksense/transaction-engine';

describe('unitFor', () => {
  it('builds 10^decimals as a bigint', () => {
    expect(unitFor(0)).toBe(1n);
    expect(unitFor(8)).toBe(100_000_000n);
    expect(unitFor(18)).toBe(1_000_000_000_000_000_000n);
  });
});

describe('resolveAmount', () => {
  it('converts base units to a decimal string exactly', () => {
    expect(resolveAmount({ raw: '1000000000000000000', decimals: 18 }).amount).toBe('1');
    expect(resolveAmount({ raw: '1500000000000000000', decimals: 18 }).amount).toBe('1.5');
    expect(resolveAmount({ raw: '1', decimals: 18 }).amount).toBe('0.000000000000000001');
  });

  it('handles a chain with six decimals, such as TRON', () => {
    expect(resolveAmount({ raw: '1000000', decimals: 6 }).amount).toBe('1');
  });

  it('represents a negative amount, which a reversal produces', () => {
    expect(resolveAmount({ raw: '-1500000000000000000', decimals: 18 }).amount).toBe('-1.5');
    expect(resolveAmount({ raw: '-1', decimals: 6 }).amount).toBe('-0.000001');
  });

  it('rejects a non-integer raw amount', () => {
    expect(() => resolveAmount({ raw: '1.5', decimals: 18 })).toThrow();
  });

  it('rejects a raw amount that is not numeric', () => {
    expect(() => resolveAmount({ raw: 'abc', decimals: 18 })).toThrow();
  });

  it('stays exact well past Number.MAX_SAFE_INTEGER', () => {
    // 2^53 + 1 wei cannot survive a float; a bigint can.
    const raw = '9007199254740993';
    expect(resolveAmount({ raw, decimals: 18 }).amount).toBe('0.009007199254740993');
  });
});

describe('toRawAmount', () => {
  it('round-trips through resolveAmount', () => {
    const raw = toRawAmount('1.23456789', 8);
    expect(raw).toBe('123456789');
    expect(resolveAmount({ raw, decimals: 8 }).amount).toBe('1.23456789');
  });

  it('accepts a numeric input without losing the integer part', () => {
    expect(toRawAmount(42, 6)).toBe('42000000');
  });
});

describe('sumRaw', () => {
  it('adds two base-unit amounts', () => {
    expect(sumRaw('1500000', '2500000')).toBe('4000000');
  });

  it('adds amounts beyond Number.MAX_SAFE_INTEGER exactly', () => {
    expect(sumRaw('9007199254740993', '1')).toBe('9007199254740994');
  });
});

describe('multiplyRaw', () => {
  it('scales a base-unit amount', () => {
    expect(multiplyRaw('100', 3)).toBe('300');
    expect(multiplyRaw('1', 0)).toBe('0');
  });
});

describe('formatResolvedAmount', () => {
  it('appends the symbol when one is supplied', () => {
    expect(
      formatResolvedAmount({ amount: '1.5', decimals: 18, raw: '1500000000000000000', truncated: false }, 'ETH')
    ).toBe('1.5 ETH');
  });

  it('omits the symbol when none is supplied', () => {
    expect(formatResolvedAmount({ amount: '1.5', decimals: 18, raw: '1500000000000000000', truncated: false })).toBe(
      '1.5'
    );
  });

  it('trims trailing zeros that add no information', () => {
    expect(
      formatResolvedAmount({ amount: '1.50000000', decimals: 8, raw: '150000000', truncated: false }, 'BTC')
    ).toBe('1.5 BTC');
  });
});

describe('clampForDisplay', () => {
  it('leaves a short amount untouched', () => {
    expect(clampForDisplay('1.5')).toEqual({ shown: '1.5', truncated: false });
  });

  it('truncates rather than rounding, and says so', () => {
    const result = clampForDisplay('0.123456789012', 6);
    expect(result.truncated).toBe(true);
    expect(result.shown).toBe('0.123456');
  });
});
