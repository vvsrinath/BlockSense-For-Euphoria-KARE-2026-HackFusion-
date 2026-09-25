/**
 * How a Solana transaction is described.
 *
 * "0 SOL transferred" was being reported for transactions that moved nothing at
 * all — mints and accounts being created, swaps, closures. That is technically
 * true and useless, so the wording distinguishes a transfer, a failed transfer,
 * a mint creation, and a transaction that simply moved no value.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSolanaAdapter } from '@blocksense/blockchain/solana';

const SIGNATURE = '2s3KJu2sYriyebHBLkQcboiFR6R9Hi1zJwdv2hAMJCfLoKDRZwu9isM8gxn9hSvRznVDPUY469CLTnwmLaA4bhRS';
const MINT = 'CGtd7LetxfmMu7cHBb6DhtwPMFrpCgvKMF2rPmNa';

/**
 * `outer` holds the top-level instructions, where a plain SOL transfer lives;
 * `inner` holds the CPI instructions, where SPL token activity appears.
 */
interface EntryOptions {
  outer?: unknown[];
  err?: unknown;
  blockTime?: number;
}

function entry(inner: unknown[] = [], { outer = [], err = null, blockTime = 1_790_334_480 }: EntryOptions = {}) {
  return {
    result: {
      slot: 450_000_000,
      blockTime,
      meta: {
        err,
        fee: 5000,
        logMessages: [],
        innerInstructions: inner.length ? [{ index: 1, instructions: inner }] : []
      },
      transaction: {
        message: {
          accountKeys: [{ pubkey: 'SoLaDr11111111111111111111111111111111111112' }],
          instructions: outer
        }
      }
    }
  };
}

/** A system transfer, as `jsonParsed` reports it: lamports, not SOL. */
const solTransfer = (sol: number) => ({
  parsed: {
    type: 'transfer',
    info: { source: 'From1', destination: 'Dest1', lamports: Math.round(sol * 1e9), unlamports: sol }
  }
});

function stub(entryBody: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify(entryBody), { status: 200, headers: { 'content-type': 'application/json' } })
    )
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Solana transaction descriptions', () => {
  it('describes a SOL transfer with its amount', async () => {
    stub(entry([], { outer: [solTransfer(1.25)] }));
    const tx = await createSolanaAdapter({ rpcUrl: 'https://rpc.invalid' }).getTransaction(SIGNATURE);
    expect(tx.summary[0]).toBe('1.25 SOL transferred');
  });

  it('names a mint creation instead of claiming a zero transfer', async () => {
    stub(
      entry([
        { parsed: { type: 'createAccount', info: { source: 'From1', newAccount: 'New1', lamports: 2282880 } } },
        { parsed: { type: 'initializeMint2', info: { mint: MINT, decimals: 6 } } }
      ])
    );
    const tx = await createSolanaAdapter({ rpcUrl: 'https://rpc.invalid' }).getTransaction(SIGNATURE);
    expect(tx.summary[0]).toBe(`Created token mint ${MINT.slice(0, 8)}…`);
  });

  it('says nothing moved rather than reporting a zero amount', async () => {
    // A real transaction: an associated token account being created. No mint is
    // created here, so claiming one would be a false positive.
    stub(
      entry([
        { parsed: { type: 'getAccountDataSize', info: { account: MINT } } },
        { parsed: { type: 'createAccount', info: { source: 'From1', newAccount: 'New1', lamports: 2282880 } } },
        { parsed: { type: 'initializeImmutableOwner', info: { account: 'New1' } } },
        { parsed: { type: 'initializeAccount3', info: { account: 'New1', mint: MINT } } }
      ])
    );
    const tx = await createSolanaAdapter({ rpcUrl: 'https://rpc.invalid' }).getTransaction(SIGNATURE);
    expect(tx.summary[0]).toBe('No value transfer detected');
    expect(tx.summary[0]).not.toContain('0 SOL transferred');
  });

  it('marks a failed transfer as failed', async () => {
    stub(entry([], { outer: [solTransfer(2)], err: { InstructionError: [0, 'Custom'] } }));
    const tx = await createSolanaAdapter({ rpcUrl: 'https://rpc.invalid' }).getTransaction(SIGNATURE);
    expect(tx.status).toBe('failed');
    expect(tx.summary[0]).toContain('Failed');
  });

  it('always reports the fee, so a no-value transaction is not silent', async () => {
    stub(entry([{ parsed: { type: 'closeAccount', info: { account: 'New1' } } }]));
    const tx = await createSolanaAdapter({ rpcUrl: 'https://rpc.invalid' }).getTransaction(SIGNATURE);
    expect(tx.summary.some((s) => s.startsWith('Fee'))).toBe(true);
  });
});
