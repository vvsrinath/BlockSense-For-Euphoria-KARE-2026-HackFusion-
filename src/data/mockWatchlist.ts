import type { AppNotification, WatchItem } from '../types/watchlist';
import { DEMO_RECEIVER, DEMO_TX_HASH, DEMO_WALLET, TRON_WALLET, UNISWAP_ROUTER, USDC_CONTRACT } from './mockAddresses';
import { DEMO_REPORT_ID } from './mockReports';

const HOUR = 3600000;

export const mockWatchlist: WatchItem[] = [
{ id: 'w-1', kind: 'wallet', value: DEMO_WALLET, chain: 'ethereum', label: 'Demo sender', status: 'normal', addedAt: Date.now() - 50 * HOUR },
{ id: 'w-2', kind: 'wallet', value: DEMO_RECEIVER, chain: 'ethereum', label: 'New receiver', status: 'unusual', addedAt: Date.now() - 20 * HOUR },
{ id: 'w-3', kind: 'transaction', value: DEMO_TX_HASH, chain: 'ethereum', label: '500 USDC transfer', status: 'high', addedAt: Date.now() - 19 * HOUR },
{ id: 'w-4', kind: 'token', value: USDC_CONTRACT, chain: 'ethereum', label: 'USD Coin', status: 'normal', addedAt: Date.now() - 120 * HOUR, assetId: 'usdc-ethereum' },
{ id: 'w-5', kind: 'contract', value: UNISWAP_ROUTER, chain: 'ethereum', label: 'Uniswap V3 Router', status: 'normal', addedAt: Date.now() - 300 * HOUR },
{ id: 'w-6', kind: 'wallet', value: TRON_WALLET, chain: 'tron', label: 'TRON treasury', status: 'normal', addedAt: Date.now() - 400 * HOUR }];


export const mockNotifications: AppNotification[] = [
{ id: 'n-1', title: 'Watched wallet became unusual', body: '0x72B4…44Cc received 6 transfers from first-time senders.', to: `/wallet/${DEMO_RECEIVER}`, minutesAgo: 12, level: 'unusual' },
{ id: 'n-2', title: 'Report ready', body: 'Transaction Risk Report for 0xa83b…1f4c is ready to view.', to: `/reports/${DEMO_REPORT_ID}`, minutesAgo: 95, level: 'info' },
{ id: 'n-3', title: 'Demo mode', body: 'You are viewing sample data. Live data appears once the backend is connected.', to: '/settings', minutesAgo: 240, level: 'info' }];