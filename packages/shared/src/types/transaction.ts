import type { AnomalyLevel, ChainId, SignalLevel } from './chain';
import type { NodeKind } from './network';

export type SignalKind = 'amount' | 'frequency' | 'relationship' | 'time' | 'history' | 'asset';

export interface TransactionAsset {
  type: 'native' | 'token' | 'nft';
  name: string;
  symbol: string;
  amount?: string;
  contractAddress?: string;
  tokenId?: string;
  standard?: string;
  decimals?: number;
  collection?: string;
  valueUsd?: number;
  direction?: 'sent' | 'received';
}

export interface AnomalySignal {
  id: string;
  kind: SignalKind;
  label: string;
  value: string;
  detail: string;
  level: SignalLevel;
}

/**
 * How much evidence an anomaly judgement rests on.
 *
 * Deliberately separate from the level: a high score with low confidence is a
 * prompt to investigate, not a finding.
 */
export type Confidence = 'low' | 'medium' | 'high';

export interface TransactionAnomaly {
  score: number;
  level: AnomalyLevel;
  confidence: Confidence;
  signals: string[];
  details: AnomalySignal[];
}

export interface TechnicalField {
  label: string;
  value: string;
  hint?: string;
}

export interface RelatedWallet {
  address: string;
  label: string;
  kind: NodeKind;
  relationship: string;
  level: AnomalyLevel;
}

export interface Transaction {
  hash: string;
  chain: ChainId;
  from: string;
  to: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  block: number;
  confirmations: number;
  isDemo?: boolean;
  asset: TransactionAsset;
  assets?: TransactionAsset[];
  fee?: {
    amount: string;
    symbol: string;
    valueUsd?: number;
  };
  anomaly?: TransactionAnomaly;
  summary: string[];
  technical: TechnicalField[];
  related: RelatedWallet[];
}