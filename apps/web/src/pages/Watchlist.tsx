import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRightIcon, ArrowRightIcon, CoinsIcon, FileCode2Icon, PlusIcon, StarIcon, Trash2Icon, WalletIcon, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AddressDisplay, Button, ChainBadge, EmptyState, IconButton, LevelBadge, Panel, Segmented } from '@blocksense/ui';

import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { AddWatchlistModal } from "../components/watchlist/AddWatchlistModal";
import { useWatchlist } from '../stores/WatchlistContext';
import { formatDate } from '@blocksense/shared';
import type { WatchKind } from '@blocksense/shared';
import { watchItemPath } from '@blocksense/shared';
type Filter = WatchKind | 'all';
const filters: {
  value: Filter;
  label: string;
}[] = [{
  value: 'all',
  label: 'All'
}, {
  value: 'wallet',
  label: 'Wallets'
}, {
  value: 'transaction',
  label: 'Transactions'
}, {
  value: 'contract',
  label: 'Contracts'
}, {
  value: 'token',
  label: 'Tokens'
}];
const kindIcon: Record<WatchKind, LucideIcon> = {
  wallet: WalletIcon,
  transaction: ArrowLeftRightIcon,
  contract: FileCode2Icon,
  token: CoinsIcon
};
export function Watchlist() {
  const {
    items,
    remove
  } = useWatchlist();
  const [filter, setFilter] = useState<Filter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const visible = filter === 'all' ? items : items.filter((i) => i.kind === filter);
  return <PageContainer>
      <PageHeader title="Watchlist" description="Keep an eye on wallets, transactions, contracts and tokens." actions={<Button icon={PlusIcon} onClick={() => setModalOpen(true)}>
            Add to Watchlist
          </Button>} />

      {items.length === 0 ? <EmptyState icon={StarIcon} title="Your watchlist is empty" description="Save wallets and transactions to see their status at a glance." action={<Button icon={PlusIcon} onClick={() => setModalOpen(true)}>
              Add to Watchlist
            </Button>} /> : <Panel>
          <Segmented options={filters} value={filter} onChange={setFilter} label="Filter watchlist" size="md" />
          {visible.length === 0 ? <p className="py-10 text-center text-sm text-muted">Nothing in this category yet.</p> : <ul className="mt-4 divide-y divide-line">
              {visible.map((item) => {
          const Icon = kindIcon[item.kind];
          return <li key={item.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle">
                        <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.label ?? (item.kind === 'transaction' ? 'Transaction' : item.kind.charAt(0).toUpperCase() + item.kind.slice(1))}
                        </p>
                        <AddressDisplay value={item.value} chain={item.chain} type={item.kind === 'transaction' ? 'tx' : 'address'} showExplorer={!item.value.includes(':')} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:w-[420px] md:flex-nowrap md:justify-end">
                      <ChainBadge chain={item.chain} />
                      <span className="text-xs text-muted">Added {formatDate(item.addedAt)}</span>
                      <LevelBadge level={item.status} />
                      <div className="ml-auto flex items-center gap-1 md:ml-0">
                        <Link to={watchItemPath(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-primary hover:bg-primary/10" aria-label={`Open ${item.label ?? item.value}`}>
                          Open
                          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                        <IconButton icon={Trash2Icon} label="Remove from watchlist" size="sm" onClick={() => {
                  remove(item.id);
                  toast.success('Removed from watchlist');
                }} />
                      </div>
                    </div>
                  </li>;
        })}
            </ul>}
        </Panel>}

      <AddWatchlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </PageContainer>;
}