import type { AnomalyLevel, ChainId } from './chain';

export type WatchKind = 'wallet' | 'transaction' | 'contract' | 'token';

export interface WatchItem {
  id: string;
  kind: WatchKind;
  value: string;
  chain: ChainId;
  label?: string;
  status: AnomalyLevel;
  addedAt: number;
  assetId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  to: string;
  minutesAgo: number;
  level: AnomalyLevel | 'info';
}