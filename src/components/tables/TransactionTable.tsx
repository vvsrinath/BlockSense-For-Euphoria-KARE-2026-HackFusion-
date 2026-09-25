import { Link } from 'react-router-dom';
import { ArrowDownLeftIcon, ArrowLeftRightIcon, ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { ChainBadge } from '../common/ChainBadge';
import { LevelBadge } from '../common/LevelBadge';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../utils/cn';
import { formatDateTime, formatMoney } from '../../utils/format';
import type { TransactionRow } from '../../utils/rows';

interface TransactionTableProps {
  rows: TransactionRow[];
  caption: string;
  showChain?: boolean;
  pagination?: {page: number;pageCount: number;onChange: (page: number) => void;};
  emptyText?: string;
}

const gridCols = 'md:grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_150px] md:items-center md:gap-4';

export function TransactionTable({ rows, caption, showChain = true, pagination, emptyText = 'No transactions yet.' }: TransactionTableProps) {
  const { settings } = useSettings();

  if (!rows.length) return <p className="py-8 text-center text-sm text-muted">{emptyText}</p>;

  return (
    <div>
      <div role="table" aria-label={caption}>
        <div role="row" className={cn('hidden border-b border-line pb-2 text-xs font-medium text-muted', gridCols)}>
          <span role="columnheader">Transaction</span>
          <span role="columnheader">{showChain ? 'Network' : 'Value'}</span>
          <span role="columnheader">Time</span>
          <span role="columnheader" className="text-right">
            Status
          </span>
        </div>
        <div role="rowgroup">
          {rows.map((row) => {
            const DirIcon = row.direction === 'in' ? ArrowDownLeftIcon : row.direction === 'out' ? ArrowUpRightIcon : ArrowLeftRightIcon;
            const content =
            <>
                <span role="cell" className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-subtle">
                    <DirIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{row.title}</span>
                    <span className="block truncate font-mono text-xs text-muted">{row.subtitle}</span>
                  </span>
                </span>
                <span role="cell" className="mt-2 flex items-center gap-2 text-sm text-muted md:mt-0">
                  {showChain ? <ChainBadge chain={row.chain} /> : row.valueUsd !== undefined ? <span className="tabular-nums text-ink">{formatMoney(row.valueUsd, settings.currency)}</span> : '—'}
                </span>
                <span role="cell" className="mt-1 block text-xs text-muted md:mt-0 md:text-sm">
                  {formatDateTime(row.timestamp, settings.timeFormat)}
                </span>
                <span role="cell" className="mt-2 flex items-center gap-2 md:mt-0 md:justify-end">
                  {row.score !== undefined && <span className="text-xs tabular-nums text-muted">{row.score}</span>}
                  <LevelBadge level={row.level} />
                </span>
              </>;

            return (
              <div role="row" key={row.id} className="border-b border-line last:border-b-0">
                {row.to ?
                <Link
                  to={row.to}
                  className={cn('-mx-2 block rounded-xl px-2 py-3 transition-colors duration-150 ease-out hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50', gridCols)}>
                  
                    {content}
                  </Link> :

                <div className={cn('py-3', gridCols)}>{content}</div>
                }
              </div>);

          })}
        </div>
      </div>
      {pagination && pagination.pageCount > 1 &&
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {pagination.page + 1} of {pagination.pageCount}
          </span>
          <div className="flex gap-1">
            <button
            type="button"
            onClick={() => pagination.onChange(pagination.page - 1)}
            disabled={pagination.page === 0}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-subtle disabled:opacity-40">
            
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
            type="button"
            onClick={() => pagination.onChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pageCount - 1}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-subtle disabled:opacity-40">
            
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      }
    </div>);

}