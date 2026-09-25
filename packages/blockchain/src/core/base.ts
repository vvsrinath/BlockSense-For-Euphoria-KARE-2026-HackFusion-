/**
 * Base implementation of `BlockchainAdapter`.
 *
 * Every method requires a live provider. There is no mock fallback: a caller
 * that reaches this base has already decided which chain to use, and silently
 * returning fabricated data would be worse than failing loudly. The only
 * place a request is rejected is when no RPC URL is configured, which is a
 * deployment error rather than a data result.
 */

import type { Asset, ChainId, Transaction, Wallet, WalletActivity } from '@blocksense/shared';
import type {
  Balance,
  BaseAdapterOptions,
  BlockchainAdapter,
  ChainTip,
  HistoryOptions
} from './adapter';
import { ProviderError } from './errors';
import type { RequestPolicy } from './client';

export abstract class BaseAdapter implements BlockchainAdapter {
  abstract readonly id: ChainId;
  abstract readonly name: string;
  abstract readonly nativeSymbol: string;
  abstract readonly decimals: number;

  protected readonly options: BaseAdapterOptions;
  /** Per-request timeout/retry policy, applied by this adapter's transport calls. */
  protected readonly policy: Partial<RequestPolicy>;

  constructor(options: BaseAdapterOptions) {
    this.options = options;
    this.policy = options.policy ?? {};
  }

  get isLive(): boolean {
    return Boolean(this.options.rpcUrl);
  }

  /** Throw rather than fabricate when the chain has no provider configured. */
  protected requireLive(): string {
    const url = this.options.rpcUrl;
    if (!url) {
      throw ProviderError.rpcUnavailable(
        `No RPC URL is configured for ${this.name}. Set the provider URL for this chain.`,
        this.name
      );
    }
    return url;
  }

  /** Emit a `*_NOT_FOUND` provider error. Override to customise the message. */
  protected notFound(what: 'Transaction' | 'Wallet' | 'Asset' | 'Account' | 'Block', id: string): ProviderError {
    return ProviderError.notFound(what, id, this.name);
  }

  protected fail(message: string): ProviderError {
    return ProviderError.invalidRequest(message, this.name);
  }

  async getTransaction(_hash: string): Promise<Transaction> {
    throw this.notFound('Transaction', _hash);
  }

  /**
   * Build a wallet profile from the chain.
   *
   * History and balances are the only two things every chain can answer, so the
   * profile is derived from them rather than declared. A chain whose provider
   * cannot enumerate history (a bare EVM node, for instance) still returns a
   * real balance-based profile with the limitation stated in `statusNote`,
   * instead of an empty object that reads as "this address never transacted".
   */
  async getWallet(address: string): Promise<Wallet> {
    this.requireLive();
    const target = address.trim();

    let history: Transaction[] = [];
    let coverage: string | undefined;
    try {
      history = await this.getHistory(target, { limit: HISTORY_LIMIT, order: 'desc' });
    } catch (err) {
      if (!(err instanceof ProviderError)) throw err;
      if (err.code !== 'NOT_IMPLEMENTED') throw err;
      coverage =
        `${this.name} does not expose transaction history through this endpoint, so this profile is ` +
        'built from current balances only.';
    }

    let balances: Balance[] = [];
    try {
      balances = await this.getBalances(target);
    } catch (err) {
      if (!(err instanceof ProviderError)) throw err;
      // Balances are the last source of truth here; losing them is worth
      // reporting, but not worth failing a request that still has history.
      coverage = coverage ?? `Balances are unavailable on ${this.name} right now, so this profile uses history only.`;
    }

    return this.buildWallet(target, history, balances, coverage);
  }

  async getBalances(_address: string): Promise<Balance[]> {
    this.requireLive();
    return [];
  }

  async getHistory(_address: string, _options: HistoryOptions = {}): Promise<Transaction[]> {
    this.requireLive();
    return [];
  }

