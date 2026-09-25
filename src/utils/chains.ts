import { chains } from '../data/chains';
import type { ChainId, ChainInfo } from '../types/chain';

export function getChain(id: ChainId): ChainInfo {
  return chains.find((c) => c.id === id) ?? chains[1];
}

export function explorerUrl(chain: ChainId, value: string, type: 'address' | 'tx'): string {
  const info = getChain(chain);
  return `${type === 'tx' ? info.txExplorer : info.addressExplorer}${value}`;
}