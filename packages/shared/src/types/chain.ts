export type ChainId = 'bitcoin' | 'ethereum' | 'bnb' | 'tron' | 'solana';
export type ChainFilter = ChainId | 'all';

/**
 * Severity of an observed behaviour.
 *
 * `elevated` sits between `unusual` and `high` so that "worth a look" and
 * "act now" are different claims. Collapsing them into one label made every
 * non-trivial finding read as urgent, which is the failure mode a risk score is
 * supposed to avoid.
 */
export type AnomalyLevel = 'normal' | 'unusual' | 'elevated' | 'high';
export type SignalLevel = AnomalyLevel | 'info';

export interface ChainInfo {
  id: ChainId;
  name: string;
  symbol: string;
  color: string;
  latestLabel: 'Latest block' | 'Latest slot';
  latestHeight: number;
  avgBlockTime: string;
  addressExplorer: string;
  txExplorer: string;
}