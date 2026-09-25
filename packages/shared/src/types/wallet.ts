import type { AnomalyLevel, ChainId } from './chain';

export interface DnaTrait {
  label: string;
  value: number;
  descriptor: string;
  description: string;
}

export interface WalletActivity {
  hash: string;
  direction: 'in' | 'out';
  counterparty: string;
  symbol: string;
  amount: string;
  valueUsd: number;
  timestamp: number;
  level: AnomalyLevel;
}

export interface Wallet {
  address: string;
  chain: ChainId;
  label?: string;
  tags: string[];
  firstSeen: number;
  lastActive: number;
  txCount: number;
  totalInUsd: number;
  totalOutUsd: number;
  status: AnomalyLevel;
  statusNote: string;
  spike?: boolean;
  dna: {
    typicalAmount: string;
    typicalFrequency: string;
    mostActive: string;
    commonAsset: string;
    counterparties: number;
    medianUsd: number;
    txPerWeek: number;
    traits: DnaTrait[];
  };
  activity: WalletActivity[];
}

export type BehaviorRange = '7D' | '30D' | '90D' | '1Y' | 'ALL';
export type BehaviorMetric = 'frequency' | 'average' | 'volume';

export interface BehaviorPoint {
  label: string;
  inCount: number;
  outCount: number;
  inAvg: number;
  outAvg: number;
  inVolume: number;
  outVolume: number;
}