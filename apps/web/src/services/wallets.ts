import { api } from './api';
import { knownWallet, recentWallets, rememberWallet } from './workspace';
import { detectInput } from '@blocksense/blockchain';
import type { BehaviorPoint, BehaviorRange, ChainId, Transaction, Wallet, WalletActivity } from '@blocksense/shared';

const DAY = 86_400_000;

/** Fetch a wallet profile and remember it for the local history list. */
export async function getWallet(address: string, chain?: ChainId): Promise<Wallet> {
  const resolved = chain ?? detectInput(address).chains[0] ?? 'ethereum';
  const wallet = await api.wallet(resolved, address);
  rememberWallet(wallet);
  return wallet;
}

/** The stored copy of a wallet, for synchronous rendering. */
export function findWallet(address: string): Wallet | undefined {
  return knownWallet(address);
}

/** Wallets opened in this workspace. */
export async function listKnownWallets(): Promise<Wallet[]> {
  return recentWallets();
}

/**
 * Wallet activity, paginated.
 *
 * Slicing happens here rather than in the browser because the API returns a
 * bounded page; requesting a page the chain cannot supply would be a lie about
 * what is on-chain.
 */
export async function getWalletActivity(
  address: string,
  page: number,
  pageSize: number,
  chain?: ChainId
): Promise<{ rows: WalletActivity[]; total: number }> {
  const resolved = chain ?? detectInput(address).chains[0] ?? 'ethereum';
  const history = await api.walletHistory(resolved, address, Math.max(page * pageSize + pageSize, pageSize));

  const rows = history
    .slice(page * pageSize, page * pageSize + pageSize)
    .map((tx: Transaction) => toActivity(tx, address));

  return { rows, total: history.length };
}

function toActivity(tx: Transaction, focus: string): WalletActivity {
  const outgoing = tx.from.toLowerCase() === focus.toLowerCase();
  return {
    hash: tx.hash,
    direction: outgoing ? 'out' : 'in',
    counterparty: outgoing ? tx.to : tx.from,
    symbol: tx.asset.symbol,
    amount: tx.asset.amount ?? '0',
    valueUsd: tx.asset.valueUsd ?? 0,
    timestamp: tx.timestamp,
    level: tx.anomaly?.level ?? 'normal'
  };
}

const RANGE_DAYS: Record<Exclude<BehaviorRange, 'ALL'>, { points: number; stepDays: number; monthly: boolean }> = {
  '7D': { points: 7, stepDays: 1, monthly: false },
  '30D': { points: 30, stepDays: 1, monthly: false },
  '90D': { points: 13, stepDays: 7, monthly: false },
  '1Y': { points: 12, stepDays: 30, monthly: true }
};

/**
 * Bucket real transactions into a behaviour series.
 *
 * This used to synthesise a plausible-looking series from a seeded random
 * number. A chart of invented data is worse than an empty one, so each point
 * now counts what actually happened in that window, and windows with no
 * activity read as zero rather than being padded into a nicer shape.
 *
 * `focus` is the wallet being charted: without it, inbound and outbound cannot
 * be told apart, because a transaction on its own says only who sent it.
 */
export function buildBehaviorSeries(
  history: Transaction[],
  range: BehaviorRange,
  focus?: string,
  now = Date.now()
): BehaviorPoint[] {
  const { points, stepDays, monthly } = rangeConfig(history, range, now);

  const buckets: BehaviorPoint[] = Array.from({ length: points }, (_, i) => {
    const end = now - (points - 1 - i) * stepDays * DAY;
    return {
      label: new Intl.DateTimeFormat(
        'en-US',
        monthly
          ? { month: 'short', year: '2-digit', timeZone: 'UTC' }
          : { month: 'short', day: 'numeric', timeZone: 'UTC' }
      ).format(end),
      inCount: 0,
      outCount: 0,
      inAvg: 0,
      outAvg: 0,
      inVolume: 0,
      outVolume: 0
    };
  });

  const span = stepDays * DAY;
  const first = now - points * span;
  const focusLower = focus?.toLowerCase();

  for (const tx of history) {
    if (tx.timestamp < first || tx.timestamp > now) continue;
    // The oldest window is cut off by the range, so counting it would
    // under-report. Skip it rather than show a misleading dip.
    if (tx.timestamp < first + span) continue;

    const bucket = buckets[Math.min(points - 1, Math.floor((tx.timestamp - first) / span))];
    if (!bucket) continue;

    const value = tx.asset.valueUsd ?? 0;
    const outgoing = focusLower ? tx.from.toLowerCase() === focusLower : false;

    if (outgoing) {
      bucket.outCount += 1;
      bucket.outVolume += value;
      bucket.outAvg = bucket.outVolume / bucket.outCount;
    } else {
      bucket.inCount += 1;
      bucket.inVolume += value;
      bucket.inAvg = bucket.inVolume / bucket.inCount;
    }
  }

  return buckets;
}

function rangeConfig(history: Transaction[], range: BehaviorRange, now: number) {
  if (range !== 'ALL') return RANGE_DAYS[range];
  const oldest = history.reduce((min, tx) => Math.min(min, tx.timestamp), now);
  const days = Math.max(1, (now - oldest) / DAY);
  return { points: Math.min(16, Math.max(4, Math.ceil(days / 91))), stepDays: 91, monthly: true };
}

export async function getBehaviorSeries(
  address: string,
  range: BehaviorRange,
  chain?: ChainId
): Promise<BehaviorPoint[]> {
  const resolved = chain ?? detectInput(address).chains[0] ?? 'ethereum';
  const history = await api.walletHistory(resolved, address, 200);
  return buildBehaviorSeries(history, range, address);
}
