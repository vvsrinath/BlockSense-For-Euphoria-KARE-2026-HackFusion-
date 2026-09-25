import { api } from './api';
import type { ChainId, Transaction, Wallet } from '@blocksense/shared';

export interface SearchMatch {
  type: 'wallet' | 'transaction';
  value: string;
  chain: ChainId;
}

/**
 * Resolve a pasted identifier against the chains.
 *
 * The API classifies the input and, when the chain is unambiguous, fetches the
 * record. A 64-character hex string is a valid Bitcoin txid *and* a valid TRON
 * hash, so ambiguity is reported rather than guessed at — resolving it silently
 * would send the user to the wrong chain half the time.
 */
export async function searchIdentifier(query: string, chain?: ChainId): Promise<SearchMatch | null> {
  const result = await api.search(query, chain);

  if (result.resolved) {
    const { type, data } = result.resolved;
    const value = type === 'transaction' ? (data as Transaction).hash : (data as Wallet).address;
    return { type, value, chain: result.resolved.chain };
  }

  return null;
}

/** Every chain that could hold this identifier, for the UI to disambiguate. */
export async function searchCandidates(query: string): Promise<{ chain: ChainId; reason: string }[]> {
  const result = await api.search(query);
  return result.candidates.map((c) => ({ chain: c.chain, reason: c.reason }));
}
