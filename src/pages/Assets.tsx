import { useState } from 'react';
import { CoinsIcon, SearchIcon } from 'lucide-react';
import { listAssets } from '../api/assets';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Panel } from '../components/common/Panel';
import { Segmented } from '../components/common/Segmented';
import { Skeleton } from '../components/common/Skeleton';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { AssetTable } from '../components/tables/AssetTable';
import { chains } from '../data/chains';
import { useAsync } from '../hooks/useAsync';
import type { AssetType } from '../types/asset';
import type { ChainFilter } from '../types/chain';
import { cn } from '../utils/cn';

const typeOptions: {value: AssetType;label: string;}[] = [
{ value: 'token', label: 'Tokens' },
{ value: 'nft', label: 'NFTs' },
{ value: 'native', label: 'Native assets' }];


const chainFilters: {id: ChainFilter;name: string;}[] = [{ id: 'all', name: 'All chains' }, ...chains.map((c) => ({ id: c.id, name: c.name }))];

export function Assets() {
  const [type, setType] = useState<AssetType>('token');
  const [chain, setChain] = useState<ChainFilter>('all');
  const [query, setQuery] = useState('');
  const { data, status, error, retry } = useAsync(() => listAssets({ type, chain, query }), `${type}:${chain}:${query}`);

  return (
    <PageContainer>
      <PageHeader title="Assets & Tokens" description="Look up tokens, NFTs and native assets across supported networks." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented options={typeOptions} value={type} onChange={setType} label="Asset type" size="md" />
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search assets</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search token, symbol or contract…"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted/80 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10" />
          
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by chain">
        {chainFilters.map((c) =>
        <button
          key={c.id}
          type="button"
          aria-pressed={chain === c.id}
          onClick={() => setChain(c.id)}
          className={cn(
            'whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out',
            chain === c.id ? 'border-primary/30 bg-primary/10 text-primary' : 'border-line bg-surface text-muted hover:text-ink'
          )}>
          
            {c.name}
          </button>
        )}
      </div>

      <Panel>
        {status === 'error' ?
        <ErrorState error={error} onRetry={retry} className="py-4" /> :
        !data ?
        <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) =>
          <Skeleton key={i} className="h-11" />
          )}
          </div> :
        data.length === 0 ?
        <EmptyState
          icon={CoinsIcon}
          title="No assets match"
          description="Try another search or chain filter."
          className="py-8"
          action={
          <Button
            variant="secondary"
            onClick={() => {
              setQuery('');
              setChain('all');
            }}>
            
                Clear filters
              </Button>
          } /> :


        <AssetTable assets={data} />
        }
      </Panel>
    </PageContainer>);

}