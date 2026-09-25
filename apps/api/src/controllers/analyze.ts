/**
 * The analysis endpoint.
 *
 * `POST /api/analyze` is the one write-shaped route: the request body is the
 * analysis target, not a resource being created. POST is used because the body
 * can carry a hash, an optional chain and an optional focus address — more than
 * a path can express cleanly — and so a request can be replayed or logged
 * verbatim.
 */

import { explorerUrl } from '@blocksense/blockchain';
import * as service from '../services/index';
import { AnalyzeRequestSchema, body } from '../validators/index';
import type { RequestContext } from '../middleware/router';

export async function analyze(ctx: RequestContext) {
  const payload = body(ctx, AnalyzeRequestSchema);

  // A hash often cannot identify its own chain, so fall back to shape detection
  // rather than making every client pass one.
  const chain = payload.chain ?? service.inferChain(payload.hash);
  const result = await service.analyze(chain, payload.hash, payload.focusAddress);

  return {
    chain,
    explorer: explorerUrl(chain, payload.hash, 'tx'),
    ...result
  };
}
