/**
 * The route table.
 *
 * All routes are mounted under `/api`. Anything unmatched falls through to 404
 * in `index.ts`, and `GET /api` lists this table so the API is explorable
 * without reading the source.
 */

import { Router } from '../middleware/router';
import * as read from '../controllers/read';
import * as analyzeController from '../controllers/analyze';

export function createRouter(): Router {
  const router = new Router();

  // Service metadata
  router.get('/api', () => ({ name: 'BlockSense API', version: '0.1.0', routes: router.list() }));
  router.get('/api/health', read.health);
  router.get('/api/chains', read.chains);

  // Lookup helper for the search box
  router.get('/api/detect', read.detect);

  // Transactions — explicit chain, then chain inferred from the hash shape
  router.get('/api/transaction/:chain/:hash', read.getTransaction);
  router.get('/api/transaction/:hash', read.getTransaction);

  // Wallets
  router.get('/api/wallet/:chain/:address', read.getWallet);
  router.get('/api/wallet/:chain/:address/history', read.getHistory);
  router.get('/api/wallet/:chain/:address/network', read.getNetwork);
  router.get('/api/wallet/:address', read.getWallet);
  router.get('/api/wallet/:address/history', read.getHistory);
  router.get('/api/wallet/:address/network', read.getNetwork);

  // Assets
  router.get('/api/asset/:chain/:address', read.getAsset);
  router.get('/api/asset/:address', read.getAsset);

  // Analysis
  router.post('/api/analyze', analyzeController.analyze);

  return router;
}
