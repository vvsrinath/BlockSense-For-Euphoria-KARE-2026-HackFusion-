/**
 * The paste-an-address flow, end to end against the demo transport.
 *
 * This is the single most common thing a visitor does: paste a wallet address,
 * look at its transactions, open one. Each step previously failed in a way no
 * schema caught — history fell back to unrelated transactions when the address
 * had not been opened first, search answered with a *different* wallet than the
 * one pasted, and a hash valid on two chains could resolve to the other chain's
 * record. The assertions below walk the same sequence the UI walks.
 *
 * `mockApi` is imported directly rather than through `api`, because `api`
 * chooses its transport from `VITE_DEMO_MODE`, which the suite pins to the real
 * HTTP client for the URL-shape tests elsewhere.
 */

import { describe, expect, it } from 'vitest';
import { mockApi } from '../apps/web/src/services/mockApi';
import { MOCK_DATA, TransactionSchema, createRandom } from '@blocksense/shared';
import type { ChainId } from '@blocksense/shared';
import { detectInput } from '@blocksense/blockchain';

const CHAINS: ChainId[] = ['ethereum', 'bnb', 'tron', 'solana', 'bitcoin'];

/**
 * An address in the shape a visitor would actually paste.
 *
 * Generated rather than hardcoded so the value always matches whatever format
 * the chain currently uses — a literal would silently rot when the format
 * helpers change.
 */
function addressFor(chain: ChainId, seed: number): string {
  return MOCK_DATA.generateWallet(createRandom(seed), undefined, chain).address;
}

describe('pasting a wallet address', () => {
  it('returns that wallet, not a different one', async () => {
    for (const chain of CHAINS) {
      const address = addressFor(chain, 1000);
      const wallet = await mockApi.getWallet(address, chain);
      expect(wallet.address, `${chain} wallet address`).toBe(address);
      expect(wallet.chain, `${chain} wallet chain`).toBe(chain);
    }
  });

  it('produces history on the first request, without needing the wallet opened first', async () => {
    for (const chain of CHAINS) {
      const address = addressFor(chain, 2000);
      // No preceding getWallet: this is a deep link straight into the URL bar.
      const history = await mockApi.getWalletHistory(address, 10, chain);
      expect(history.length, `${chain} history`).toBeGreaterThan(0);
      for (const tx of history) {
        expect(tx.chain, `${chain} history row chain`).toBe(chain);
        // Every row must involve the wallet asked for, otherwise the table is
        // showing somebody else's transactions under this address.
        const involved = tx.from === address || tx.to === address;
        expect(involved, `${chain} history row involves ${address}`).toBe(true);
      }
    }
  });

  it('keeps history rows attached to the wallet the UI then loads', async () => {
    const address = addressFor('tron', 3000);
    const wallet = await mockApi.getWallet(address, 'tron');
    const history = await mockApi.getWalletHistory(address, 25, 'tron');

    expect(history.length).toBeGreaterThan(0);
    expect(wallet.activity.length).toBeGreaterThanOrEqual(history.length);
    for (const tx of history) {
      const inWallet = wallet.activity.some((a) => a.hash === tx.hash);
      expect(inWallet, `history hash ${tx.hash} belongs to the wallet`).toBe(true);
    }
  });

  it('resolves balances and a graph for the same address', async () => {
    const address = addressFor('bitcoin', 4000);
    const balances = await mockApi.getWalletAssets(address, 'bitcoin');
    const graph = await mockApi.getNetwork(address, 2, 'bitcoin');

    expect(balances.length).toBeGreaterThan(0);
    // The graph has to be centred on the address asked for, or the network view
    // would draw somebody else's relationships.
    expect(graph.centerId).toBe(address);
    expect(graph.chain).toBe('bitcoin');
    expect(graph.entities.length).toBeGreaterThan(0);
  });
});

describe('opening a transaction from a wallet', () => {
  it('returns a record matching the hash and chain the row linked to', async () => {
    for (const chain of CHAINS) {
      const address = addressFor(chain, 5000);
      const history = await mockApi.getWalletHistory(address, 3, chain);
      expect(history.length, `${chain} rows to open`).toBeGreaterThan(0);

      for (const row of history) {
        const tx = await mockApi.getTransaction(row.hash, chain);
        expect(tx.hash, `${chain} opened hash`).toBe(row.hash);
        expect(tx.chain, `${chain} opened chain`).toBe(chain);
        expect(TransactionSchema.safeParse(tx).success, `${chain} opened tx schema`).toBe(true);
      }
    }
    // Every mock call waits on a short artificial delay so the UI can show its
    // loading states; multiplied across five chains this adds up.
  }, 30_000);

  it('does not hand back another chain record for an ambiguous hash', async () => {
    // A bare 64-hex string is a valid TRON id and a valid Bitcoin txid. Ask for
    // it on both and each answer has to stay on the chain requested.
    const hash = MOCK_DATA.generateTransaction(createRandom(6000), undefined, 'tron').hash;
    expect(detectInput(hash).kind).toBe('transaction');

    const tron = await mockApi.getTransaction(hash, 'tron');
    const bitcoin = await mockApi.getTransaction(hash, 'bitcoin');

    expect(tron.chain).toBe('tron');
    expect(bitcoin.chain).toBe('bitcoin');
    expect(tron.hash).toBe(bitcoin.hash);
  });
});

describe('search', () => {
  it('resolves the identifier that was actually pasted', async () => {
    for (const chain of CHAINS) {
      const address = addressFor(chain, 7000);
      const result = await mockApi.search(address, chain);

      expect(result.error, `${chain} search error`).toBeUndefined();
      expect(result.resolved?.type, `${chain} search kind`).toBe('wallet');
      expect((result.resolved?.data as { address: string }).address).toBe(address);
      expect(result.resolved?.chain).toBe(chain);
    }
  });

  it('resolves a transaction hash to that hash', async () => {
    const tx = MOCK_DATA.generateTransaction(createRandom(8000), undefined, 'solana');

    const result = await mockApi.search(tx.hash, 'solana');
    expect(result.resolved?.type).toBe('transaction');
    expect((result.resolved?.data as { hash: string }).hash).toBe(tx.hash);
    expect(result.resolved?.chain).toBe('solana');
  });

  it('reports an unusable input instead of answering with a random record', async () => {
    const result = await mockApi.search('not an identifier');
    expect(result.resolved).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
