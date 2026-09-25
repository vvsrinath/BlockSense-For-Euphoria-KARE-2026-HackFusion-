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
  Asset,
  ChainId,
  ChainInfo,
  NetworkEntity,
  NetworkGraphData,
  NetworkLink,
  Transaction,
  Wallet
} from '@blocksense/shared';
import { ProviderError } from '@blocksense/blockchain';
import { createAdapter, detectInput, getChain, supportedChains } from '@blocksense/blockchain';
import type { AdapterConfig, BlockchainAdapter, HistoryOptions } from '@blocksense/blockchain';
import { analyzeTransaction, buildGraph } from '@blocksense/intelligence';
import type { AnalysisResult } from '@blocksense/intelligence';
import { config, requestPolicy } from '../config/index';
import { TtlCache, cacheKey } from '../middleware/cache';

/** Shared across adapters so a second identical request costs nothing. */
const cache = new TtlCache({ ttlMs: config.cacheTtlSeconds * 1000, maxEntries: 500 });

/** Deepest network expansion the API will accept, matching the published limit. */
const MAX_GRAPH_DEPTH = 3;

/** Adapters are memoised so a burst of requests reuses one set of connections. */
const adapters = new Map<ChainId, BlockchainAdapter>();

/** Per-chain provider credentials, all optional and all server-side only. */
function adapterConfig(chain: ChainId): AdapterConfig {
  const base = { policy: { ...requestPolicy } };
  switch (chain) {
    case 'ethereum':
      return { ...base, rpcUrl: config.ethereum.rpcUrl, apiKey: config.ethereum.apiKey };
    case 'bnb':
      return { ...base, rpcUrl: config.bnb.rpcUrl, apiKey: config.bnb.apiKey };
    case 'tron':
      return { ...base, rpcUrl: config.tron.rpcUrl, apiKey: config.tron.apiKey };
    case 'solana':
      return { ...base, rpcUrl: config.solana.rpcUrl, apiKey: config.solana.apiKey };
    case 'bitcoin':
      return { ...base, rpcUrl: config.bitcoin.rpcUrl, apiKey: config.bitcoin.apiKey };
  }
}

export function adapterFor(chain: ChainId): BlockchainAdapter {
  const existing = adapters.get(chain);
  if (existing) return existing;

  const adapter = createAdapter(chain, adapterConfig(chain));
  adapters.set(chain, adapter);
  return adapter;
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
  return cache.wrap(cacheKey(chain, 'tx', hash), () => adapterFor(chain).getTransaction(hash));
}

export function getWallet(chain: ChainId, address: string): Promise<Wallet> {
  return cache.wrap(cacheKey(chain, 'wallet', address), () => adapterFor(chain).getWallet(address));
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
  return cache.wrap(key, () => adapterFor(chain).getHistory(address, options));
}

export function getChainTip(chain: ChainId) {
  return cache.wrap(cacheKey(chain, 'tip'), () => adapterFor(chain).getTip());
}

/**
 * Build a counterparty graph around an address.
 *
 * The neighbourhood is derived from the wallet's own history rather than taken
 * from the provider, so every chain gets the same shape of graph. Expansion is
 * bounded by `MAX_GRAPH_NODES`/`MAX_GRAPH_EDGES`, which is what stops a hub
 * account from producing an unusable response.
 */
/**
 * The counterparty graph for an address.
 *
 * Depth is accepted and validated but the traversal is currently one hop: the
 * nodes are built from the focus address's own observed history, which is what a
 * node-level provider can answer without an indexer. Widening this is the job of
 * an indexer, not of guessing at second-hop relationships.
 */
export async function getNetwork(chain: ChainId, address: string, depth = 2): Promise<NetworkGraphData> {
  // Reject an out-of-range depth rather than quietly clamping it. A client that
  // asked for depth 9 and silently received 2 has no way to know its request was
  // reduced, and would draw conclusions from a shallower graph than it asked for.
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
      // Stop early rather than truncating afterwards, so the focus node keeps
      // its full transaction count and the graph stays self-consistent.
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

  // Keep the focus entity's totals consistent with the history it came from.
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

  // Amounts are only anomalous relative to a baseline, and the wallet's own
  // history is the best baseline available.
  const subject = (focusAddress ?? transaction.from).trim();
  let wallet: Wallet | null = null;
  if (subject) {
    try {
      wallet = await getWallet(chain, subject);
    } catch (err) {
      // Missing wallet context should degrade the analysis, not fail the request.
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

/**
 * Probe every chain's tip.
 *
 * A chain that is rate limited or down is reported as `down` rather than
 * failing the whole health check — partial availability is the normal state of a
 * public multi-chain front end, and the UI needs to know which chains to trust.
 */
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
    dataSource: 'live' as const,
    uptimeSeconds: Math.round(process.uptime()),
    cache: cache.stats(),
    chains: supportedChains().map((id) => ({ id, live: adapterFor(id).isLive }))
  };
}

export { cache };
