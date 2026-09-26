/**
 * The generated demo data.
 *
 * Every screen in demo mode renders records from `MOCK_DATA`, and nothing else
 * in the suite covers it, so two classes of bug are invisible to the type
 * checker. The first is a record that violates its own schema — the API would
 * reject what the UI happily renders. The second is a record that is internally
 * inconsistent, such as a Solana transaction carrying an ERC-20 contract or a
 * Bitcoin height above Solana's slot count. Neither is a compile error, and both
 * are obvious to anyone who knows the chains, which is the audience a demo is
 * shown to.
 *
 * These assertions are mode-independent, so they hold whichever transport the
 * rest of the suite happens to run under.
 */

import { describe, expect, it } from 'vitest';
import { MOCK_DATA, createRandom, hashString, TransactionSchema } from '@blocksense/shared';
import type { ChainId } from '@blocksense/shared';
import { detectInput, chains as chainRegistry } from '@blocksense/blockchain';

const CHAINS: ChainId[] = ['ethereum', 'bnb', 'tron', 'solana', 'bitcoin'];

/**
 * Ethereum and BNB Chain share one identifier format, so shape-based detection
 * genuinely cannot tell them apart and reports both. Assertions therefore check
 * that a generated identifier is valid for the chain's *format family* rather
 * than for the exact chain, which is the strongest claim the format allows.
 */
const FORMAT_FAMILY: Record<ChainId, ChainId[]> = {
  ethereum: ['ethereum', 'bnb'],
  bnb: ['ethereum', 'bnb'],
  tron: ['tron', 'bitcoin'],
  solana: ['solana'],
  bitcoin: ['bitcoin', 'tron']
};

const NATIVE_SYMBOL: Record<ChainId, string> = {
  ethereum: 'ETH', bnb: 'BNB', tron: 'TRX', solana: 'SOL', bitcoin: 'BTC'
};

const CHAIN_NAME = Object.fromEntries(chainRegistry.map((c) => [c.id, c.name])) as Record<ChainId, string>;

/** True when `value` has a shape the given chain could plausibly produce. */
function hasShapeFor(value: string, chain: ChainId): boolean {
  return detectInput(value).chains.some((c) => FORMAT_FAMILY[chain].includes(c));
}

/** A fixed seed keeps a failure reproducible instead of intermittently green. */
function seeded(): () => number {
  return createRandom(20260926);
}

describe('generateTransaction', () => {
  it('produces a record the shared schema accepts', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      const result = TransactionSchema.safeParse(MOCK_DATA.generateTransaction(r, undefined, chain));
      if (!result.success) {
        throw new Error(`${chain} transaction failed the schema: ${result.error.message}`);
      }
    }
  });

  it('honours the requested chain instead of rolling a random one', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      expect(MOCK_DATA.generateTransaction(r, undefined, chain).chain).toBe(chain);
    }
  });

  it('keeps the hash, addresses and fee on the same chain', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      const tx = MOCK_DATA.generateTransaction(r, undefined, chain);
      expect(hasShapeFor(tx.hash, chain), `hash ${tx.hash} is not a recognisable ${chain} hash`).toBe(true);
      expect(hasShapeFor(tx.from, chain), `from ${tx.from} is not a recognisable ${chain} address`).toBe(true);
      expect(hasShapeFor(tx.to, chain), `to ${tx.to} is not a recognisable ${chain} address`).toBe(true);
      expect(tx.fee?.symbol).toBe(NATIVE_SYMBOL[chain]);
    }
  });

  it('reuses a supplied hash verbatim', () => {
    const tx = MOCK_DATA.generateTransaction(seeded(), '0xdeadbeef', 'ethereum');
    expect(tx.hash).toBe('0xdeadbeef');
  });

  it('reports the requested hash in its technical fields', () => {
    const tx = MOCK_DATA.generateTransaction(seeded(), '0xfeedface', 'ethereum');
    const hashField = tx.technical.find((f) => f.label === 'Transaction hash');
    expect(hashField?.value).toBe('0xfeedface');
  });

  it('only carries assets that exist on the transaction chain', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      for (let i = 0; i < 40; i++) {
        const tx = MOCK_DATA.generateTransaction(r, undefined, chain);
        const standard = tx.asset.standard ?? '';
        if (chain === 'bitcoin') {
          expect(tx.asset.symbol, 'Bitcoin has no token standard').toBe('BTC');
        }
        if (chain === 'solana') {
          expect(standard, 'a Solana transfer cannot be ERC-20').not.toBe('ERC-20');
        }
        if (chain === 'tron') {
          expect(standard, 'a TRON transfer cannot be ERC-20').not.toBe('ERC-20');
        }
      }
    }
  });

  it('lists the same amount in the summary and the asset', () => {
    const r = seeded();
    for (let i = 0; i < 20; i++) {
      const tx = MOCK_DATA.generateTransaction(r);
      expect(tx.summary[0]).toContain(tx.asset.amount ?? '');
      expect(tx.summary[0]).toContain(tx.asset.symbol);
    }
  });
});