  async getAsset(identifier: string): Promise<Asset> {
    throw this.notFound('Asset', identifier);
  }

  async getTip(): Promise<ChainTip> {
    this.requireLive();
    throw ProviderError.rpcUnavailable(`${this.name} does not report a chain tip.`, this.name);
  }

  /** Derive the full profile from observed history and current balances. */
  private buildWallet(address: string, history: Transaction[], balances: Balance[], coverage?: string): Wallet {
    const lower = address.toLowerCase();
    const activity: WalletActivity[] = history.map((tx) => {
      const outgoing = tx.from.toLowerCase() === lower;
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
    });

    const timestamps = history.map((tx) => tx.timestamp).filter((t) => t > 0);
    const totalInUsd = sum(activity.filter((a) => a.direction === 'in').map((a) => a.valueUsd));
    const totalOutUsd = sum(activity.filter((a) => a.direction === 'out').map((a) => a.valueUsd));
    const counterparties = new Set(activity.map((a) => a.counterparty.toLowerCase()).filter(Boolean));
    const usdValues = activity.map((a) => a.valueUsd).filter((v) => v > 0).sort((a, b) => a - b);
    const medianUsd = median(usdValues);

    const firstSeen = timestamps.length ? Math.min(...timestamps) : 0;
    const lastActive = timestamps.length ? Math.max(...timestamps) : 0;
    const weeks = firstSeen ? Math.max(1, (Date.now() - firstSeen) / WEEK) : 0;
    const txPerWeek = weeks ? round(history.length / weeks, 2) : 0;

    return {
      address,
      chain: this.id,
      tags: buildTags(this.id, balances, history),
      firstSeen,
      lastActive,
      txCount: history.length,
      totalInUsd: round(totalInUsd, 2),
      totalOutUsd: round(totalOutUsd, 2),
      status: 'normal',
      statusNote: coverage ?? describeActivity(activity, firstSeen, lastActive),
      dna: {
        typicalAmount: typicalAmount(activity),
        typicalFrequency: typicalFrequency(activity),
        mostActive: mostActiveHour(activity),
        commonAsset: commonAsset(activity, this.nativeSymbol),
        counterparties: counterparties.size,
        medianUsd: round(medianUsd, 2),
        txPerWeek,
        traits: buildTraits({ activity, counterparties: counterparties.size, txPerWeek, medianUsd, balances })
      },
      activity
    };
  }

  /** A structurally valid, empty wallet, for adapters that need to force one. */
  protected emptyWallet(address: string): Wallet {
    return this.buildWallet(address.trim(), [], []);
  }
}

const WEEK = 604_800_000;
/**
 * How much history a profile is built from.
 *
 * A behavioural profile needs enough observations to have a median and a weekly
 * rate, but every extra row is another provider call on chains that page slowly.
 */
const HISTORY_LIMIT = 200;

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** A one-line statement of what was actually observed. */
function describeActivity(activity: WalletActivity[], firstSeen: number, lastActive: number): string {
  if (activity.length === 0) return 'No indexed activity found for this address.';
  const days = Math.max(1, Math.round((lastActive - firstSeen) / 86_400_000));
  return `${activity.length} observed transfer${activity.length === 1 ? '' : 's'} across ${days} day${days === 1 ? '' : 's'}.`;
}

