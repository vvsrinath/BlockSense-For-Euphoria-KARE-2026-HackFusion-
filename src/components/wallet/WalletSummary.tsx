import { AddressDisplay } from '../common/AddressDisplay';
import { ChainBadge } from '../common/ChainBadge';
import { LevelBadge } from '../common/LevelBadge';
import { StatCard } from '../common/StatCard';
import { useSettings } from '../../contexts/SettingsContext';
import type { Wallet } from '../../types/wallet';
import { formatDate, formatMoney, formatNumber } from '../../utils/format';

export function WalletSummary({ wallet }: {wallet: Wallet;}) {
  const { settings } = useSettings();
  return (
    <section aria-label="Wallet overview" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted">{wallet.label ?? 'Wallet'}</p>
          <div className="mt-1 [&_span.font-mono]:text-lg [&_span.font-mono]:font-semibold md:[&_span.font-mono]:text-xl">
            <AddressDisplay value={wallet.address} chain={wallet.chain} start={8} end={6} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ChainBadge chain={wallet.chain} variant="pill" />
            {wallet.tags.map((tag) =>
            <span key={tag} className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-muted">
                {tag}
              </span>
            )}
          </div>
        </div>
        <div className="max-w-sm rounded-xl bg-subtle/70 p-3.5">
          <LevelBadge level={wallet.status} label={wallet.status === 'normal' ? 'Normal behavior' : undefined} size="md" />
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{wallet.statusNote}</p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 md:grid-cols-5">
        <StatCard label="First seen" value={formatDate(wallet.firstSeen)} hint="The first transaction observed for this wallet." />
        <StatCard label="Transactions" value={formatNumber(wallet.txCount)} />
        <StatCard label="Total in" value={formatMoney(wallet.totalInUsd, settings.currency)} />
        <StatCard label="Total out" value={formatMoney(wallet.totalOutUsd, settings.currency)} />
        <StatCard label="Last active" value={formatDate(wallet.lastActive)} className="col-span-2 md:col-span-1" />
      </dl>
    </section>);

}