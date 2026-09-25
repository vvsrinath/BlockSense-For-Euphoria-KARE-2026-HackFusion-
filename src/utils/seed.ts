import type { ChainId } from '../types/chain';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const HEX = '0123456789abcdef';

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRandom(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick(chars: string, rand: () => number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(rand() * chars.length)];
  return out;
}

export function fakeHash(rand: () => number, chain: ChainId): string {
  if (chain === 'solana') return pick(BASE58, rand, 88);
  const hex = pick(HEX, rand, 64);
  return chain === 'ethereum' || chain === 'bnb' ? `0x${hex}` : hex;
}

export function fakeAddress(rand: () => number, chain: ChainId): string {
  switch (chain) {
    case 'bitcoin':
      return `bc1q${pick(BECH32, rand, 38)}`;
    case 'tron':
      return `T${pick(BASE58, rand, 33)}`;
    case 'solana':
      return pick(BASE58, rand, 44);
    default:{
        const hex = pick(HEX, rand, 40);
        return `0x${hex.
        split('').
        map((c, i) => i % 3 === 0 ? c.toUpperCase() : c).
        join('')}`;
      }
  }
}