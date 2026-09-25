/**
 * Analysis handlers.
 *
 * Analysis is a pure function over chain data, so the only work here is
 * validating the request and handing it to the service layer.
 */

import type { ChainId } from '@blocksense/shared';
import { ProviderError } from '@blocksense/blockchain';
import type { RequestContext } from '../middleware/router';
import * as service from '../services/index';
import { requireChain } from './read';

export async function analyze(ctx: RequestContext): Promise<unknown> {
  const body = (ctx.body ?? {}) as {
    chain?: string;
    hash?: string;
    address?: string;
    includeNetwork?: boolean;
  };

  if (!body.chain || !body.hash) {
    throw ProviderError.invalidRequest('`chain` and `hash` are required to analyse a transaction.');
  }

  const chain = requireChain(body.chain) as ChainId;
  const result = await service.analyze(chain, body.hash, body.address);

  // The graph is a second, much heavier provider read, so it is opt-in.
  if (!body.includeNetwork) return result;

  try {
    return { ...result, network: await service.getNetwork(chain, body.address ?? result.transaction.from) };
  } catch {
    // A graph failure should not discard a completed analysis.
    return { ...result, network: null, networkError: 'The counterparty graph could not be built.' };
  }
}
