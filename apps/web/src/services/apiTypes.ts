/**
 * The response shapes `api` promises, declared once.
 *
 * The client picks between a mock transport and a real HTTP transport at build
 * time. Without a shared contract the exported client becomes a *union* of the
 * two implementations, so a `chain` typed `ChainId` in one and `string` in the
 * other and every caller has to narrow it. Both transports are checked against
 * these interfaces instead, so callers always see one stable set of types.
 */

import type {
  Asset,
  ChainId,
  NetworkGraphData,
  Report,
  Transaction,
  Wallet
} from '@blocksense/shared';

export interface ChainHealthEntry {
  id: string;
  live: boolean;
  status: 'up' | 'down';
  height?: number;
  unit?: string;
  latencyMs?: number;
  error?: string;
}

export interface HealthResponse {
  status: string;
  env: string;
  dataSource: string;
  chains: { id: ChainId; live: boolean }[];
}

export interface ChainHealthResponse {
  status: string;
  chains: ChainHealthEntry[];
}

export interface ChainSummary {
  id: ChainId;
  name: string;
  symbol: string;
  live: boolean;
}

export interface IndexResponse {
  name: string;
  version: string;
  dataSource: string;
  limits: {
    cacheTtlSeconds: number;
    maxGraphNodes: number;
    maxGraphEdges: number;
    requestTimeoutMs: number;
  };
  routes: { method: string; path: string }[];
}

export interface BalanceEntry {
  assetId: string;
  symbol: string;
  amount: number;
  decimals: number;
  valueUsd?: number;
}

export interface SearchCandidate {
  chain: ChainId;
  kind: string;
  reason: string;
}

export interface SearchResponse {
  query: string;
  kind: string;
  candidates: SearchCandidate[];
  ambiguous?: boolean;
  resolved?: {
    chain: ChainId;
    type: 'wallet' | 'transaction';
    data: Transaction | Wallet;
  };
  error?: { code: string; message: string };
}

export interface AnalysisResponse {
  transaction: Transaction;
  score: { score: number; level: string; contributing: unknown[] };
  findings: { level: string; title: string; body: string }[];
  headline: string;
  dna: unknown;
  network?: NetworkGraphData | null;
}

export interface ReportListResponse {
  total: number;
  reports: Omit<Report, 'sections'>[];
}

export interface ApiClient {
  health: () => Promise<HealthResponse>;
  chainHealth: () => Promise<ChainHealthResponse>;
  chains: () => Promise<ChainSummary[]>;
  index: () => Promise<IndexResponse>;
  transaction: (chain: ChainId, hash: string) => Promise<Transaction>;
  wallet: (chain: ChainId, address: string) => Promise<Wallet>;
  walletHistory: (chain: ChainId, address: string, limit?: number) => Promise<Transaction[]>;
  walletBalances: (chain: ChainId, address: string) => Promise<BalanceEntry[]>;
  network: (chain: ChainId, address: string, depth?: number) => Promise<NetworkGraphData>;
  asset: (chain: ChainId, identifier: string) => Promise<Asset>;
  search: (query: string, chain?: ChainId) => Promise<SearchResponse>;
  analyze: (chain: ChainId, hash: string, address?: string) => Promise<AnalysisResponse>;
  createReport: (chain: ChainId, hash: string, address?: string) => Promise<Report>;
  report: (id: string) => Promise<Report | null>;
  reports: () => Promise<ReportListResponse>;
}
