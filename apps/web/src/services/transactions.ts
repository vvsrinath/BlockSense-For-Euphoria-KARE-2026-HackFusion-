import { mockTransactions } from '../mock/mockTransactions';
import { TransactionSchema } from '@blocksense/shared';
import type { Transaction } from '@blocksense/shared';
import { mockRequest, sameValue } from '@blocksense/blockchain';

export function findTransaction(hash: string): Transaction | undefined {
  return mockTransactions.find((tx) => sameValue(tx.hash, hash));
}

export async function getTransaction(hash: string): Promise<Transaction | null> {
  return mockRequest(() => {
    const tx = findTransaction(hash);
    if (!tx) return null;
    TransactionSchema.parse(tx);
    return tx;
  }, 200);
}

export async function listRecentTransactions(): Promise<Transaction[]> {
  return mockRequest(() => [...mockTransactions].sort((a, b) => b.timestamp - a.timestamp), 80);
}

export function allTransactions(): Transaction[] {
  return mockTransactions;
}