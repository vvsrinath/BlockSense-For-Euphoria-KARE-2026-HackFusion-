import { createContext, useContext } from 'react';
import type { WatchItem } from '@blocksense/shared';

/**
 * The watchlist context and its reader hook.
 *
 * Exports no components on purpose — the provider lives in `WatchlistProvider`
 * so React Fast Refresh keeps working and consumers can import the hook
 * without pulling in a component module.
 */
export interface WatchlistContextValue {
  items: WatchItem[];
  add: (item: Omit<WatchItem, 'id' | 'addedAt'>) => void;
  remove: (id: string) => void;
  find: (value: string) => WatchItem | undefined;
  toggle: (item: Omit<WatchItem, 'id' | 'addedAt'>) => boolean;
}

export const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}