describe('generateWallet', () => {
  it('honours the requested chain and address', () => {
    const wallet = MOCK_DATA.generateWallet(seeded(), '0xAbC0000000000000000000000000000000000001', 'ethereum');
    expect(wallet.chain).toBe('ethereum');
    expect(wallet.address).toBe('0xAbC0000000000000000000000000000000000001');
  });

  it('keeps every activity entry on the wallet chain', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      const wallet = MOCK_DATA.generateWallet(r, undefined, chain);
      expect(wallet.chain).toBe(chain);
      for (const entry of wallet.activity) {
        expect(hasShapeFor(entry.hash, chain), `${entry.hash} is not a ${chain} hash`).toBe(true);
        expect(hasShapeFor(entry.counterparty, chain), `${entry.counterparty} is not a ${chain} address`).toBe(true);
      }
    }
  });

  it('keeps the status note score consistent with the status level', () => {
    const r = seeded();
    for (let i = 0; i < 30; i++) {
      const wallet = MOCK_DATA.generateWallet(r);
      const score = Number(/Score:\s*(\d+)\/100/.exec(wallet.statusNote)?.[1]);
      expect(Number.isFinite(score)).toBe(true);
      if (wallet.status === 'normal') expect(score).toBeLessThan(30);
      if (wallet.status === 'high') expect(score).toBeGreaterThanOrEqual(80);
    }
  });
});

