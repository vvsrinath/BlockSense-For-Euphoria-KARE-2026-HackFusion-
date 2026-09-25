import { Link } from 'react-router-dom';
import { ArrowRightIcon, StarIcon } from 'lucide-react';
import { listRecentTransactions } from '../services/transactions';
import { Button, ErrorState, LevelBadge, Panel, Skeleton } from '@blocksense/ui';

import { ChainStatusStrip } from '../components/home/ChainStatusStrip';
import { QuickAnalyze } from '../components/home/QuickAnalyze';
import { PageContainer } from '../components/layout/PageContainer';
import { TransactionTable } from '../components/tables/TransactionTable';
import { useWatchlist } from '../stores/WatchlistContext';
import { DEMO_TX_HASH } from '../mock/mockAddresses';
import { useAsync } from '../hooks/useAsync';
import { truncateMiddle } from '@blocksense/shared';
import { rowFromTransaction } from '../utils/rows';
import { watchItemPath } from '@blocksense/shared';

export function Home() {
  const recent = useAsync(listRecentTransactions, 'recent');
  const { items } = useWatchlist();

  return (
    <PageContainer className="space-y-4 lg:space-y-6">
      <h1 className="sr-only">Home</h1>
      <QuickAnalyze />
      <ChainStatusStrip />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Panel title="Recent analyses" description="Transactions opened in this workspace" className="lg:col-span-2">
          {recent.status === 'error' ?
          <ErrorState error={recent.error} onRetry={recent.retry} className="py-4" /> :
          !recent.data ?
          <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) =>
            <Skeleton key={i} className="h-12" />
            )}
            </div> :

          <TransactionTable caption="Recent analyses" rows={recent.data.map(rowFromTransaction)} />
          }
        </Panel>

        <div className="space-y-4 lg:space-y-6">
          <section aria-labelledby="demo-heading" className="rounded-2xl border border-danger/20 bg-surface p-5 shadow-card md:p-6">
            <div className="flex items-center justify-between">
              <h2 id="demo-heading" className="text-[15px] font-semibold text-ink">
                Demo investigation
              </h2>
              <LevelBadge level="high" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-ink">500 USDC</p>
            <p className="text-sm text-muted">Ethereum · anomaly score 87/100</p>
            <ul className="mt-4 space-y-1.5 text-sm text-ink">
              <li>Amount 12.5× higher than normal</li>
              <li>First interaction with receiver</li>
              <li>Connected to a high-anomaly wallet</li>
            </ul>
            <Button to={`/analyze/tx/${DEMO_TX_HASH}`} className="mt-5 w-full" iconRight={ArrowRightIcon}>
              Open analysis
            </Button>
          </section>

          <Panel
            title="Watchlist"
            action={
            <Link to="/watchlist" className="text-[13px] font-medium text-primary hover:underline">
                View all
              </Link>
            }>
            
            {items.length === 0 ?
            <div className="py-4 text-center">
                <StarIcon className="mx-auto h-5 w-5 text-muted" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted">Nothing watched yet.</p>
              </div> :

            <ul className="-mx-2">
                {items.slice(0, 4).map((item) =>
              <li key={item.id}>
                    <Link to={watchItemPath(item)} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-subtle">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{item.label ?? truncateMiddle(item.value)}</span>
                        <span className="block font-mono text-xs text-muted">
                          {item.kind === 'transaction' ? 'Tx' : item.kind.charAt(0).toUpperCase() + item.kind.slice(1)} · {truncateMiddle(item.value)}
                        </span>
                      </span>
                      <LevelBadge level={item.status} />
                    </Link>
                  </li>
              )}
              </ul>
            }
          </Panel>
        </div>
      </div>
    </PageContainer>);

}