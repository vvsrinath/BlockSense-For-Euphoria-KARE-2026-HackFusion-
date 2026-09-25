/**
 * Anomaly signals.
 *
 * Each detector answers one question and returns zero or more signals. A
 * signal is evidence plus an explanation, never a bare number — an analyst
 * needs to know *why* something was flagged, or the score is not actionable.
 */

import type { AnomalySignal, Transaction, Wallet } from '@blocksense/shared';
import { formatMoney, formatRelative } from '@blocksense/shared';
import { SIGNAL_WEIGHTS } from '../scoring/score';

export interface SignalContext {
  /** The wallet under investigation. */
  focusAddress: string;
  /** Median USD value of the wallet's transactions, for relative comparisons. */
  medianUsd?: number;
  /** Transactions per week over the wallet's observed lifetime. */
  txPerWeek?: number;
  now?: number;
}

let signalSeq = 0;

function signal(
  kind: AnomalySignal['kind'],
  level: AnomalySignal['level'],
  label: string,
  value: string,
  detail: string
): AnomalySignal {
  signalSeq += 1;
  return { id: `sig_${signalSeq}`, kind, level, label, value, detail };
}

/**
 * An amount far outside the wallet's own history is the single strongest
 * signal available. Compared against the wallet's median rather than an
 * absolute threshold, because "unusual" is relative to who is being watched.
 */
export function detectAmountAnomaly(tx: Transaction, ctx: SignalContext): AnomalySignal[] {
  const value = tx.asset.valueUsd;
  if (value === undefined || !ctx.medianUsd || ctx.medianUsd <= 0) return [];

  const ratio = value / ctx.medianUsd;
  if (ratio < 5 && ratio > 0.2) return [];

  const level = ratio >= 25 ? 'high' : 'unusual';
  const direction = ratio >= 1 ? 'larger' : 'smaller';

  return [
    signal(
      'amount',
      level,
      'Unusual amount',
      `${ratio.toFixed(1)}× median`,
      `This transfer is ${ratio.toFixed(1)}× ${direction} than the wallet's median transfer of ${formatMoney(ctx.medianUsd)}.`
    )
  ];
}

/** A burst of transactions in a short window suggests scripted or automated activity. */
export function detectFrequencyAnomaly(_tx: Transaction, ctx: SignalContext): AnomalySignal[] {
  if (ctx.txPerWeek === undefined) return [];
  // Ten transactions a week is already high for an individual wallet.
  if (ctx.txPerWeek < 10) return [];

  return [
    signal(
      'frequency',
      ctx.txPerWeek >= 25 ? 'high' : 'unusual',
      'High transaction rate',
      `${ctx.txPerWeek.toFixed(0)} tx/week`,
      `This wallet averages ${ctx.txPerWeek.toFixed(0)} transactions per week, which is consistent with automated or batch activity.`
    )
  ];
}

/** Counterparties that repeatedly appear are worth surfacing as a cluster. */
export function detectRelationshipAnomaly(tx: Transaction, ctx: SignalContext): AnomalySignal[] {
  void ctx;
  const related = tx.related ?? [];
  if (related.length < 3) return [];

  return [
    signal(
      'relationship',
      related.length >= 6 ? 'high' : 'unusual',
      'Dense counterparty set',
      `${related.length} wallets`,
      `This transaction touches ${related.length} distinct addresses in a single transfer, which is unusual outside of a contract interaction.`
    )
  ];
}

/** Activity outside the wallet's usual hours can indicate time-zone automation. */
export function detectTemporalAnomaly(tx: Transaction): AnomalySignal[] {
  if (!tx.timestamp) return [];
  const hour = new Date(tx.timestamp).getUTCHours();
  // 02:00-05:00 UTC is low-activity for most human wallets.
  if (hour < 2 || hour > 5) return [];

  return [
    signal(
      'time',
      'info',
      'Off-hours activity',
      `${String(hour).padStart(2, '0')}:00 UTC`,
      `This transaction was broadcast at ${String(hour).padStart(2, '0')}:00 UTC, outside the wallet's typical active hours.`
    )
  ];
}

/** A very young wallet moving value is a common risk pattern. */
export function detectWalletAgeAnomaly(wallet: Wallet, ctx: SignalContext): AnomalySignal[] {
  const ageDays = ((ctx.now ?? Date.now()) - wallet.firstSeen) / 86_400_000;
  if (wallet.firstSeen === 0 || ageDays > 30) return [];

  return [
    signal(
      'history',
      ageDays <= 7 ? 'high' : 'unusual',
      'Recently created wallet',
      `${Math.max(0, Math.round(ageDays))} days old`,
      `This wallet was first seen ${formatRelative(wallet.firstSeen, ctx.now)} and has already moved ${formatMoney(wallet.totalInUsd + wallet.totalOutUsd)}.`
    )
  ];
}

/** Run every applicable detector and return the combined evidence. */
export function detectAll(tx: Transaction, ctx: SignalContext): AnomalySignal[] {
  return [
    ...detectAmountAnomaly(tx, ctx),
    ...detectFrequencyAnomaly(tx, ctx),
    ...detectRelationshipAnomaly(tx, ctx),
    ...detectTemporalAnomaly(tx)
  ].sort((a, b) => SIGNAL_WEIGHTS[b.kind] - SIGNAL_WEIGHTS[a.kind]);
}
