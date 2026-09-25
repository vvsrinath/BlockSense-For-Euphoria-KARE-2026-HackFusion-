/**
 * The service layer.
 *
 * Controllers stay thin: they validate, delegate here, and shape the response.
 * This is also the only place that knows how a chain adapter, the transaction
 * engine and the intelligence layer fit together — which is exactly the
 * separation that lets a new chain be added without touching the API.
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
import { config } from '../config/index';

/**
 * Adapters are memoised so a burst of requests reuses one set of connections
 * instead of building a new client per call.
 */
const adapters = new Map<ChainId, BlockchainAdapter>();

export function adapterFor(chain: ChainId): BlockchainAdapter {
  const existing = adapters.get(chain);
  if (existing) return existing;

  const overrides: AdapterConfig = { latency: config.mockLatency };
  // An empty rpcUrl forces the mock transport. Without this, a developer who has
  // an RPC key exported locally would silently hit the network in a demo run.
  if (!config.useLiveData) overrides.rpcUrl = '';

  const adapter = createAdapter(chain, overrides);
  adapters.set(chain, adapter);
  return adapter;
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
  return adapterFor(chain).getTransaction(hash);
}

export function getWallet(chain: ChainId, address: string): Promise<Wallet> {
  return adapterFor(chain).getWallet(address);
}

export function getAsset(chain: ChainId, identifier: string): Promise<Asset> {
  return adapterFor(chain).getAsset(identifier);
}

export function getHistory(
  chain: ChainId,
  address: string,
  options: HistoryOptions = {}
): Promise<Transaction[]> {
  return adapterFor(chain).getHistory(address, options);
}

/**
 * Build a counterparty graph around an address.
 *
 * The neighbourhood is derived from the wallet's own history rather than taken
 * from the provider, so every chain gets the same shape of graph. Expansion is
 * bounded inside `buildGraph`, which is what stops a hub account from
 * producing an unusable response.
 */
export async function getNetwork(chain: ChainId, address: string, depth = 2): Promise<NetworkGraphData> {
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

/** Health, including live-vs-mocked state per chain. */
export function health() {
  return {
    status: 'ok' as const,
    env: config.env,
    useLiveData: config.useLiveData,
    chains: supportedChains().map((id) => ({ id, live: adapterFor(id).isLive }))
  };
}
