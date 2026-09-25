/**
 * Search: classify a pasted identifier and resolve it.
 *
 * The search box cannot ask the user which chain they mean, so this does three
 * things in order: work out what the input *is* from its shape, work out which
 * chains accept it, and — when a chain is named or unambiguous — actually fetch
 * the record. Chain ambiguity is reported rather than guessed, because the same
 * 64 hex characters are a valid Bitcoin txid and a valid TRON transaction id.
 */

import type { ChainId, Transaction, Wallet } from '@blocksense/shared';
import { detectInput, isSupportedChain } from '@blocksense/blockchain';
import type { DetectedKind } from '@blocksense/blockchain';
import { getTransaction, getWallet, inferChain } from './index';

export interface SearchCandidate {
  chain: ChainId;
  kind: DetectedKind;
  /** Why this chain was considered, for the UI to explain the suggestion. */
  reason: string;
}

export interface SearchResult {
  query: string;
  kind: DetectedKind;
  /** Chains that could plausibly hold this identifier. */
  candidates: SearchCandidate[];
  /** Set when the input resolved to exactly one chain. */
  resolved?: { chain: ChainId; type: 'transaction'; data: Transaction } | { chain: ChainId; type: 'wallet'; data: Wallet };
  /** Set when more than one chain is plausible and none was named. */
  ambiguous?: boolean;
  error?: { code: string; message: string };
}

const KIND_LABEL: Record<DetectedKind, string> = {
  address: 'address',
  transaction: 'transaction',
  block: 'block number',
  shortened: 'shortened identifier',
  unknown: 'identifier'
};

export async function search(query: string, chainHint?: string): Promise<SearchResult> {
  const value = query.trim();
  const detected = detectInput(value);

  const candidates: SearchCandidate[] = detected.chains.map((chain) => ({
    chain,
    kind: detected.kind,
    reason: `${KIND_LABEL[detected.kind]} shape matches ${chain}`
  }));

  // An unknown shape is a client error, not a chain problem.
  if (detected.kind === 'unknown') {
    return {
      query: value,
      kind: detected.kind,
      candidates,
      error: {
        code: 'INVALID_REQUEST',
        message: 'That does not look like an address or transaction hash on any supported chain.'
      }
    };
  }

  // Prefer an explicit, supported chain hint over shape detection.
  const hinted = chainHint && isSupportedChain(chainHint) ? chainHint : undefined;
  const target = hinted ?? (candidates.length === 1 ? candidates[0].chain : undefined);

  if (!target) {
    return { query: value, kind: detected.kind, candidates, ambiguous: true };
  }

  try {
    const chain = target;
    if (detected.kind === 'transaction') {
      return {
        query: value,
        kind: detected.kind,
        candidates: candidates.length ? candidates : [{ chain, kind: detected.kind, reason: 'named by request' }],
        resolved: { chain, type: 'transaction', data: await getTransaction(chain, value) }
      };
    }
    return {
      query: value,
      kind: detected.kind,
      candidates: candidates.length ? candidates : [{ chain, kind: detected.kind, reason: 'named by request' }],
      resolved: { chain, type: 'wallet', data: await getWallet(chain, value) }
    };
  } catch (err) {
    // The identifier was well formed but nothing came back. Report it on the
    // result so the UI can show a message next to the input.
    return {
      query: value,
      kind: detected.kind,
      candidates: candidates.length ? candidates : [{ chain: target, kind: detected.kind, reason: 'named by request' }],
      error: {
        code: (err as { code?: string })?.code ?? 'PROVIDER_ERROR',
        message: err instanceof Error ? err.message : String(err)
      }
    };
  }
}

export { inferChain };
