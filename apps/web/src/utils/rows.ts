import { findTransaction } from '../services/transactions';
import type { AnomalyLevel, ChainId, Transaction, WalletActivity } from '@blocksense/shared';
import { formatAmount, truncateMiddle } from '@blocksense/shared';

import { transactionHeadline } from '@blocksense/transaction-engine';

export interface TransactionRow {
  id: string;
  to?: string;
  title: string;
  subtitle: string;
  chain: ChainId;
  timestamp: number;
  level: AnomalyLevel;
  score?: number;
  direction?: 'in' | 'out';
  valueUsd?: number;
}

export function rowFromTransaction(tx: Transaction): TransactionRow {
  return {
    id: tx.hash,
    // Carried in the URL so reopening never re-guesses the chain from the
    // hash shape, which is ambiguous across four of the five chains.
    to: `/analyze/tx/${tx.hash}?chain=${tx.chain}`,
    title: transactionHeadline(tx).title,
    subtitle: `${truncateMiddle(tx.from)} → ${truncateMiddle(tx.to)}`,
    chain: tx.chain,
    timestamp: tx.timestamp,
    level: tx.anomaly?.level ?? 'normal',
    score: tx.anomaly?.score,
    valueUsd: tx.asset.valueUsd
  };
}

export function rowFromActivity(activity: WalletActivity, chain: ChainId): TransactionRow {
  const known = findTransaction(activity.hash);
  return {
    id: activity.hash,
    // Always linked, and with the chain: a 64-hex activity hash is a valid
    // TRON id and a valid Bitcoin txid, so the page has to be told which one.
    to: `/analyze/tx/${activity.hash}?chain=${chain}`,
    title: `${activity.direction === 'out' ? 'Sent' : 'Received'} ${formatAmount(activity.amount, activity.symbol)}`,
    subtitle: `${activity.direction === 'out' ? 'To' : 'From'} ${truncateMiddle(activity.counterparty)}`,
    chain,
    timestamp: activity.timestamp,
    level: activity.level,
    score: known?.anomaly?.score,
    direction: activity.direction,
    valueUsd: activity.valueUsd
  };
}