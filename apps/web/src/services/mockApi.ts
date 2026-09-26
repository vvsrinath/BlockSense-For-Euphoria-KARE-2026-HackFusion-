import { MOCK_DATA } from '@blocksense/shared';
import type { ChainId, Transaction, Wallet, Asset, NetworkGraphData, Report } from '@blocksense/shared';
import type {
  AnalysisResponse,
  BalanceEntry,
  ChainHealthResponse,
  ChainSummary,
  HealthResponse,
  ReportListResponse,
  SearchResponse
} from './apiTypes';

const CHAINS: ChainId[] = ['ethereum', 'bnb', 'tron', 'solana', 'bitcoin'];

let transactions: Transaction[] = [];
let wallets: Wallet[] = [];
let assets: Asset[] = [];
let reports: Report[] = [];
let initialized = false;

function rand(): number {
  return Math.random();
}

function ensureInitialized(): void {
  if (initialized) return;
  transactions = MOCK_DATA.generateMultipleTransactions(20);
  wallets = MOCK_DATA.generateMultipleWallets(10);
  assets = CHAINS.flatMap((chain) => MOCK_DATA.generateAssetsForChain(rand, chain));
  reports = Array.from({ length: 5 }, () => {
    const tx = transactions[Math.floor(rand() * transactions.length)];
    return MOCK_DATA.generateReport(rand, tx.hash, tx.chain);
  });
  initialized = true;
}

