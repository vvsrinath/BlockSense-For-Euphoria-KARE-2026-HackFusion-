import { findTransaction } from '../api/transactions';
import type { AnomalyLevel, ChainId } from '../types/chain';
import type { Transaction } from '../types/transaction';
import type { WalletActivity } from '../types/wallet';
import { transactionHeadline } from './assetDisplay';
import { formatAmount, truncateMiddle } from './format';

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
    to: `/analyze/tx/${tx.hash}`,
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
    to: known ? `/analyze/tx/${activity.hash}` : undefined,
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