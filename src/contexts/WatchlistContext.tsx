import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mockWatchlist } from '../data/mockWatchlist';
import type { WatchItem } from '../types/watchlist';

const STORAGE_KEY = 'blocksense.watchlist';

interface WatchlistContextValue {
  items: WatchItem[];
  add: (item: Omit<WatchItem, 'id' | 'addedAt'>) => void;
  remove: (id: string) => void;
  find: (value: string) => WatchItem | undefined;
  toggle: (item: Omit<WatchItem, 'id' | 'addedAt'>) => boolean;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function readItems(): WatchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as WatchItem[] : mockWatchlist;
  } catch {
    return mockWatchlist;
  }
}

export function WatchlistProvider({ children }: {children: React.ReactNode;}) {
  const [items, setItems] = useState<WatchItem[]>(readItems);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const find = useCallback((value: string) => items.find((i) => i.value.toLowerCase() === value.toLowerCase()), [items]);

  const add = useCallback((item: Omit<WatchItem, 'id' | 'addedAt'>) => {
    setItems((prev) =>
    prev.some((p) => p.value.toLowerCase() === item.value.toLowerCase()) ?
    prev :
    [{ ...item, id: `w-${Date.now().toString(36)}`, addedAt: Date.now() }, ...prev]
    );
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), []);

  const toggle = useCallback(
    (item: Omit<WatchItem, 'id' | 'addedAt'>) => {
      const existing = find(item.value);
      if (existing) {
        remove(existing.id);
        return false;
      }
      add(item);
      return true;
    },
    [add, find, remove]
  );

  const value = useMemo(() => ({ items, add, remove, find, toggle }), [items, add, remove, find, toggle]);
  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}