import type { AnomalyLevel, ChainId, SignalLevel } from '../types/chain';

/** Severity ordering, lowest to highest. Used for sorting and max() reductions. */
export const LEVEL_SEVERITY: Record<AnomalyLevel | SignalLevel, number> = {
  info: 0,
  normal: 0,
  unusual: 1,
  high: 2
};

export const ANOMALY_LEVELS: AnomalyLevel[] = ['normal', 'unusual', 'high'];

/** Human-readable labels for a level. Presentation-neutral, safe for the API. */
export const LEVEL_LABELS: Record<AnomalyLevel | SignalLevel, string> = {
  normal: 'Normal',
  info: 'Info',
  unusual: 'Unusual',
  high: 'High'
};

/** Score bands that map a numeric 0-100 anomaly score onto a level. */
export const SCORE_THRESHOLDS = {
  unusual: 40,
  high: 70
} as const;

/** Every chain BlockSense can analyse. */
export const SUPPORTED_CHAINS: ChainId[] = ['bitcoin', 'ethereum', 'bnb', 'tron', 'solana'];

/** Chains that share the EVM execution model and therefore one adapter family. */
export const EVM_CHAINS: ChainId[] = ['ethereum', 'bnb'];

/** Chains whose block unit is a slot rather than a block. */
export const SLOT_BASED_CHAINS: ChainId[] = ['solana'];

/** Default number of items returned by paginated list endpoints. */
export const DEFAULT_PAGE_SIZE = 25;

/** Hard ceiling on page size, so a client cannot request an unbounded response. */
export const MAX_PAGE_SIZE = 100;
