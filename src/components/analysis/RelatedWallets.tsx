import { NetworkIcon } from 'lucide-react';
import { findWallet } from '../../api/wallets';
import { AddressDisplay } from '../common/AddressDisplay';
import { Button } from '../common/Button';
import { LevelBadge } from '../common/LevelBadge';
import { Panel } from '../common/Panel';
import type { ChainId } from '../../types/chain';
import type { RelatedWallet } from '../../types/transaction';
import { cn } from '../../utils/cn';
import { nodeKindMeta } from '../../utils/nodeKinds';

interface RelatedWalletsProps {
  related: RelatedWallet[];
  chain: ChainId;
  networkAddress?: string;
  className?: string;
}

export function RelatedWallets({ related, chain, networkAddress, className }: RelatedWalletsProps) {
  return (
    <Panel title="Related wallets" description="Observed connections around this transaction" className={cn('flex flex-col', className)} bodyClassName="flex flex-1 flex-col">
      <ul className="space-y-1">
        {related.map((r) => {
          const meta = nodeKindMeta[r.kind];
          const Icon = meta.icon;
          return (
            <li key={r.address} className="flex items-start gap-3 rounded-xl py-2.5">
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.soft)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-medium text-ink">{r.label}</p>
                  <LevelBadge level={r.level} />
                </div>
                <AddressDisplay value={r.address} chain={chain} to={findWallet(r.address) ? `/wallet/${r.address}` : undefined} className="mt-0.5" />
                <p className="mt-0.5 text-xs text-muted">{r.relationship}</p>
              </div>
            </li>);

        })}
      </ul>
      {networkAddress &&
      <div className="mt-auto pt-4">
          <Button to={`/network?address=${encodeURIComponent(networkAddress)}`} variant="soft" icon={NetworkIcon} className="w-full">
            Open network graph
          </Button>
        </div>
      }
    </Panel>);

}