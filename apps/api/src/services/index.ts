/**
 * The service layer.
 *
 * Controllers stay thin: they validate, delegate here, and shape the response.
 * This is also the only place that knows how a chain adapter, the transaction
 * engine and the intelligence layer fit together — which is exactly the
 * separation that lets a new chain be added without touching the API.
 *
 * Every provider read goes through the TTL cache, and every write-shaped read is
 * bounded by the configured graph limits.
 */

import type {
  Asset, ChainId, ChainInfo, NetworkEntity, NetworkGraphData, NetworkLink,
  Transaction, Wallet
} from '@blocksense/shared';
import { ProviderError } from '@blocksense/blockchain';
import { activePriceService, createAdapter, detectInput, getChain, supportedChains } from '@blocksense/blockchain';
import type { AdapterConfig, BlockchainAdapter, HistoryOptions } from '@blocksense/blockchain';
import { analyzeTransaction, buildGraph } from '@blocksense/intelligence';
import type { AnalysisResult } from '@blocksense/intelligence';
import { config, requestPolicy } from '../config/index';
import { TtlCache, cacheKey } from '../middleware/cache';
import { MOCK_DATA } from '@blocksense/shared';

/** Shared across adapters so a second identical request costs nothing. */
const cache = new TtlCache({ ttlMs: config.cacheTtlSeconds * 1000, maxEntries: 500 });

/** Deepest network expansion the API will accept, matching the published limit. */
const MAX_GRAPH_DEPTH = 3;

/** Adapters are memoised so a burst of requests reuses one set of connections. */
const adapters = new Map<ChainId, BlockchainAdapter>();

/**
 * Whether to serve generated demo data instead of reading live chains.
 *
 * `DEMO_MODE` wins when it is set, so a stale `USE_LIVE_DATA` cannot silently
 * decide the mode. With neither set, the API stays on demo data, because a fresh
 * checkout should not require a reachable provider.
 */
export const USE_MOCK = (() => {
  const demo = process.env.DEMO_MODE?.trim().toLowerCase();
  if (demo === 'true' || demo === '1' || demo === 'yes' || demo === 'on') return true;
  if (demo === 'false' || demo === '0' || demo === 'no' || demo === 'off') return false;
  return !config.useLiveData;
})();

/** Per-chain provider credentials, all optional and all server-side only. */
function adapterConfig(chain: ChainId): AdapterConfig {
  const base = { policy: { ...requestPolicy } };
  switch (chain) {
    case 'ethereum': return { ...base, rpcUrl: config.ethereum.rpcUrl, apiKey: config.ethereum.apiKey };
    case 'bnb': return { ...base, rpcUrl: config.bnb.rpcUrl, apiKey: config.bnb.apiKey };
    case 'tron': return { ...base, rpcUrl: config.tron.rpcUrl, apiKey: config.tron.apiKey };
    case 'solana': return { ...base, rpcUrl: config.solana.rpcUrl, apiKey: config.solana.apiKey };
    case 'bitcoin': return { ...base, rpcUrl: config.bitcoin.rpcUrl, apiKey: config.bitcoin.apiKey };
  }
}

export function adapterFor(chain: ChainId): BlockchainAdapter {
  const existing = adapters.get(chain);
  if (existing) return existing;

  const adapter = USE_MOCK ? createMockAdapter(chain) : createAdapter(chain, adapterConfig(chain));
  adapters.set(chain, adapter);
  return adapter;
}

