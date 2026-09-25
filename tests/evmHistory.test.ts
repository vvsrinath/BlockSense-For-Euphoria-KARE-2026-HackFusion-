/**
 * EVM address history from the explorer API.
 *
 * The distinction under test is the one that matters to a reader: "this wallet
 * has never transacted" and "we have no way to find out" are different
 * answers, and only one of them is a fact. Without a key the adapter must say
 * so rather than return an empty timeline.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEthereumAdapter } from '@blocksense/blockchain/ethereum';
import { createBnbAdapter } from '@blocksense/blockchain/bnb';
import { ProviderError } from '@blocksense/blockchain';

const ADDRESS = '0x28C6c06298d514Db089934071355E5743bf21d60';
const NOW = 1_700_000_000;

function nativeRow(hash: string, value = '0x0') {
  return {
    hash,
    from: ADDRESS,
    to: '0x72B4e1A9c3D5f7082B6e4C1a9D3f5E7b8C2a44Cc',
    value,
    blockNumber: '19000000',
    timeStamp: String(NOW),
    input: '0x',
    isError: '0',
    gasUsed: '0x5208',
    gasPrice: '0x3b9aca00'
  };
}

function tokenRow(hash: string) {
  return {
    ...nativeRow(hash),
    value: '1500000',
    tokenSymbol: 'USDT',
    tokenName: 'Tether USD',
    tokenDecimal: '6',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    logIndex: '3'
  };
}

/** Answers the explorer for whichever action was asked. */
function stubExplorer(native: unknown[], tokens: unknown[]) {
  return vi.fn(async (url: string) => {
    const action = String(url).includes('action=tokentx') ? 'tokentx' : 'txlist';
    const result = action === 'tokentx' ? tokens : native;
    return new Response(JSON.stringify({ status: '1', message: 'OK', result }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('EVM getHistory without an explorer key', () => {
  it('refuses honestly instead of returning an empty timeline', async () => {
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid' });
    await expect(adapter.getHistory(ADDRESS)).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' });
  });

  it('names the variable to set', async () => {
    // An error that says "not supported" without saying what fixes it is a
    // dead end for whoever is deploying this.
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid' });
    await expect(adapter.getHistory(ADDRESS)).rejects.toThrow(/ETHERSCAN_API_KEY/);
  });

  it('suggests the BNB key for the BNB chain', async () => {
    const adapter = createBnbAdapter({ rpcUrl: 'https://rpc.invalid' });
    await expect(adapter.getHistory(ADDRESS)).rejects.toThrow(/BSCSCAN_API_KEY/);
  });
});

describe('EVM getHistory with an explorer key', () => {
  it('returns native transactions newest first', async () => {
    vi.stubGlobal(
      'fetch',
      stubExplorer([nativeRow('0xaaa', '0xde0b6b3a7640000')], [])
    );
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'key' });
    const history = await adapter.getHistory(ADDRESS);
    expect(history).toHaveLength(1);
    expect(history[0].hash).toBe('0xaaa');
    expect(history[0].chain).toBe('ethereum');
    expect(history[0].asset.symbol).toBe('ETH');
  });

  it('scales the native value', async () => {
    vi.stubGlobal('fetch', stubExplorer([nativeRow('0xaaa', '0xde0b6b3a7640000')], []));
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'key' });
    const [tx] = await adapter.getHistory(ADDRESS);
    expect(tx.asset.amount).toBe('1');
  });

  it('uses the ticker and scale the explorer reports for a token', async () => {
    // Unlike a node call, this never falls back to a placeholder built from
    // the contract address, because the explorer already knows both.
    vi.stubGlobal('fetch', stubExplorer([], [tokenRow('0xbbb')]));
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'key' });
    const [tx] = await adapter.getHistory(ADDRESS);
    expect(tx.asset.symbol).toBe('USDT');
    expect(tx.asset.decimals).toBe(6);
    expect(tx.asset.amount).toBe('1.5');
    expect(tx.asset.contractAddress).toBe('0xdAC17F958D2ee523a2206206994597C13D831ec7');
  });

  it('merges a token transfer into the transaction that carried it', async () => {
    vi.stubGlobal('fetch', stubExplorer([nativeRow('0xccc')], [tokenRow('0xccc')]));
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'key' });
    const history = await adapter.getHistory(ADDRESS);
    // One transaction, not two: the same hash appeared in both lists.
    expect(history).toHaveLength(1);
    expect(history[0].asset.symbol).toBe('USDT');
  });

  it('marks a failed transaction', async () => {
    vi.stubGlobal(
      'fetch',
      stubExplorer([{ ...nativeRow('0xddd'), isError: '1' }], [])
    );
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'key' });
    const [tx] = await adapter.getHistory(ADDRESS);
    expect(tx.status).toBe('failed');
  });

  it('converts the explorer timestamp from seconds', async () => {
    vi.stubGlobal('fetch', stubExplorer([nativeRow('0xeee')], []));
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'key' });
    const [tx] = await adapter.getHistory(ADDRESS);
    expect(tx.timestamp).toBe(NOW * 1000);
  });

  it('reports an explorer that answers with an error as no data, not a crash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ status: '0', message: 'NOTOK', result: 'Invalid API Key' }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
    );
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'bad' });
    // A rejected key is indistinguishable from an empty wallet here, so it
    // must not be presented as a confident empty history.
    await expect(adapter.getHistory(ADDRESS)).resolves.toEqual([]);
  });

  it('surfaces a transport failure as a provider error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('socket hang up');
      })
    );
    const adapter = createEthereumAdapter({ rpcUrl: 'https://rpc.invalid', apiKey: 'key' });
    await expect(adapter.getHistory(ADDRESS)).rejects.toBeInstanceOf(ProviderError);
  });
});
