import type { NetworkEntity } from '../types/network';
import {
  AAVE_POOL,
  BINANCE_WALLET,
  COINBASE_WALLET,
  CURVE_POOL,
  DEMO_RECEIVER,
  DEMO_WALLET,
  HIGH_ANOMALY_WALLET,
  KRAKEN_WALLET,
  NFT_SENDER,
  PEER_WALLET_1,
  PEER_WALLET_2,
  PEER_WALLET_3,
  SEAPORT,
  UNISWAP_ROUTER,
  USDC_CONTRACT } from
'./mockAddresses';

// The demo wallet's most important observed connections (14 nodes, kept small on purpose).
export const demoNetworkEntities: NetworkEntity[] = [
{ id: 'center', address: DEMO_WALLET, label: 'Selected wallet', kind: 'center', level: 'normal', firstSeen: Date.UTC(2023, 0, 12), txCount: 1248, totalUsd: 116380, relationship: 'Wallet under analysis' },
{ id: 'receiver', address: DEMO_RECEIVER, label: 'New wallet', kind: 'new', level: 'unusual', firstSeen: Date.UTC(2025, 2, 14), txCount: 31, totalUsd: 500, relationship: 'First interaction' },
{ id: 'high', address: HIGH_ANOMALY_WALLET, label: 'High-anomaly wallet', kind: 'high', level: 'high', firstSeen: Date.UTC(2025, 1, 27), txCount: 212, totalUsd: 48230, relationship: 'Connected through the receiver', parentId: 'receiver' },
{ id: 'coinbase', address: COINBASE_WALLET, label: 'Coinbase', kind: 'exchange', level: 'normal', firstSeen: Date.UTC(2023, 0, 12), txCount: 212, totalUsd: 24890, relationship: 'Regular deposits' },
{ id: 'binance', address: BINANCE_WALLET, label: 'Binance 14', kind: 'exchange', level: 'normal', firstSeen: Date.UTC(2023, 3, 2), txCount: 64, totalUsd: 9420, relationship: 'Occasional withdrawals' },
{ id: 'kraken', address: KRAKEN_WALLET, label: 'Kraken', kind: 'exchange', level: 'normal', firstSeen: Date.UTC(2024, 1, 8), txCount: 18, totalUsd: 3120, relationship: 'Rare deposits' },
{ id: 'uniswap', address: UNISWAP_ROUTER, label: 'Uniswap V3', kind: 'defi', level: 'normal', firstSeen: Date.UTC(2023, 1, 20), txCount: 96, totalUsd: 11240, relationship: 'Frequent swaps' },
{ id: 'aave', address: AAVE_POOL, label: 'Aave V3', kind: 'defi', level: 'normal', firstSeen: Date.UTC(2023, 8, 4), txCount: 22, totalUsd: 6400, relationship: 'Lending deposits' },
{ id: 'curve', address: CURVE_POOL, label: 'Curve 3pool', kind: 'defi', level: 'normal', firstSeen: Date.UTC(2024, 4, 11), txCount: 9, totalUsd: 2180, relationship: 'Occasional swaps' },
{ id: 'usdc', address: USDC_CONTRACT, label: 'USDC contract', kind: 'contract', level: 'normal', firstSeen: Date.UTC(2023, 0, 12), txCount: 640, totalUsd: 38120, relationship: 'Token transfers' },
{ id: 'seaport', address: SEAPORT, label: 'OpenSea Seaport', kind: 'contract', level: 'normal', firstSeen: Date.UTC(2024, 6, 19), txCount: 6, totalUsd: 4350, relationship: 'NFT trades' },
{ id: 'peer1', address: PEER_WALLET_1, label: 'Wallet', kind: 'wallet', level: 'normal', firstSeen: Date.UTC(2023, 2, 1), txCount: 148, totalUsd: 5210, relationship: 'Frequent peer' },
{ id: 'peer2', address: PEER_WALLET_2, label: 'Wallet', kind: 'wallet', level: 'normal', firstSeen: Date.UTC(2023, 9, 14), txCount: 57, totalUsd: 2140, relationship: 'Regular peer' },
{ id: 'peer3', address: PEER_WALLET_3, label: 'Wallet', kind: 'wallet', level: 'normal', firstSeen: Date.UTC(2024, 10, 30), txCount: 23, totalUsd: 880, relationship: 'Occasional peer' },
{ id: 'nft', address: NFT_SENDER, label: 'Wallet', kind: 'wallet', level: 'normal', firstSeen: Date.UTC(2024, 3, 9), txCount: 4, totalUsd: 1450, relationship: 'Sent an NFT' }];


export const exchangeNames = ['Binance', 'OKX', 'Kraken', 'Bybit', 'Coinbase'];

export const defiNamesByChain: Record<string, string[]> = {
  ethereum: ['Uniswap', 'Aave', 'Curve', 'Lido'],
  bnb: ['PancakeSwap', 'Venus', 'Alpaca'],
  solana: ['Jupiter', 'Raydium', 'Marinade'],
  tron: ['SunSwap', 'JustLend'],
  bitcoin: []
};