/** Create mock adapters that return auto-generated demo data. */
function createMockAdapter(chain: ChainId): BlockchainAdapter {
  const chainInfo = getChain(chain);
  const r = () => Math.random();

  // Caches are per adapter rather than module-wide: the same 32-byte string can
  // be a Bitcoin txid and a TRON hash, and a shared cache would hand one chain's
  // generated record to the other.
  const txCache = new Map<string, Transaction>();
  const walletCache = new Map<string, Wallet>();

  return {
    id: chain,
    name: chainInfo.name,
    nativeSymbol: chainInfo.symbol,
    isLive: false,
    async getTransaction(hash: string) {
      const cached = txCache.get(hash);
      if (cached) return cached;
      // Generated on this adapter's chain so the `:chain` in the URL and the
      // returned record always agree.
      const tx = MOCK_DATA.generateTransaction(r, hash, chain);
      txCache.set(hash, tx);
      return tx;
    },
    async getWallet(address: string) {
      const cached = walletCache.get(address);
      if (cached) return cached;
      const wallet = MOCK_DATA.generateWallet(r, address, chain);
      walletCache.set(address, wallet);
      return wallet;
    },
    async getBalances(_address: string) {
      // Balances come from the chain's own asset list, so a Bitcoin wallet never
      // reports a BEP-20 token holding.
      return MOCK_DATA.generateAssetsForChain(r, chain).map((asset) => ({
        assetId: asset.id,
        symbol: asset.symbol,
        amount: Math.random() * 1000,
        decimals: asset.decimals ?? 18,
        valueUsd: Math.round(Math.random() * 5000 * 100) / 100
      }));
    },
    async getHistory(_address: string, options?: HistoryOptions) {
      const limit = options?.limit ?? 25;
      return Array.from({ length: limit }, () => MOCK_DATA.generateTransaction(r, undefined, chain));
    },
    async getAsset(identifier: string) {
      return MOCK_DATA.generateAsset(r, identifier, chain);
    },
    async getTip() {
      // Heights drift from the chain's real head rather than being drawn from a
      // flat range, which would put Bitcoin above Solana's slot count.
      return {
        chain,
        height: chainInfo.latestHeight + Math.floor(Math.random() * 1000),
        unit: chainInfo.latestLabel === 'Latest slot' ? ('slot' as const) : ('block' as const)
      };
    },
  };
}

/**
 * Install a fixed set of adapters.
 *
 * Adapters are the only thing in the API that touches the network, so this is
 * the seam that lets the route, envelope, validation and error-mapping tests run
 * without a provider — and it is the same seam a future indexer implementation
 * would use to swap one chain's data source.
 */
export function setAdapters(next: Partial<Record<ChainId, BlockchainAdapter>>): void {
  adapters.clear();
  cache.clear();
  for (const [chain, adapter] of Object.entries(next)) {
    adapters.set(chain as ChainId, adapter);
  }
}

/** Drop any installed adapters and cached reads, returning to live providers. */
export function resetAdapters(): void {
  adapters.clear();
  cache.clear();
}

/**
 * Guess the chain for an address or hash from its shape.
 *
 * An identifier frequently cannot name its own chain — the same 32 bytes could
 * be a Bitcoin txid or a TRON hash — so this is only ever a fallback for
 * requests that did not name a chain explicitly. Routes that take a `:chain`
 * parameter are the reliable ones.
 */
export function inferChain(input: string): ChainId {
  return detectInput(input).chains[0] ?? 'ethereum';
}

export function getTransaction(chain: ChainId, hash: string): Promise<Transaction> {
  return cache.wrap(
    cacheKey(chain, 'tx', hash),
    async () => {
      const tx = await adapterFor(chain).getTransaction(hash);
      const [priced] = await activePriceService().enrich([tx]);
      return priced;
    },
    { staleOnError: true }
  );
}

export function getWallet(chain: ChainId, address: string): Promise<Wallet> {
  return cache.wrap(cacheKey(chain, 'wallet', address), () => adapterFor(chain).getWallet(address), {
    staleOnError: true
  });
}

export function getAsset(chain: ChainId, identifier: string): Promise<Asset> {
  return cache.wrap(cacheKey(chain, 'asset', identifier), () => adapterFor(chain).getAsset(identifier));
}

export function getHistory(
  chain: ChainId,
  address: string,
  options: HistoryOptions = {}
): Promise<Transaction[]> {
  const key = cacheKey(chain, 'history', address, options.limit, options.since, options.until);
  return cache.wrap(
    key,
    async () => {
      const history = await adapterFor(chain).getHistory(address, options);
      return activePriceService().enrich(history);
    },
    { staleOnError: true }
  );
}

export function getChainTip(chain: ChainId) {
  return cache.wrap(cacheKey(chain, 'tip'), () => adapterFor(chain).getTip());
}

