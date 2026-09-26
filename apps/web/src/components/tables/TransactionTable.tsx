import { Link } from 'react-router-dom';
import { ArrowDownLeftIcon, ArrowUpRightIcon, ArrowLeftRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { ChainBadge, LevelBadge } from '@blocksense/ui';
import { useSettings } from '../../stores/SettingsContext';
import { cn, formatDateTime, formatMoney } from '@blocksense/shared';
import type { TransactionRow } from '../../utils/rows';

interface TransactionTableProps {
  rows: TransactionRow[];
  caption: string;
  showChain?: boolean;
  pagination?: { page: number; pageCount: number; onChange: (page: number) => void };
  emptyText?: string;
}

export function TransactionTable({ rows, caption, showChain = true, pagination, emptyText = 'No transactions yet.' }: TransactionTableProps) {
  const { settings } = useSettings();

  if (!rows.length) return <p className="py-8 text-center text-sm text-muted">{emptyText}</p>;

  return (
    <div className="responsive-table-container">
      <div role="table" aria-label={caption}>
        <div role="row" className={cn('hidden border-b border-line pb-2 text-xs font-medium text-muted md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_150px] md:items-center md:gap-4')}>
          <span role="columnheader">Transaction</span>
          <span role="columnheader">{showChain ? 'Network' : 'Value'}</span>
          <span role="columnheader">Time</span>
          <span role="columnheader" className="text-right">Status</span>
        </div>
        <div role="rowgroup">
          {rows.map((row) => {
            const DirIcon = row.direction === 'in' ? ArrowDownLeftIcon : row.direction === 'out' ? ArrowUpRightIcon : ArrowLeftRightIcon;
            return (
              <div role="row" key={row.id} className="border-b border-line last:border-b-0">
                {row.to ? (
                  <Link
                    to={row.to}
                    className={cn('-mx-2 block rounded-xl px-3 py-3 transition-colors duration-150 ease-out hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:-mx-2 md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_150px] md:items-center md:gap-4')}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-subtle">
                        <DirIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{row.title}</span>
                        <span className="block truncate font-mono text-xs text-muted">{row.subtitle}</span>
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted md:mt-0 md:col-span-2">
                      {showChain ? <ChainBadge chain={row.chain} /> : row.valueUsd !== undefined ? <span className="tabular-nums text-ink">{formatMoney(row.valueUsd, settings.currency)}</span> : '—'}
                    </div>
                    <div className="mt-1 block text-xs text-muted md:mt-0 md:text-sm">{formatDateTime(row.timestamp, settings.timeFormat)}</div>
                    <div className="mt-2 flex items-center gap-2 md:mt-0 md:justify-end">
                      {row.score !== undefined && <span className="text-xs tabular-nums text-muted">{row.score}</span>}
                      <LevelBadge level={row.level} />
                    </div>
                  </Link>
                ) : (
                  <div className="py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-subtle">
                        <DirIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{row.title}</span>
                        <span className="block truncate font-mono text-xs text-muted">{row.subtitle}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {pagination && pagination.pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Page {pagination.page + 1} of {pagination.pageCount}</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => pagination.onChange(pagination.page - 1)} disabled={pagination.page === 0} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-subtle disabled:opacity-40 touch-target">
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => pagination.onChange(pagination.page + 1)} disabled={pagination.page >= pagination.pageCount - 1} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-subtle disabled:opacity-40 touch-target">
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}