/** The transfer closest to the median value, in its own units. */
function typicalAmount(activity: WalletActivity[]): string {
  const withAmounts = activity
    .map((a) => ({ a, value: Number(a.amount) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0)
    .sort((x, y) => x.value - y.value);
  if (withAmounts.length === 0) return '—';
  return withAmounts[Math.floor(withAmounts.length / 2)].a.amount;
}

/** Median gap between transfers, phrased the way a reader thinks about it. */
function typicalFrequency(activity: WalletActivity[]): string {
  const times = activity.map((a) => a.timestamp).filter((t) => t > 0).sort((a, b) => a - b);
  if (times.length < 2) return activity.length ? 'Once' : '—';
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i += 1) gaps.push(times[i] - times[i - 1]);
  const days = median(gaps.sort((a, b) => a - b)) / 86_400_000;
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} hours apart`;
  if (days < 60) return `${Math.round(days)} days apart`;
  return `${round(days / 30, 1)} months apart`;
}

/** The hour of day with the most transfers, in UTC. */
function mostActiveHour(activity: WalletActivity[]): string {
  if (activity.length === 0) return '—';
  const hours = new Array(24).fill(0) as number[];
  for (const entry of activity) {
    if (entry.timestamp > 0) hours[new Date(entry.timestamp).getUTCHours()] += 1;
  }
  const peak = hours.indexOf(Math.max(...hours));
  return `${String(peak).padStart(2, '0')}:00–${String((peak + 1) % 24).padStart(2, '0')}:00 UTC`;
}

function commonAsset(activity: WalletActivity[], fallback: string): string {
  const counts = new Map<string, number>();
  for (const entry of activity) counts.set(entry.symbol, (counts.get(entry.symbol) ?? 0) + 1);
  let best = fallback;
  let bestCount = 0;
  for (const [symbol, count] of counts) {
    if (count > bestCount) {
      best = symbol;
      bestCount = count;
    }
  }
  return best;
}

/** Labels a reader can act on, derived from holdings rather than guessed. */
function buildTags(chain: ChainId, balances: Balance[], history: Transaction[]): string[] {
  const tags: string[] = [];
  const held = balances.filter((b) => b.amount > 0);

  if (held.length > 0) tags.push('Holds balance');
  if (balances.length > 0 && held.length === 0) tags.push('No current balance');
  if (history.length === 0) tags.push('No indexed history');
  if (chain === 'bitcoin' || chain === 'solana' || chain === 'tron' || chain === 'bnb' || chain === 'ethereum') {
    // Chains where a contract deployment address is indistinguishable from an
    // EOA without an indexer; a failed history lookup above is the real signal.
    if (history.length === 0) tags.push('Unverified activity');
  }
  return tags;
}

function buildTraits(input: {
  activity: WalletActivity[];
  counterparties: number;
  txPerWeek: number;
  medianUsd: number;
  balances: Balance[];
}): Wallet['dna']['traits'] {
  const { activity, counterparties, txPerWeek, medianUsd, balances } = input;
  const traits: Wallet['dna']['traits'] = [];

  if (activity.length > 0) {
    const ratio = counterparties / activity.length;
    const concentration = ratio < 0.4 ? 'focused' : ratio < 0.8 ? 'mixed' : 'scattered';
    traits.push({
      label: 'Counterparty spread',
      value: round(ratio, 2),
      descriptor: concentration,
      description: `${counterparties} distinct addresses across ${activity.length} transfers.`
    });
  }

  if (medianUsd > 0) {
    traits.push({
      label: 'Typical transfer size',
      value: round(medianUsd, 2),
      descriptor: medianUsd >= 10_000 ? 'large' : medianUsd >= 100 ? 'mid' : 'small',
      description: `The median observed transfer is about $${round(medianUsd, 2)}.`
    });
  }

  if (txPerWeek > 0) {
    traits.push({
      label: 'Activity rate',
      value: txPerWeek,
      descriptor: txPerWeek >= 20 ? 'very active' : txPerWeek >= 5 ? 'active' : 'occasional',
      description: `About ${txPerWeek} transfers per week since first seen.`
    });
  }

  const held = balances.filter((b) => b.amount > 0);
  if (held.length > 0) {
    traits.push({
      label: 'Holdings',
      value: held.length,
      descriptor: held.length > 5 ? 'diversified' : 'concentrated',
      description: `Holds ${held.map((b) => `${b.amount} ${b.symbol}`).join(', ')}.`
    });
  }

  return traits;
}
