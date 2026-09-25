import type { WatchItem } from '../types/watchlist';

export function watchItemPath(item: WatchItem): string {
  switch (item.kind) {
    case 'transaction':
      return `/analyze/tx/${item.value}`;
    case 'token':
      return item.assetId ? `/assets/${item.assetId}` : '/assets';
    default:
      return `/wallet/${item.value}`;
  }
}