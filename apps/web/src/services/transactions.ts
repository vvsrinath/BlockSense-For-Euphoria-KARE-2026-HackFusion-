import { ApiError, api } from './api';
import { knownTransaction, recentTransactions, rememberTransaction } from './workspace';
import { detectInput } from '@blocksense/blockchain';
import { TransactionSchema } from '@blocksense/shared';
import type { ChainId, Transaction } from '@blocksense/shared';

/**
 * Look up a transaction by hash.
 *
 * The chain is inferred from the hash shape when the caller does not name one,
 * because a 64-character hex string is a valid Bitcoin txid and a valid TRON
 * hash at the same time. Callers that know the chain should pass it.
 */
export async function getTransaction(hash: string, chain?: ChainId): Promise<Transaction> {
  const resolved = chain ?? detectInput(hash).chains[0] ?? 'ethereum';
  const transaction = await api.transaction(resolved, hash);

  // Validate the fields every consumer depends on, so a provider schema change
  // surfaces here rather than as a blank screen three components deep. The
  // schema is a subset of the full transaction, so the original is returned.
  const parsed = TransactionSchema.safeParse(transaction);
  if (!parsed.success) {
    throw new ApiError('PROVIDER_ERROR', 'The chain returned a transaction in an unexpected shape.', 502);
  }

  rememberTransaction(transaction);
  return transaction;
}

/**
 * Transactions opened in this workspace, newest first.
 *
 * This is the browser's own history, not a chain feed — see `workspace.ts`.
 */
export async function listRecentTransactions(): Promise<Transaction[]> {
  return recentTransactions();
}

/** The stored copy of a transaction, for synchronous rendering. */
export function findTransaction(hash: string): Transaction | undefined {
  return knownTransaction(hash);
}
