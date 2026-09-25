import { StarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useWatchlist } from '../../contexts/WatchlistContext';
import type { AnomalyLevel, ChainId } from '../../types/chain';
import type { WatchKind } from '../../types/watchlist';
import { cn } from '../../utils/cn';

interface WatchButtonProps {
  kind: WatchKind;
  value: string;
  chain: ChainId;
  status: AnomalyLevel;
  label?: string;
  assetId?: string;
}

export function WatchButton({ kind, value, chain, status, label, assetId }: WatchButtonProps) {
  const { find, toggle } = useWatchlist();
  const watched = Boolean(find(value));

  return (
    <button
      type="button"
      aria-pressed={watched}
      onClick={() => {
        const added = toggle({ kind, value, chain, status, label, assetId });
        toast.success(added ? 'Added to watchlist' : 'Removed from watchlist');
      }}
      className={cn(
        'inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-medium transition-[background-color,color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        watched ? 'border-primary/30 bg-primary/10 text-primary' : 'border-line bg-surface text-ink hover:bg-subtle'
      )}>
      
      <StarIcon className={cn('h-4 w-4', watched && 'fill-current')} aria-hidden="true" />
      {watched ? 'Watching' : 'Watch'}
    </button>);

}