export type ChainId = 'bitcoin' | 'ethereum' | 'bnb' | 'tron' | 'solana';
export type ChainFilter = ChainId | 'all';

export type AnomalyLevel = 'normal' | 'unusual' | 'high';
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