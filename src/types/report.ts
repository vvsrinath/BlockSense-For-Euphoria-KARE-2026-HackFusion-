import type { AnomalyLevel, ChainId } from './chain';

export interface ReportMeta {
  id: string;
  txHash: string;
  createdAt: number;
}

export interface ReportSection {
  id: string;
  title: string;
  body: string;
  facts?: {label: string;value: string;}[];
}

export interface Report {
  id: string;
  title: string;
  txHash: string;
  subject: string;
  chain: ChainId;
  assetLabel: string;
  score: number;
  level: AnomalyLevel;
  createdAt: number;
  findings: string[];
  sections: ReportSection[];
}