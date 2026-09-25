import { mockWallets } from '../mock/mockWallets';
import { createRandom, fakeAddress, fakeHash, hashString } from '@blocksense/shared';
import type { BehaviorPoint, BehaviorRange, Wallet, WalletActivity } from '@blocksense/shared';
import { mockRequest, sameValue } from '@blocksense/blockchain';

const DAY = 86400000;
const DEMO_PRICES: Record<string, number> = { BTC: 64840, ETH: 3534, SOL: 140, BNB: 595, TRX: 0.232, USDC: 1, USDT: 1 };

export function findWallet(address: string): Wallet | undefined {
  return mockWallets.find((w) => sameValue(w.address, address));
}

export function allWallets(): Wallet[] {
  return mockWallets;
}

export async function getWallet(address: string): Promise<Wallet | null> {
  return mockRequest(() => findWallet(address) ?? null, 180);
}

function olderActivity(wallet: Wallet, count: number): WalletActivity[] {
  const rand = createRandom(hashString(`${wallet.address}:activity`));
  const start = wallet.activity.length ? wallet.activity[wallet.activity.length - 1].timestamp : wallet.lastActive;
  const rows: WalletActivity[] = [];
  let ts = start;
  for (let i = 0; i < count; i += 1) {
    ts -= Math.round(7 / wallet.dna.txPerWeek * DAY * (0.4 + rand() * 1.2));
    const value = Math.round(wallet.dna.medianUsd * (0.5 + rand()));
    rows.push({
      hash: fakeHash(rand, wallet.chain),
      direction: rand() > 0.5 ? 'in' : 'out',
      counterparty: fakeAddress(rand, wallet.chain),
      symbol: wallet.dna.commonAsset,
      amount: String(Number((value / (DEMO_PRICES[wallet.dna.commonAsset] ?? 1)).toFixed(4))),
      valueUsd: value,
      timestamp: ts,
      level: 'normal'
    });
  }
  return rows;
}

export async function getWalletActivity(
address: string,
page: number,
pageSize: number)
: Promise<{rows: WalletActivity[];total: number;}> {
  return mockRequest(() => {
    const wallet = findWallet(address);
    if (!wallet) return { rows: [], total: 0 };
    const total = Math.min(wallet.txCount, 40);
    const all = [...wallet.activity, ...olderActivity(wallet, total - wallet.activity.length)];
    return { rows: all.slice(page * pageSize, page * pageSize + pageSize), total };
  }, 90);
}

const RANGE_STEPS: Record<Exclude<BehaviorRange, 'ALL'>, {points: number;stepDays: number;monthly: boolean;}> = {
  '7D': { points: 7, stepDays: 1, monthly: false },
  '30D': { points: 30, stepDays: 1, monthly: false },
  '90D': { points: 13, stepDays: 7, monthly: false },
  '1Y': { points: 12, stepDays: 30.4, monthly: true }
};

function rangeConfig(wallet: Wallet, range: BehaviorRange) {
  if (range !== 'ALL') return RANGE_STEPS[range];
  const days = (wallet.lastActive - wallet.firstSeen) / DAY;
  return { points: Math.min(16, Math.max(4, Math.ceil(days / 91))), stepDays: 91, monthly: true };
}

export function buildBehaviorSeries(wallet: Wallet, range: BehaviorRange): BehaviorPoint[] {
  const rand = createRandom(hashString(wallet.address + range));
  const { points, stepDays, monthly } = rangeConfig(wallet, range);
  const perDay = wallet.dna.txPerWeek / 7;
  const fmt = new Intl.DateTimeFormat('en-US', monthly ? { month: 'short', year: '2-digit', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const out: BehaviorPoint[] = [];

  for (let i = 0; i < points; i += 1) {
    const date = wallet.lastActive - (points - 1 - i) * stepDays * DAY;
    const expected = perDay * stepDays;
    let inCount = Math.max(0, Math.round(expected * 0.48 * (0.6 + rand() * 0.8)));
    let outCount = Math.max(0, Math.round(expected * 0.52 * (0.6 + rand() * 0.8)));
    const inAvg = Math.round(wallet.dna.medianUsd * (0.75 + rand() * 0.5));
    let outAvg = Math.round(wallet.dna.medianUsd * (0.75 + rand() * 0.5));

    if (wallet.spike && i === points - 1) {
      if (range === '7D' || range === '30D') {
        outCount = Math.max(outCount, Math.round(Math.max(3, expected) * 8));
        outAvg = Math.round(wallet.dna.medianUsd * 12.5);
      } else {
        outCount += 20;
        outAvg = Math.round(outAvg * 2.4);
      }
      inCount = Math.max(inCount, 1);
    }

    out.push({
      label: fmt.format(date),
      inCount,
      outCount,
      inAvg,
      outAvg,
      inVolume: inCount * inAvg,
      outVolume: outCount * outAvg
    });
  }
  return out;
}

export async function getBehaviorSeries(address: string, range: BehaviorRange): Promise<BehaviorPoint[]> {
  return mockRequest(() => {
    const wallet = findWallet(address);
    return wallet ? buildBehaviorSeries(wallet, range) : [];
  }, 60);
}