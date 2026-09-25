import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeftIcon, ArrowRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { findAssetId } from '../../services/assets';
import { AddressDisplay, ChainBadge, Panel } from '@blocksense/ui';

import { useSettings } from '../../stores/SettingsContext';
import { formatMoney } from '@blocksense/shared';
import type { Transaction } from '@blocksense/shared';
import { assetAmountLabel, assetKindLabel } from '@blocksense/transaction-engine';

interface AssetCardProps {
  tx: Transaction;
  advanced: boolean;
}

export function AssetCard({ tx, advanced }: AssetCardProps) {
  const { settings } = useSettings();
  const asset = tx.asset;
  const assetId = findAssetId(asset, tx.chain);
  const multi = tx.assets && tx.assets.length > 1 ? tx.assets : null;

  const facts: {label: string;value: React.ReactNode;}[] = [
  { label: 'Asset', value: `${asset.name} (${asset.symbol})` },
  { label: 'Network', value: <ChainBadge chain={tx.chain} /> }];

  if (asset.type === 'nft') {
    facts.push({ label: 'Collection', value: asset.collection ?? asset.name });
    facts.push({ label: 'Token ID', value: <span className="font-mono text-[13px]">#{asset.tokenId}</span> });
  }
  if (advanced) {
    facts.push({ label: 'Standard', value: asset.standard ?? 'Native' });
    if (asset.contractAddress) facts.push({ label: 'Token contract', value: <AddressDisplay value={asset.contractAddress} chain={tx.chain} /> });
    if (asset.decimals !== undefined) facts.push({ label: 'Decimals', value: String(asset.decimals) });
  }

  return (
    <Panel
      title="Asset information"
      description="Exactly what moved"
      action={
      assetId ?
      <Link to={`/assets/${assetId}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
            View asset
            <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </Link> :
      undefined
      }>
      
      {multi ?
      <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">Assets moved in this transaction</caption>
            <thead className="bg-subtle/60 text-xs text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Direction</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Amount</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {multi.map((a) =>
            <tr key={`${a.symbol}-${a.direction}`} className="border-t border-line">
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      {a.direction === 'sent' ? <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                      {a.direction === 'sent' ? 'Sent' : 'Received'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-ink">{assetAmountLabel(a)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted">{a.valueUsd !== undefined ? formatMoney(a.valueUsd, settings.currency) : '—'}</td>
                </tr>
            )}
            </tbody>
          </table>
        </div> :

      <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{asset.symbol.slice(0, 4)}</span>
          <div className="min-w-0">
            <p className="text-xs text-muted">{assetKindLabel(asset)}</p>
            <p className="truncate text-xl font-semibold tabular-nums text-ink">{assetAmountLabel(asset)}</p>
            {asset.valueUsd !== undefined && <p className="text-sm text-muted">≈ {formatMoney(asset.valueUsd, settings.currency)}</p>}
          </div>
        </div>
      }

      <dl className="mt-4">
        {facts.map((f) =>
        <div key={f.label} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
            <dt className="text-sm text-muted">{f.label}</dt>
            <dd className="min-w-0 text-right text-sm text-ink">{f.value}</dd>
          </div>
        )}
      </dl>
    </Panel>);

}