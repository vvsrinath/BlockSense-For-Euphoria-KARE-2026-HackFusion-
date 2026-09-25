import { ArrowRightIcon, SparklesIcon } from 'lucide-react';
import { findWallet } from '../../api/wallets';
import { AddressDisplay } from '../common/AddressDisplay';
import { ChainBadge } from '../common/ChainBadge';
import { useSettings } from '../../contexts/SettingsContext';
import type { Transaction } from '../../types/transaction';
import { transactionHeadline } from '../../utils/assetDisplay';
import { cn } from '../../utils/cn';
import { formatDateTime, formatMoney } from '../../utils/format';

interface TransactionHeroProps {
  tx: Transaction;
  className?: string;
}

export function TransactionHero({ tx, className }: TransactionHeroProps) {
  const { settings } = useSettings();
  const headline = transactionHeadline(tx);
  const receiverTag = tx.related.find((r) => r.address.toLowerCase() === tx.to.toLowerCase());

  const party = (role: 'From' | 'To', address: string, tag?: string) =>
  <div className="min-w-0 flex-1 rounded-xl bg-subtle/70 px-4 py-3">
      <p className="text-xs text-muted">{role === 'From' ? 'Sender' : 'Receiver'}</p>
      <div className="mt-1">
        <AddressDisplay value={address} chain={tx.chain} to={findWallet(address) ? `/wallet/${address}` : undefined} />
      </div>
      {tag && <p className="mt-1 truncate text-xs font-medium text-primary">{tag}</p>}
    </div>;


  return (
    <section aria-labelledby="tx-hero-heading" className={cn('rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6', className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
        <ChainBadge chain={tx.chain} variant="pill" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {tx.status === 'confirmed' ? 'Confirmed' : tx.status === 'pending' ? 'Pending' : 'Failed'}
        </span>
        <span>{formatDateTime(tx.timestamp, settings.timeFormat)}</span>
      </div>

      <p className="mt-5 text-sm text-muted">What moved</p>
      <h2 id="tx-hero-heading" className="mt-1 break-words text-3xl font-semibold tracking-tight tabular-nums text-ink md:text-[40px] md:leading-tight">
        {headline.title}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {tx.asset.valueUsd !== undefined && <span className="font-medium text-ink">≈ {formatMoney(tx.asset.valueUsd, settings.currency)}</span>}
        {tx.asset.valueUsd !== undefined && ' · '}
        {headline.kind}
      </p>

      <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {party('From', tx.from, findWallet(tx.from)?.tags[0])}
        <ArrowRightIcon className="mx-auto h-4 w-4 shrink-0 rotate-90 text-muted sm:rotate-0" aria-hidden="true" />
        {party('To', tx.to, receiverTag?.label ?? findWallet(tx.to)?.tags[0])}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <SparklesIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          In plain terms
        </h3>
        <ul className="mt-3 space-y-2">
          {tx.summary.map((line) =>
          <li key={line} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
              {line}
            </li>
          )}
        </ul>
        <p className="mt-3 text-xs text-muted">Generated from observed on-chain behavior.</p>
      </div>
    </section>);

}