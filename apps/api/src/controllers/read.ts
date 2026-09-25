/**
 * Read handlers.
 *
 * Every handler returns a raw payload; `sendJson` wraps it in the standard
 * envelope, so no controller has to remember `success`, `data` or `meta`.
 */

import type { ChainId } from '@blocksense/shared';
import { ProviderError, isSupportedChain } from '@blocksense/blockchain';
import type { RequestContext } from '../middleware/router';
import * as service from '../services/index';
import { search } from '../services/search';
import { listReports, getReport, createReport } from '../services/reports';
import { config } from '../config/index';

/** Reject an unknown chain before it reaches an adapter lookup. */
export function requireChain(value: string): ChainId {
  if (!isSupportedChain(value)) throw ProviderError.unsupportedChain(value);
  return value;
}

export function health(): unknown {
  return service.health();
}

/** Live per-chain probe. Separate from `/health` so the cheap check stays cheap. */
export async function chainsHealth(): Promise<unknown> {
  const chains = await service.chainHealth();
  return {
    chains,
    // "ok" means the API itself is fine; individual chains may still be down.
    status: chains.some((c) => c.status === 'up') ? 'ok' : 'degraded',
    checkedAt: Date.now()
  };
}

export function chains(): unknown {
  return service.listChains();
}

export function getTransaction(ctx: RequestContext): Promise<unknown> {
  const chain = ctx.params.chain ? requireChain(ctx.params.chain) : service.inferChain(ctx.params.hash);
  return service.getTransaction(chain, ctx.params.hash);
}

export function getWallet(ctx: RequestContext): Promise<unknown> {
  const chain = ctx.params.chain ? requireChain(ctx.params.chain) : service.inferChain(ctx.params.address);
  return service.getWallet(chain, ctx.params.address);
}

export function getHistory(ctx: RequestContext): Promise<unknown> {
  const chain = ctx.params.chain ? requireChain(ctx.params.chain) : service.inferChain(ctx.params.address);
  return service.getHistory(chain, ctx.params.address, {
    limit: Number(ctx.query.get('limit') ?? 25),
    order: (ctx.query.get('order') as 'asc' | 'desc') ?? 'desc',
    since: ctx.query.get('since') ? Number(ctx.query.get('since')) : undefined,
    until: ctx.query.get('until') ? Number(ctx.query.get('until')) : undefined
  });
}

/**
 * Balances for a wallet.
 *
 * Served from the adapter directly rather than from the wallet profile, because
 * a balance is a point-in-time read and the profile is a cached rollup.
 */
export function getBalances(ctx: RequestContext): Promise<unknown> {
  const chain = ctx.params.chain ? requireChain(ctx.params.chain) : service.inferChain(ctx.params.address);
  return service.adapterFor(chain).getBalances(ctx.params.address);
}

/**
 * Holdings for a wallet.
 *
 * This used to pass the wallet address to the asset-metadata lookup, which
 * answered "is there an asset whose identifier is this address" — never a
 * useful question. A wallet's assets are what it holds, so the balances read
 * is the honest answer.
 */
export function getAssets(ctx: RequestContext): Promise<unknown> {
  const chain = ctx.params.chain ? requireChain(ctx.params.chain) : service.inferChain(ctx.params.address);
  return service.adapterFor(chain).getBalances(ctx.params.address);
}

export function getAsset(ctx: RequestContext): Promise<unknown> {
  const chain = ctx.params.chain ? requireChain(ctx.params.chain) : service.inferChain(ctx.params.identifier);
  return service.getAsset(chain, ctx.params.identifier);
}

export async function getNetwork(ctx: RequestContext): Promise<unknown> {
  const chain = ctx.params.chain ? requireChain(ctx.params.chain) : service.inferChain(ctx.params.address);
  const depth = Number(ctx.query.get('depth') ?? 2);
  return service.getNetwork(chain, ctx.params.address, depth);
}

export function getSearch(ctx: RequestContext): Promise<unknown> {
  const query = ctx.query.get('q') ?? '';
  if (!query.trim()) throw ProviderError.invalidRequest('A `q` query parameter is required.');
  return search(query, ctx.query.get('chain') ?? undefined);
}

export function postReport(ctx: RequestContext): Promise<unknown> {
  const body = (ctx.body ?? {}) as { chain?: string; hash?: string; address?: string };
  if (!body.chain || !body.hash) {
    throw ProviderError.invalidRequest('`chain` and `hash` are required to build a report.');
  }
  return createReport(requireChain(body.chain), body.hash, body.address);
}

export function readReport(ctx: RequestContext): unknown {
  const report = getReport(ctx.params.id);
  if (!report) {
    // Reports live in process memory, so a missing one is a genuine 404 rather
    // than a provider problem.
    throw new ProviderError('NOT_FOUND', `Report "${ctx.params.id}" was not found. It may have expired.`);
  }
  return report;
}

export function reports(): unknown {
  return listReports();
}

/** Index of the API surface, so the deployment is explorable. */
export function index(routes: { method: string; path: string }[]): unknown {
  return {
    name: 'BlockSense API',
    version: '1.0.0',
    dataSource: 'live',
    limits: {
      cacheTtlSeconds: config.cacheTtlSeconds,
      maxGraphNodes: config.maxGraphNodes,
      maxGraphEdges: config.maxGraphEdges,
      requestTimeoutMs: config.requestTimeoutMs
    },
    routes
  };
}
