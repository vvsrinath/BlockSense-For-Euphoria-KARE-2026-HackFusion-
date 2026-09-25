import { mockRequest } from '@blocksense/blockchain';
import { allTransactions } from './transactions';
import { allWallets } from './wallets';

export interface SearchMatch {
  type: 'wallet' | 'transaction';
  value: string;
}

/** Resolves shortened forms like "0xA83...91F" against the demo dataset. */
export async function resolveShortForm(input: string): Promise<SearchMatch | null> {
  return mockRequest(() => {
    const [start, end] = input.
    toLowerCase().
    split(/\.{2,3}|…/).
    map((s) => s.trim());
    if (!start || !end) return null;
    const matches = (v: string) => v.toLowerCase().startsWith(start) && v.toLowerCase().endsWith(end);
    const wallet = allWallets().find((w) => matches(w.address));
    if (wallet) return { type: 'wallet', value: wallet.address };
    const tx = allTransactions().find((t) => matches(t.hash));
    if (tx) return { type: 'transaction', value: tx.hash };
    return null;
  }, 80);
}