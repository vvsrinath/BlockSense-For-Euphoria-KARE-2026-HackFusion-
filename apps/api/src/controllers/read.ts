/**
 * Read endpoints.
 *
 * Handlers return plain data; `index.ts` serialises it. Keeping them free of
 * `res` makes each one directly unit-testable.
 *
 * Every resource has two routes: one with an explicit `:chain` and one that
 * infers it. The explicit form is authoritative; the inferred form exists
 * because an investigator pasting a hash into a URL should not have to know
 * which chain it belongs to.
 */

import { detectInput, explorerUrl } from '@blocksense/blockchain';
import { analyzeWallet, flaggedLinkCount, graphVolumeUsd } from '@blocksense/intelligence';
import * as service from '../services/index';
import {
  addressParam,
  optionalChainParam,
  depthQuery,
  hashParam,
  limitQuery,
  searchParam
} from '../validators/index';
import type { RequestContext } from '../middleware/router';

export async function health() {
  return service.health();
}

export async function chains() {
  return { chains: service.listChains() };
}

export async function getTransaction(ctx: RequestContext) {
  const hash = hashParam(ctx);
  const chain = optionalChainParam(ctx) ?? service.inferChain(hash);
  const transaction = await service.getTransaction(chain, hash);

  return {
    chain,
    transaction,
    explorer: explorerUrl(chain, transaction.hash, 'tx')
  };
}

export async function getWallet(ctx: RequestContext) {
  const address = addressParam(ctx);
  const chain = optionalChainParam(ctx) ?? service.inferChain(address);
  const wallet = await service.getWallet(chain, address);

  return {
    chain,
    wallet,
    dna: analyzeWallet(wallet),
    explorer: explorerUrl(chain, wallet.address, 'address')
  };
}

export async function getHistory(ctx: RequestContext) {
  const address = addressParam(ctx);
  const chain = optionalChainParam(ctx) ?? service.inferChain(address);
  const limit = limitQuery(ctx);

  const transactions = await service.getHistory(chain, address, { limit, order: 'desc' });

  return { chain, address, limit, count: transactions.length, transactions };
}

export async function getNetwork(ctx: RequestContext) {
  const address = addressParam(ctx);
  const chain = optionalChainParam(ctx) ?? service.inferChain(address);
  const depth = depthQuery(ctx);

  const graph = await service.getNetwork(chain, address, depth);

  return {
    ...graph,
    depth,
    stats: {
      entities: graph.entities.length,
      links: graph.links.length,
      flaggedLinks: flaggedLinkCount(graph),
      volumeUsd: graphVolumeUsd(graph)
    }
  };
}

export async function getAsset(ctx: RequestContext) {
  const address = addressParam(ctx);
  const chain = optionalChainParam(ctx) ?? service.inferChain(address);
  const asset = await service.getAsset(chain, address);
  return { chain, asset };
}

/**
 * Identify an arbitrary string as an address, hash or block number.
 *
 * This is what the search box calls as the investigator types, which is why it
 * returns every plausible chain rather than committing to one.
 */
export async function detect(ctx: RequestContext) {
  const q = searchParam(ctx);
  const hint = ctx.query.get('chain');
  return { input: q, ...detectInput(q, (hint as never) ?? 'all') };
}