export async function getNetwork(chain: ChainId, address: string, depth = 2): Promise<NetworkGraphData> {
  if (!Number.isInteger(depth) || depth < 1 || depth > MAX_GRAPH_DEPTH) {
    throw new ProviderError('NETWORK_LIMIT_EXCEEDED', `depth must be a whole number between 1 and ${MAX_GRAPH_DEPTH}.`);
  }

  const focus = address.trim();
  const history = await getHistory(chain, focus, { limit: 200, order: 'desc' });

  const entities = new Map<string, NetworkEntity>();
  const links = new Map<string, NetworkLink>();

  entities.set(focus, {
    id: focus,
    address: focus,
    label: 'Selected wallet',
    kind: 'center',
    level: 'normal',
    firstSeen: 0,
    txCount: history.length,
    totalUsd: 0,
    relationship: 'focus'
  });

  for (const tx of history) {
    const counterparty = (tx.from.toLowerCase() === focus.toLowerCase() ? tx.to : tx.from).trim();
    if (!counterparty) continue;

    const level = tx.anomaly?.level ?? 'normal';
    const volume = tx.asset.valueUsd ?? 0;

    const existingEntity = entities.get(counterparty);
    if (existingEntity) {
      existingEntity.txCount += 1;
      existingEntity.totalUsd += volume;
    } else {
      if (entities.size >= config.maxGraphNodes) continue;
      entities.set(counterparty, {
        id: counterparty,
        address: counterparty,
        label: `${counterparty.slice(0, 6)}…${counterparty.slice(-4)}`,
        kind: 'wallet',
        level,
        firstSeen: tx.timestamp,
        txCount: 1,
        totalUsd: volume,
        relationship: 'counterparty',
        parentId: focus
      });
    }

    const linkId = `${focus}->${counterparty}`;
    const existingLink = links.get(linkId);
    if (existingLink) {
      existingLink.txCount += 1;
      existingLink.volumeUsd += volume;
      existingLink.flagged = existingLink.flagged || level === 'high';
    } else {
      if (links.size >= config.maxGraphEdges) continue;
      links.set(linkId, {
        id: linkId,
        source: focus,
        target: counterparty,
        txCount: 1,
        volumeUsd: volume,
        flagged: level === 'high'
      });
    }
  }

  const focusEntity = entities.get(focus);
  if (focusEntity) {
    focusEntity.txCount = history.length;
    focusEntity.firstSeen = history.length > 0 ? Math.min(...history.map((t) => t.timestamp)) : 0;
  }

  return buildGraph(
    { entities: [...entities.values()], links: [...links.values()] },
    { chain, centerId: focus, maxDepth: depth }
  );
}

/** Full analysis: fetch the transaction, gather context, then interpret it. */
export async function analyze(
  chain: ChainId,
  hash: string,
  focusAddress?: string
): Promise<AnalysisResult> {
  const transaction = await getTransaction(chain, hash);
  const subject = (focusAddress ?? transaction.from).trim();
  let wallet: Wallet | null = null;
  if (subject) {
    try {
      wallet = await getWallet(chain, subject);
    } catch (err) {
      if (!(err instanceof ProviderError)) throw err;
      wallet = null;
    }
  }
  return analyzeTransaction(transaction, wallet);
}

/** Chain registry, annotated with whether each adapter will hit the network. */
export function listChains(): (ChainInfo & { live: boolean })[] {
  return supportedChains().map((id) => ({ ...getChain(id), live: adapterFor(id).isLive }));
}

export interface ChainHealth {
  id: ChainId;
  live: boolean;
  status: 'up' | 'down';
  height?: number;
  unit?: string;
  error?: string;
  latencyMs?: number;
}

export async function chainHealth(): Promise<ChainHealth[]> {
  return Promise.all(
    supportedChains().map(async (id): Promise<ChainHealth> => {
      const live = adapterFor(id).isLive;
      const started = Date.now();
      try {
        const tip = await getChainTip(id);
        return { id, live, status: 'up', height: tip.height, unit: tip.unit, latencyMs: Date.now() - started };
      } catch (err) {
        return {
          id,
          live,
          status: 'down',
          latencyMs: Date.now() - started,
          error: err instanceof ProviderError ? `${err.code}: ${err.message}` : 'Unreachable'
        };
      }
    })
  );
}

export function health() {
  return {
    status: 'ok' as const,
    env: config.env,
    dataSource: USE_MOCK ? 'mock' : 'live' as const,
    uptimeSeconds: Math.round(process.uptime()),
    cache: cache.stats(),
    chains: supportedChains().map((id) => ({ id, live: adapterFor(id).isLive }))
  };
}

export { cache };