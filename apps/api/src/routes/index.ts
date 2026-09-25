/**
 * The route table.
 *
 * Everything is mounted under `/api/v1` so a future incompatible v2 can sit
 * beside it. Resources are plural because each path names a collection
 * (`/transactions/:chain/:hash`), and because a single wallet has several
 * sub-resources (`/history`, `/assets`, `/network`) that are separate reads.
 *
 * Anything unmatched falls through to 404 in `index.ts`, and `GET /api/v1`
 * lists this table so the deployment is explorable without the source.
 */

import { Router } from '../middleware/router';
import * as read from '../controllers/read';
import * as analyzeController from '../controllers/analyze';

export const API_PREFIX = '/api/v1';

export function createRouter(): Router {
  const router = new Router();

  // Service metadata
  router.get(`${API_PREFIX}`, () => read.index(router.list()));
  router.get(`${API_PREFIX}/health`, read.health);
  router.get(`${API_PREFIX}/health/chains`, read.chainsHealth);
  router.get(`${API_PREFIX}/chains`, read.chains);

  // Search: classify and resolve a pasted identifier
  router.get(`${API_PREFIX}/search`, read.getSearch);

  // Transactions — explicit chain, then chain inferred from the hash shape
  router.get(`${API_PREFIX}/transactions/:chain/:hash`, read.getTransaction);
  router.get(`${API_PREFIX}/transactions/:hash`, read.getTransaction);

  // Wallets
  router.get(`${API_PREFIX}/wallets/:chain/:address`, read.getWallet);
  router.get(`${API_PREFIX}/wallets/:chain/:address/history`, read.getHistory);
  router.get(`${API_PREFIX}/wallets/:chain/:address/assets`, read.getAssets);
  router.get(`${API_PREFIX}/wallets/:chain/:address/network`, read.getNetwork);
  router.get(`${API_PREFIX}/wallets/:chain/:address/balances`, read.getBalances);
  router.get(`${API_PREFIX}/wallets/:address`, read.getWallet);
  router.get(`${API_PREFIX}/wallets/:address/history`, read.getHistory);
  router.get(`${API_PREFIX}/wallets/:address/network`, read.getNetwork);

  // Assets
  router.get(`${API_PREFIX}/assets/:chain/:identifier`, read.getAsset);
  router.get(`${API_PREFIX}/assets/:identifier`, read.getAsset);

  // Analysis
  router.post(`${API_PREFIX}/analyze`, analyzeController.analyze);

  // Reports (in-memory, so ids expire with the process)
  router.get(`${API_PREFIX}/reports`, read.reports);
  router.post(`${API_PREFIX}/reports`, read.postReport);
  router.get(`${API_PREFIX}/reports/:id`, read.readReport);

  return router;
}
