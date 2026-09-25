import { useParams } from 'react-router-dom';
import { ArrowRightIcon, SearchXIcon } from 'lucide-react';
import { getAsset, getAssetTransfers } from '../services/assets';
import { AddressDisplay, Button, ChainBadge, EmptyState, ErrorState, Panel, Skeleton, StatCard } from '@blocksense/ui';

import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { WatchButton } from '../components/watchlist/WatchButton';
import { useSettings } from '../stores/SettingsContext';
import { useAsync } from '../hooks/useAsync';
import { formatCompact, formatDateTime, formatMoney, formatNumber, truncateMiddle } from '@blocksense/shared';
import type { Asset, AssetTransfer } from '@blocksense/shared';
function TransferList({ transfers, asset }: {transfers: AssetTransfer[];asset: Asset;}) {
  const { settings } = useSettings();
  return (
    <ul className="divide-y divide-line">
      {transfers.map((t) =>
      <li key={t.hash} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {asset.type === 'nft' ? '1 item' : `${formatNumber(t.amount, 2)} ${asset.symbol}`}
              <span className="ml-2 font-normal text-muted">≈ {formatMoney(t.valueUsd, settings.currency)}</span>
            </p>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted">
              {truncateMiddle(t.from)}
              <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
              {truncateMiddle(t.to)}
            </p>
          </div>
          <p className="text-xs text-muted">{formatDateTime(t.timestamp, settings.timeFormat)}</p>
        </li>
      )}
    </ul>);

}

function AssetBody({ asset }: {asset: Asset;}) {
  const { settings } = useSettings();
  const transfers = useAsync(() => getAssetTransfers(asset), `transfers:${asset.id}`);
  const related = transfers.data ? Array.from(new Set(transfers.data.large.flatMap((t) => [t.from, t.to]))).slice(0, 5) : [];

  return (
    <>
      <PageHeader
        back={{ to: '/assets', label: 'Assets & Tokens' }}
        title={asset.name}
        description={asset.description}
        meta={
        <>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-medium text-primary">{asset.symbol}</span>
            <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-muted">{asset.standard}</span>
            <ChainBadge chain={asset.chain} variant="pill" />
          </>
        }
        actions={<WatchButton kind="token" value={asset.contract ?? `${asset.chain}:${asset.symbol}`} chain={asset.chain} status="normal" label={asset.name} assetId={asset.id} />} />
      

      <section aria-label="Asset facts" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          <StatCard label="Holders" value={asset.holders ? formatCompact(asset.holders) : 'Not available'} hint="Number of addresses holding this asset." />
          <StatCard label="Total supply" value={asset.totalSupply ?? 'Not available'} />
          <StatCard label="Price (demo)" value={asset.priceUsd !== undefined ? formatMoney(asset.priceUsd, settings.currency) : '—'} />
          <StatCard label="Decimals" value={asset.decimals !== undefined ? String(asset.decimals) : '—'} hint="How many decimal places the asset uses. USDC uses 6, so 1 USDC = 1,000,000 units." />
        </dl>
        {asset.contract &&
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
            <span className="text-muted">Contract</span>
            <AddressDisplay value={asset.contract} chain={asset.chain} start={8} end={6} />
          </div>
        }
      </section>

      {transfers.status === 'error' ?
      <ErrorState error={transfers.error} onRetry={transfers.retry} /> :
      !transfers.data ?
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div> :

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-3 lg:gap-6">
          <Panel title="Recent transfers" description="Sample transfers · demo data" className="lg:col-span-2">
            <TransferList transfers={transfers.data.recent} asset={asset} />
          </Panel>
          <div className="space-y-4 lg:space-y-6">
            <Panel title="Large transfers" description="Biggest moves in the sample">
              <TransferList transfers={transfers.data.large} asset={asset} />
            </Panel>
            <Panel title="Related wallets" description="Counterparties in large transfers">
              <ul className="space-y-2">
                {related.map((address) =>
              <li key={address}>
                    <AddressDisplay value={address} showExplorer={false} />
                  </li>
              )}
              </ul>
            </Panel>
          </div>
        </div>
      }
    </>);

}

export function TokenDetails() {
  const { id = '' } = useParams();
  const { data, status, error, retry } = useAsync(() => getAsset(id), `asset:${id}`);

  return (
    <PageContainer>
      {status === 'error' ?
      <ErrorState error={error} onRetry={retry} /> :
      status === 'loading' ?
      <>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-80" />
          <Skeleton className="mt-8 h-32" />
        </> :
      !data ?
      <EmptyState icon={SearchXIcon} title="Asset not found" description="This asset isn't in the demo dataset." action={<Button to="/assets">Browse assets</Button>} /> :

      <AssetBody asset={data} />
      }
    </PageContainer>);

}