function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms + rand() * 300));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export const mockApi = {
  async getHealth(): Promise<HealthResponse> {
    await delay(100);
    return {
      status: 'ok',
      env: 'demo',
      dataSource: 'mock',
      chains: CHAINS.map((id) => ({ id, live: false }))
    };
  },
  async getChains(): Promise<ChainSummary[]> {
    await delay(50);
    return [
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', live: false },
      { id: 'bnb', name: 'BNB Chain', symbol: 'BNB', live: false },
      { id: 'tron', name: 'TRON', symbol: 'TRX', live: false },
      { id: 'solana', name: 'Solana', symbol: 'SOL', live: false },
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', live: false }
    ];
  },
  async getChainHealth(): Promise<ChainHealthResponse> {
    await delay(100);
    return {
      // The real endpoint reports an overall rollup alongside the per-chain
      // entries, so the mock matches that shape rather than a subset of it.
      status: 'ok',
      chains: [
        { id: 'ethereum', live: false, status: 'up', height: 19_283_411, unit: 'block', latencyMs: 45 },
        { id: 'bnb', live: false, status: 'up', height: 36_482_112, unit: 'block', latencyMs: 32 },
        { id: 'tron', live: false, status: 'up', height: 62_189_441, unit: 'block', latencyMs: 28 },
        { id: 'solana', live: false, status: 'up', height: 281_994_221, unit: 'slot', latencyMs: 12 },
        { id: 'bitcoin', live: false, status: 'up', height: 892_431, unit: 'block', latencyMs: 67 }
      ]
    };
  },
  async search(query: string): Promise<SearchResponse> {
    await delay(150);
    // Without this the arrays below are still empty on the first search, so the
    // lookup returns `undefined` and the caller crashes instead of showing a
    // result.
    ensureInitialized();

    if (query.length > 40) {
      const tx = pick(transactions);
      return {
        query,
        kind: 'transaction',
        // The chain is read off the chosen record, not rolled separately, so
        // the candidate chain can never disagree with the payload.
        candidates: [{ chain: tx.chain, kind: 'transaction', reason: `Hash matches ${tx.chain}` }],
        resolved: { chain: tx.chain, type: 'transaction', data: tx }
      };
    }

    const wallet = pick(wallets);
    return {
      query,
      kind: 'address',
      candidates: [{ chain: wallet.chain, kind: 'address', reason: `Address matches ${wallet.chain}` }],
      resolved: { chain: wallet.chain, type: 'wallet', data: wallet }
    };
  },  async getTransaction(hash: string, chain?: ChainId): Promise<Transaction> {
    await delay(200);
    ensureInitialized();
    const existing = transactions.find((t) => t.hash === hash);
    if (existing) return existing;
    // Generated on the requested chain so the URL a user opened and the record
    // they land on describe the same chain.
    const created = MOCK_DATA.generateTransaction(rand, hash, chain);
    transactions.push(created);
    return created;
  },
  async getWallet(address: string, chain?: ChainId): Promise<Wallet> {
    await delay(200);
    ensureInitialized();
    const existing = wallets.find((w) => w.address === address);
    if (existing) return existing;
    const created = MOCK_DATA.generateWallet(rand, address, chain);
    wallets.push(created);
    return created;
  },
  async getWalletHistory(address: string, limit = 25): Promise<Transaction[]> {
    await delay(200);
    ensureInitialized();
    const wallet = wallets.find((w) => w.address === address);
    if (wallet) {
      return wallet.activity.slice(0, limit).map((a) => ({
        hash: a.hash,
        chain: wallet.chain,
        from: a.direction === 'out' ? address : a.counterparty,
        to: a.direction === 'out' ? a.counterparty : address,
        timestamp: a.timestamp,
        status: 'confirmed' as const,
        block: 0,
        confirmations: 0,
        isDemo: true,
        asset: { type: 'token' as const, name: a.symbol, symbol: a.symbol, amount: a.amount, valueUsd: a.valueUsd },
        fee: { amount: '0.001', symbol: 'ETH', valueUsd: 2 },
        // Reuse the generator's anomaly shape so history rows satisfy the same
        // `TransactionAnomaly` contract as full transaction records.
        anomaly: MOCK_DATA.randomAnomaly(rand),
        summary: [`${a.amount} ${a.symbol} ${a.direction} to ${a.counterparty.slice(0, 6)}…`],
        technical: [{ label: 'Hash', value: a.hash }],
        related: []
      }));
    }
    return transactions.slice(0, limit);
  },
  async getWalletAssets(address: string): Promise<BalanceEntry[]> {
    await delay(150);
    ensureInitialized();
    const wallet = wallets.find((w) => w.address === address);
    const scoped = wallet ? assets.filter((a) => a.chain === wallet.chain) : assets;
    const pool = scoped.length ? scoped : assets;
    return pool.slice(0, 5).map((a) => ({
      assetId: a.id,
      symbol: a.symbol,
      amount: rand() * 1000,
      decimals: a.decimals ?? 18,
      valueUsd: Math.round(rand() * 5000 * 100) / 100
    }));
  },
  async getNetwork(address: string, depth = 2): Promise<NetworkGraphData> {
    await delay(300);
    ensureInitialized();
    const wallet = wallets.find((w) => w.address === address);
    const chain = wallet?.chain ?? 'ethereum';
    return MOCK_DATA.generateNetworkGraph(rand, address, chain, depth);
  },
  async getAsset(chain: ChainId, identifier: string): Promise<Asset> {
    await delay(150);
    ensureInitialized();
    const existing = assets.find((a) => a.id === identifier);
    if (existing) return existing;
    const created = MOCK_DATA.generateAsset(rand, identifier, chain);
    assets.push(created);
    return created;
  },
  async analyze(chain: ChainId, hash: string, address?: string): Promise<AnalysisResponse> {
    await delay(400);
    ensureInitialized();
    const tx = await this.getTransaction(hash, chain);
    const wallet = address ? await this.getWallet(address, chain) : null;
    // `anomaly` is optional on `Transaction`, but every generated record has one.
    const anomaly = tx.anomaly ?? MOCK_DATA.randomAnomaly(rand);
    return {
      transaction: tx,
      score: { score: anomaly.score, level: anomaly.level, contributing: anomaly.details },
      findings: anomaly.details.map((s) => ({ level: s.level, title: s.label, body: s.detail })),
      headline: `Transaction of ${tx.asset.amount} ${tx.asset.symbol} on ${chain}`,
      dna: wallet?.dna ?? null,
      network: await this.getNetwork(address ?? tx.from, 2)
    };
  },
  async createReport(chain: ChainId, hash: string, address?: string): Promise<Report> {
    await delay(300);
    ensureInitialized();
    void address;
    const report = MOCK_DATA.generateReport(rand, hash, chain);
    reports.push(report);
    return report;
  },
  async getReports(): Promise<ReportListResponse> {
    await delay(100);
    ensureInitialized();
    // The list view has no use for the section bodies, and sending them for
    // every report would dominate the payload.
    return { total: reports.length, reports: reports.map((report) => {
      const { sections: _sections, ...summary } = report;
      return summary;
    }) };
  },
  async getReport(id: string): Promise<Report | null> {
    await delay(100);
    ensureInitialized();
    return reports.find((r) => r.id === id) ?? null;
  }
};
