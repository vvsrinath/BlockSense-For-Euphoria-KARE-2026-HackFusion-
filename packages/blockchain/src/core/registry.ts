import type { ChainId, ChainInfo } from '@blocksense/shared';

export const chains: ChainInfo[] = [
{
  id: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  color: '#F7931A',
  latestLabel: 'Latest block',
  latestHeight: 892431,
  avgBlockTime: '~10 min blocks',
  addressExplorer: 'https://mempool.space/address/',
  txExplorer: 'https://mempool.space/tx/'
},
{
  id: 'ethereum',
  name: 'Ethereum',
  symbol: 'ETH',
  color: '#627EEA',
  latestLabel: 'Latest block',
  latestHeight: 19283411,
  avgBlockTime: '~12 sec blocks',
  addressExplorer: 'https://etherscan.io/address/',
  txExplorer: 'https://etherscan.io/tx/'
},
{
  id: 'bnb',
  name: 'BNB Chain',
  symbol: 'BNB',
  color: '#F0B90B',
  latestLabel: 'Latest block',
  latestHeight: 36482112,
  avgBlockTime: '~3 sec blocks',
  addressExplorer: 'https://bscscan.com/address/',
  txExplorer: 'https://bscscan.com/tx/'
},
{
  id: 'tron',
  name: 'TRON',
  symbol: 'TRX',
  color: '#EF0027',
  latestLabel: 'Latest block',
  latestHeight: 62189441,
  avgBlockTime: '~3 sec blocks',
  addressExplorer: 'https://tronscan.org/#/address/',
  txExplorer: 'https://tronscan.org/#/transaction/'
},
{
  id: 'solana',
  name: 'Solana',
  symbol: 'SOL',
  color: '#9945FF',
  latestLabel: 'Latest slot',
  latestHeight: 281994221,
  avgBlockTime: '~0.4 sec slots',
  addressExplorer: 'https://solscan.io/account/',
  txExplorer: 'https://solscan.io/tx/'
}];

/** Look up a chain's metadata. Falls back to Ethereum for an unknown id. */
export function getChain(id: ChainId): ChainInfo {
  return chains.find((c) => c.id === id) ?? chains[1];
}

export function isSupportedChain(id: string): id is ChainId {
  return chains.some((c) => c.id === id);
}

/** Build a block-explorer deep link for an address or transaction. */
export function explorerUrl(chain: ChainId, value: string, type: 'address' | 'tx'): string {
  const info = getChain(chain);
  return `${type === 'tx' ? info.txExplorer : info.addressExplorer}${value}`;
}