/**
 * Exact amount extraction.
 *
 * Getting an amount right is the difference between a useful tool and a
 * misleading one. A token with 6 decimals and a raw value of `1500000` is
 * `1.5`, not `1500000`. Everything here works in decimal strings and bigints,
 * never floats, because floats silently lose precision above 2^53.
 */

import type { Asset, ChainId, TransactionAsset } from '@blocksense/shared';

/** A raw on-chain amount, still in the asset's base units. */
export interface RawAmount {
  /** Integer string in base units, e.g. "1500000". */
  raw: string;
  decimals: number;
}

/** An amount that has been safely converted to a human decimal. */
export interface ResolvedAmount {
  /** Human-readable decimal, e.g. "1.5". Trailing zeros trimmed. */
  amount: string;
  decimals: number;
  /** True when the raw value had more significant digits than `decimals` allowed. */
  truncated: boolean;
  raw: string;
}

/** Native-asset decimals for each supported chain. */
export const NATIVE_DECIMALS: Record<ChainId, number> = {
  bitcoin: 8,
  ethereum: 18,
  bnb: 18,
  tron: 6,
  solana: 9
};

/** Divisor for a given decimal count, as a bigint. */
export function unitFor(decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new RangeError(`decimals must be an integer between 0 and 36, received ${decimals}`);
  }
  return 10n ** BigInt(decimals);
}

/**
 * Convert base units into an exact decimal string.
 *
 * ```ts
 * resolveAmount({ raw: '1500000', decimals: 6 }).amount // '1.5'
 * ```
 */
export function resolveAmount(input: RawAmount): ResolvedAmount {
  const raw = input.raw.trim();
  if (!/^-?\d+$/.test(raw)) {
    throw new TypeError(`Raw amount must be an integer string, received "${input.raw}".`);
  }
  if (input.decimals === 0) {
    return { amount: raw, decimals: 0, truncated: false, raw };
  }

  const negative = raw.startsWith('-');
  const digits = (negative ? raw.slice(1) : raw).padStart(input.decimals + 1, '0');
  const whole = digits.slice(0, digits.length - input.decimals);
  const fraction = digits.slice(digits.length - input.decimals).replace(/0+$/, '');
  const amount = fraction ? `${negative ? '-' : ''}${whole}.${fraction}` : `${negative ? '-' : ''}${whole}`;

  return { amount, decimals: input.decimals, truncated: false, raw };
}

/** Convert a human decimal amount back into base units. */
export function toRawAmount(amount: string | number, decimals: number): string {
  const [whole = '0', fraction = ''] = String(amount).trim().split('.');
  if (!/^\d+$/.test(whole) || (fraction && !/^\d+$/.test(fraction))) {
    throw new TypeError(`Amount must be a decimal number, received "${amount}".`);
  }
  const padded = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  const value = BigInt(whole) * unitFor(decimals) + BigInt(padded || '0');
  return value.toString();
}

/** Add two base-unit amounts without losing precision. */
export function sumRaw(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}

/** Multiply a base-unit amount by a whole-number multiplier, e.g. an NFT count. */
export function multiplyRaw(a: string, factor: number): string {
  if (!Number.isInteger(factor)) throw new TypeError('factor must be a whole number');
  return (BigInt(a) * BigInt(factor)).toString();
}

/**
 * Render a resolved amount with its symbol, trimming precision that adds no
 * information: `1.50000000 ETH` becomes `1.5 ETH`.
 */
export function formatResolvedAmount(input: ResolvedAmount, symbol?: string): string {
  const trimmed = trimTrailingZeros(input.amount);
  return symbol ? `${trimmed} ${symbol}` : trimmed;
}

/**
 * Limit an amount to a display precision without altering its value.
 * Used when a raw value carries more precision than the UI can show.
 */
export function clampForDisplay(amount: string, maxDecimals = 8): { shown: string; truncated: boolean } {
  const negative = amount.startsWith('-');
  const [whole = '0', fraction = ''] = (negative ? amount.slice(1) : amount).split('.');
  if (fraction.length <= maxDecimals) return { shown: amount, truncated: false };
  const kept = fraction.slice(0, maxDecimals).replace(/0+$/, '');
  const shown = kept ? `${negative ? '-' : ''}${whole}.${kept}` : `${negative ? '-' : ''}${whole}`;
  return { shown, truncated: true };
}

function trimTrailingZeros(value: string): string {
  if (!value.includes('.')) return value;
  return value.replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Build the display amount for an asset, applying the right decimal count for
 * each asset type. NFTs have no meaningful numeric amount, so they render as
 * an identifier instead.
 */
export function amountForAsset(asset: TransactionAsset): ResolvedAmount | null {
  if (asset.type === 'nft') return null;
  const decimals = asset.decimals ?? 18;
  if (asset.amount === undefined) return null;
  return resolveAmount({ raw: toRawAmount(asset.amount, decimals), decimals });
}

export function nativeDecimals(chain: ChainId): number {
  return NATIVE_DECIMALS[chain];
}

/** Decimals an asset should be read at, falling back to the chain's native value. */
export function decimalsForAsset(asset: Pick<Asset, 'decimals'>, chain: ChainId): number {
  return asset.decimals ?? nativeDecimals(chain);
}