describe('anomaly generation', () => {
  it('always pairs a signal summary with the underlying evidence', () => {
    const r = seeded();
    for (let i = 0; i < 50; i++) {
      const anomaly = MOCK_DATA.randomAnomaly(r);
      expect(anomaly.details.length).toBeGreaterThan(0);
      expect(anomaly.signals).toHaveLength(anomaly.details.length);
      expect(anomaly.score).toBeGreaterThanOrEqual(0);
      expect(anomaly.score).toBeLessThanOrEqual(100);
    }
  });

  it('keeps the score inside the band implied by the level', () => {
    const r = seeded();
    for (let i = 0; i < 200; i++) {
      const { score, level } = MOCK_DATA.randomAnomaly(r);
      if (level === 'normal') expect(score).toBeLessThan(30);
      if (level === 'unusual') expect(score).toBeGreaterThanOrEqual(30);
      if (level === 'elevated') expect(score).toBeGreaterThanOrEqual(60);
      if (level === 'high') expect(score).toBeGreaterThanOrEqual(80);
    }
  });

  it('uses only signal levels the shared type allows', () => {
    const allowed = new Set(['normal', 'unusual', 'elevated', 'high', 'info']);
    const r = seeded();
    for (let i = 0; i < 100; i++) {
      for (const signal of MOCK_DATA.randomAnomaly(r).details) {
        expect(allowed.has(signal.level), `unexpected signal level ${signal.level}`).toBe(true);
        expect(signal.detail.length).toBeGreaterThan(0);
        expect(signal.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('generateAssetsForChain', () => {
  it('returns only assets native to the chain', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      for (const asset of MOCK_DATA.generateAssetsForChain(r, chain)) {
        expect(asset.chain).toBe(chain);
      }
    }
  });

  it('gives Bitcoin nothing but its native asset', () => {
    for (const asset of MOCK_DATA.generateAssetsForChain(seeded(), 'bitcoin')) {
      expect(asset.symbol).toBe('BTC');
      expect(asset.type).toBe('native');
    }
  });

  it('produces stable, chain-scoped ids', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      for (const asset of MOCK_DATA.generateAssetsForChain(r, chain)) {
        expect(asset.id.startsWith(`${chain}-`)).toBe(true);
      }
    }
  });
});

describe('generateNetworkGraph', () => {
  it('grows with depth but stays bounded', () => {
    const r = seeded();
    const shallow = MOCK_DATA.generateNetworkGraph(r, '0xabc', 'ethereum', 1);
    const deep = MOCK_DATA.generateNetworkGraph(r, '0xabc', 'ethereum', 3);
    expect(deep.entities.length).toBeGreaterThan(shallow.entities.length);
    expect(deep.entities.length).toBeLessThanOrEqual(49);
  });

  it('links every node to the focused address', () => {
    const graph = MOCK_DATA.generateNetworkGraph(seeded(), '0xabc', 'ethereum', 2);
    expect(graph.centerId).toBe('0xabc');
    for (const link of graph.links) {
      expect(link.source).toBe('0xabc');
    }
  });

  it('keeps node addresses on the graph chain', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      const graph = MOCK_DATA.generateNetworkGraph(r, MOCK_DATA.generateWallet(r, undefined, chain).address, chain, 2);
      for (const entity of graph.entities) {
        expect(hasShapeFor(entity.address, chain), `${entity.address} is not a ${chain} address`).toBe(true);
      }
    }
  });
});

describe('generateReport', () => {
  it('describes the chain and hash it was asked about', () => {
    const r = seeded();
    for (const chain of CHAINS) {
      const report = MOCK_DATA.generateReport(r, '0xfeedface', chain);
      expect(report.chain).toBe(chain);
      expect(report.txHash).toBe('0xfeedface');
      expect(report.sections[0].body).toContain(CHAIN_NAME[chain]);
    }
  });

  it('keeps the headline score equal to the report score', () => {
    const r = seeded();
    for (let i = 0; i < 20; i++) {
      const report = MOCK_DATA.generateReport(r, '0xfeed', 'ethereum');
      expect(report.sections[0].body).toContain(`${report.score}/100`);
    }
  });
});

describe('bulk generation', () => {
  it('produces the requested count', () => {
    expect(MOCK_DATA.generateMultipleTransactions(7)).toHaveLength(7);
    expect(MOCK_DATA.generateMultipleWallets(4)).toHaveLength(4);
  });

  it('scopes bulk generation to a chain when asked', () => {
    for (const tx of MOCK_DATA.generateMultipleTransactions(10, 'solana')) {
      expect(tx.chain).toBe('solana');
    }
    for (const wallet of MOCK_DATA.generateMultipleWallets(5, 'tron')) {
      expect(wallet.chain).toBe('tron');
    }
  });

  it('is byte-identical on a repeat run', () => {
    // A reload must not re-roll the demo lists: the same screen would show
    // different transactions each time it is opened.
    expect(MOCK_DATA.generateMultipleTransactions(10)).toEqual(MOCK_DATA.generateMultipleTransactions(10));
    expect(MOCK_DATA.generateMultipleWallets(6)).toEqual(MOCK_DATA.generateMultipleWallets(6));
  });
});

describe('wallet coherence', () => {
  const ADDRESS = '0xAbC0000000000000000000000000000000000001';

  /** The same seed pipeline the mock API uses for a pasted address. */
  function walletFor(address = ADDRESS, chain: ChainId = 'ethereum') {
    return MOCK_DATA.generateWallet(createRandom(hashString(`wallet:${chain}:${address}`)), address, chain);
  }

  it('returns the same record for the same address on every call', () => {
    // The bug this guards against: a visitor reloading a wallet page saw a
    // different name, balance and history each time.
    expect(walletFor()).toEqual(walletFor());
    expect(walletFor()).not.toEqual(walletFor('0xAbC0000000000000000000000000000000000002'));
  });

  it('keeps the activity sorted newest first, as the panel caption promises', () => {
    const { activity } = walletFor();
    for (let i = 1; i < activity.length; i++) {
      expect(activity[i - 1].timestamp).toBeGreaterThanOrEqual(activity[i].timestamp);
    }
  });

  it('reads the status note from the same anomaly as the badge', () => {
    for (let i = 0; i < 40; i++) {
      const wallet = MOCK_DATA.generateWallet(seeded(), undefined, CHAINS[i % CHAINS.length]);
      if (wallet.status === 'normal') {
        expect(wallet.statusNote).toMatch(/matches this wallet's observed history/i);
      } else {
        expect(wallet.statusNote).toMatch(/differs/i);
      }
      const score = Number(/Score:\s*(\d+)\/100/.exec(wallet.statusNote)?.[1]);
      expect(Number.isFinite(score)).toBe(true);
    }
  });

  it('never prints an active-hours range that runs backwards', () => {
    for (let i = 0; i < 60; i++) {
      const wallet = MOCK_DATA.generateWallet(seeded(), undefined, CHAINS[i % CHAINS.length]);
      const range = /(\d{1,2}):00 - (\d{1,2}):00 UTC/.exec(wallet.dna.mostActive);
      expect(range, `unparseable range: ${wallet.dna.mostActive}`).not.toBeNull();
      const start = Number(range?.[1]);
      const end = Number(range?.[2]);
      expect(start).toBeLessThanOrEqual(end);
    }
  });

  it('labels each behavior meter once, with a verdict matching its value', () => {
    for (let i = 0; i < 40; i++) {
      const wallet = MOCK_DATA.generateWallet(seeded(), undefined, CHAINS[i % CHAINS.length]);
      const labels = wallet.dna.traits.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
      for (const trait of wallet.dna.traits) {
        const stable = trait.value >= 75;
        const veryVolatile = trait.value < 18;
        if (stable) expect(trait.descriptor).toBe('stable');
        if (veryVolatile) expect(trait.descriptor).toBe('very volatile');
        if (!stable && !veryVolatile) expect(trait.descriptor).not.toBe('stable');
      }
    }
  });

  it('states one frequency, used by both the DNA panel and the chart it sits above', () => {
    for (let i = 0; i < 30; i++) {
      const wallet = MOCK_DATA.generateWallet(seeded(), undefined, CHAINS[i % CHAINS.length]);
      expect(wallet.dna.typicalFrequency).toBe(`${wallet.dna.txPerWeek} transactions/week`);
      // The chart on the same page counts these rows over ~30 days, so the
      // claimed weekly rate cannot be an order of magnitude away from them.
      const weeks = 30 / 7;
      expect(wallet.dna.txPerWeek).toBeLessThanOrEqual(Math.ceil(wallet.activity.length / weeks) + 1);
    }
  });

  it('names the asset that actually dominates the history', () => {
    for (let i = 0; i < 30; i++) {
      const wallet = MOCK_DATA.generateWallet(seeded(), undefined, CHAINS[i % CHAINS.length]);
      const counts = new Map<string, number>();
      for (const row of wallet.activity) counts.set(row.symbol, (counts.get(row.symbol) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      expect(wallet.dna.commonAsset).toBe(top);
    }
  });

  it('counts only counterparties that appear in the history', () => {
    const wallet = walletFor();
    const unique = new Set(wallet.activity.map((a) => a.counterparty)).size;
    expect(wallet.dna.counterparties).toBe(unique);
  });

  it('attributes the wallet to an archetype, not a real person', () => {
    const realPeople = ['Vitalik', 'Changpeng', 'Justin', 'Sam', 'Bankman', 'Satoshi', 'Dorsey', 'Musk'];
    for (let i = 0; i < 60; i++) {
      const wallet = MOCK_DATA.generateWallet(seeded(), undefined, CHAINS[i % CHAINS.length]);
      const label = wallet.label ?? '';
      for (const person of realPeople) {
        expect(label).not.toContain(person);
      }
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
