/**
 * Deterministic fixtures.
 *
 * These are test data and nothing else: they exist so the API's routing,
 * envelope and error mapping can be tested without a provider, and so a
 * failing assertion points at the code rather than at an upstream outage.
 *
 * They are deliberately *not* reachable from application code. The services
 * resolve adapters through `setAdapters`, which only tests call.
 */

import type { ChainId, Transaction, TransactionAsset, Wallet } from '@blocksense/shared';

/** A fixed instant, so no assertion depends on the wall clock. */
export const FIXED_NOW = 1_735_689_600_000;

export const DEFAULT_ASSET: TransactionAsset = {
  type: 'native',
  name: 'Ether',
  symbol: 'ETH',
  amount: '1.25',
  decimals: 18,
  direction: 'sent'
};

export interface TransactionFixtureOverrides extends Partial<Omit<Transaction, 'asset'>> {
  /** Replaces the asset outright; spread it over `DEFAULT_ASSET` to extend it. */
  asset?: TransactionAsset;
}

/** A complete, valid `Transaction`. Overrides are merged, not deep-merged. */
export function transactionFixture(overrides: TransactionFixtureOverrides = {}): Transaction {
  return {
    hash: '0xabc123',
    chain: 'ethereum',
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    timestamp: FIXED_NOW,
    status: 'confirmed',
    block: 19_000_000,
    confirmations: 64,
    asset: { ...DEFAULT_ASSET, ...overrides.asset },
    summary: ['1.25 ETH transferred'],
    technical: [{ label: 'Block', value: '19000000' }],
    related: [],
    ...overrides
  };
}

/** A complete, valid `Wallet` with no observed activity. */
export function walletFixture(chain: ChainId, address: string, overrides: Partial<Wallet> = {}): Wallet {
  return {
    address,
    chain,
    tags: [],
    firstSeen: 0,
    lastActive: 0,
    txCount: 0,
    totalInUsd: 0,
    totalOutUsd: 0,
    status: 'normal',
    statusNote: 'No indexed activity found for this address.',
    dna: {
      typicalAmount: '—',
      typicalFrequency: '—',
      mostActive: '—',
      commonAsset: 'ETH',
      counterparties: 0,
      medianUsd: 0,
      txPerWeek: 0,
      traits: []
    },
    activity: [],
    ...overrides
  };
}
