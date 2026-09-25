import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { ChainBadge } from '@blocksense/ui';
import { formatCompact } from '@blocksense/shared';
import type { Asset } from '@blocksense/shared';
interface AssetTableProps {
  assets: Asset[];
}

export function AssetTable({ assets }: AssetTableProps) {
  return (
    <div className="-mx-5 overflow-x-auto md:-mx-6">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Assets</caption>
        <thead>
          <tr className="border-b border-line text-xs font-medium text-muted">
            <th scope="col" className="px-5 pb-2 font-medium md:px-6">
              Asset
            </th>
            <th scope="col" className="pb-2 font-medium">
              Symbol
            </th>
            <th scope="col" className="pb-2 font-medium">
              Chain
            </th>
            <th scope="col" className="pb-2 font-medium">
              Type
            </th>
            <th scope="col" className="pb-2 text-right font-medium">
              Holders
            </th>
            <th scope="col" className="px-5 pb-2 text-right font-medium md:px-6">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) =>
          <tr key={asset.id} className="border-b border-line last:border-b-0">
              <td className="px-5 py-3 md:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {asset.symbol.slice(0, 3)}
                  </span>
                  <span className="font-medium text-ink">{asset.name}</span>
                </div>
              </td>
              <td className="py-3 font-mono text-[13px] text-ink">{asset.symbol}</td>
              <td className="py-3">
                <ChainBadge chain={asset.chain} />
              </td>
              <td className="py-3 text-muted">{asset.standard}</td>
              <td className="py-3 text-right tabular-nums text-ink">{asset.holders ? formatCompact(asset.holders) : '—'}</td>
              <td className="px-5 py-3 text-right md:px-6">
                <Link
                to={`/assets/${asset.id}`}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label={`View ${asset.name} on ${asset.chain}`}>
                
                  View
                  <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}