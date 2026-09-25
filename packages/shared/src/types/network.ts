import type { AnomalyLevel, ChainId } from './chain';

export type NodeKind = 'center' | 'wallet' | 'exchange' | 'defi' | 'contract' | 'new' | 'high';

export interface NetworkEntity {
  id: string;
  address: string;
  label: string;
  kind: NodeKind;
  level: AnomalyLevel;
  firstSeen: number;
  txCount: number;
  totalUsd: number;
  relationship: string;
  parentId?: string;
}

export interface NetworkLink {
  id: string;
  source: string;
  target: string;
  txCount: number;
  volumeUsd: number;
  flagged: boolean;
}

export interface NetworkGraphData {
  centerId: string;
  chain: ChainId;
  entities: NetworkEntity[];
  links: NetworkLink[];
}