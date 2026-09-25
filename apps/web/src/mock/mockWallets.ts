import type { Wallet } from '@blocksense/shared';
import {
  BNB_TX_HASH,
  BNB_WALLET,
  BTC_RECEIVER,
  BTC_TX_HASH,
  BTC_WALLET,
  DEMO_RECEIVER,
  DEMO_TX_HASH,
  DEMO_WALLET,
  HIGH_ANOMALY_WALLET,
  NFT_SENDER,
  NFT_TX_HASH,
  PANCAKE_ROUTER,
  PEER_WALLET_1,
  SOLANA_WALLET,
  TRON_RECEIVER,
  TRON_TX_HASH,
  TRON_WALLET } from
'./mockAddresses';

export const mockWallets: Wallet[] = [
{
  address: DEMO_WALLET,
  chain: 'ethereum',
  tags: ['Established', 'DeFi user', 'Stablecoin focused'],
  firstSeen: Date.UTC(2023, 0, 12),
  lastActive: Date.UTC(2025, 2, 20, 3, 47),
  txCount: 1248,
  totalInUsd: 58420,
  totalOutUsd: 57960,
  status: 'normal',
  statusNote: 'Long-term behavior is stable. The latest transfer differs from its history.',
  spike: true,
  dna: {
    typicalAmount: '$20 – $60',
    typicalFrequency: '8 transactions / week',
    mostActive: '14:00 – 18:00 UTC',
    commonAsset: 'USDC',
    counterparties: 12,
    medianUsd: 40,
    txPerWeek: 8,
    traits: [
    { label: 'Amount pattern', value: 80, descriptor: 'Consistent', description: 'Most transfers fall within a narrow range.' },
    { label: 'Frequency', value: 60, descriptor: 'Regular', description: 'Activity is spread evenly across the week.' },
    { label: 'Time pattern', value: 70, descriptor: 'Predictable', description: 'Usually active in the afternoon (UTC).' },
    { label: 'Asset diversity', value: 40, descriptor: 'Focused', description: 'Mostly stablecoins, occasional ETH and NFTs.' },
    { label: 'Relationship stability', value: 80, descriptor: 'Stable', description: 'Interacts with the same small group of wallets.' }]

  },
  activity: [
  { hash: DEMO_TX_HASH, direction: 'out', counterparty: DEMO_RECEIVER, symbol: 'USDC', amount: '500', valueUsd: 500, timestamp: Date.UTC(2025, 2, 20, 3, 47), level: 'high' },
  { hash: NFT_TX_HASH, direction: 'in', counterparty: NFT_SENDER, symbol: 'LUMEN', amount: '1', valueUsd: 1450, timestamp: Date.UTC(2025, 2, 12, 15, 32), level: 'normal' },
  { hash: '0x6c1e3a5b7d9f0e2c4a6b8d0f1e3c5a7b9d1f3e5c7a9b0d2f4e6a8c0b1d3f5e7a', direction: 'out', counterparty: PEER_WALLET_1, symbol: 'USDC', amount: '42', valueUsd: 42, timestamp: Date.UTC(2025, 2, 11, 16, 5), level: 'normal' }]

},
{
  address: DEMO_RECEIVER,
  chain: 'ethereum',
  label: 'New wallet',
  tags: ['New wallet', 'Rapid inflows'],
  firstSeen: Date.UTC(2025, 2, 14),
  lastActive: Date.UTC(2025, 2, 20, 4, 2),
  txCount: 31,
  totalInUsd: 9820,
  totalOutUsd: 9310,
  status: 'unusual',
  statusNote: 'A 6-day-old wallet receiving from many first-time senders and forwarding quickly.',
  spike: true,
  dna: {
    typicalAmount: '$300 – $800',
    typicalFrequency: '29 transactions / week',
    mostActive: '01:00 – 05:00 UTC',
    commonAsset: 'USDC',
    counterparties: 9,
    medianUsd: 480,
    txPerWeek: 29,
    traits: [
    { label: 'Amount pattern', value: 40, descriptor: 'Variable', description: 'Transfer sizes change a lot from day to day.' },
    { label: 'Frequency', value: 90, descriptor: 'Very high', description: 'Many transfers in a short period.' },
    { label: 'Time pattern', value: 50, descriptor: 'Irregular', description: 'Mostly active overnight (UTC).' },
    { label: 'Asset diversity', value: 20, descriptor: 'Single asset', description: 'Only USDC observed so far.' },
    { label: 'Relationship stability', value: 20, descriptor: 'Unstable', description: 'Most counterparties are first-time contacts.' }]

  },
  activity: [
  { hash: '0x2d4f6a8c0e1b3d5f7a9c1e3b5d7f9a0c2e4b6d8f0a1c3e5b7d9f1a3c5e7b9d0f', direction: 'out', counterparty: HIGH_ANOMALY_WALLET, symbol: 'USDC', amount: '940', valueUsd: 940, timestamp: Date.UTC(2025, 2, 20, 4, 2), level: 'high' },
  { hash: DEMO_TX_HASH, direction: 'in', counterparty: DEMO_WALLET, symbol: 'USDC', amount: '500', valueUsd: 500, timestamp: Date.UTC(2025, 2, 20, 3, 47), level: 'unusual' }]

},
{
  address: SOLANA_WALLET,
  chain: 'solana',
  tags: ['Established', 'High activity', 'DeFi user'],
  firstSeen: Date.UTC(2021, 7, 3),
  lastActive: Date.UTC(2025, 2, 20, 17, 21),
  txCount: 5842,
  totalInUsd: 412380,
  totalOutUsd: 409150,
  status: 'normal',
  statusNote: 'Activity has been consistent for more than three years.',
  dna: {
    typicalAmount: '$50 – $250',
    typicalFrequency: '45 transactions / week',
    mostActive: '12:00 – 20:00 UTC',
    commonAsset: 'SOL',
    counterparties: 38,
    medianUsd: 140,
    txPerWeek: 45,
    traits: [
    { label: 'Amount pattern', value: 70, descriptor: 'Consistent', description: 'Most transfers fall within a steady range.' },
    { label: 'Frequency', value: 90, descriptor: 'Very high', description: 'Several transactions most days.' },
    { label: 'Time pattern', value: 60, descriptor: 'Regular', description: 'Mostly active during the day (UTC).' },
    { label: 'Asset diversity', value: 80, descriptor: 'Diverse', description: 'SOL, USDC, JUP and several other tokens.' },
    { label: 'Relationship stability', value: 70, descriptor: 'Stable', description: 'A core group of protocols and wallets.' }]

  },
  activity: [
  { hash: '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW', direction: 'out', counterparty: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', symbol: 'SOL', amount: '1.2', valueUsd: 168, timestamp: Date.UTC(2025, 2, 20, 17, 21), level: 'normal' }]

},
{
  address: BNB_WALLET,
  chain: 'bnb',
  tags: ['Established', 'DEX trader'],
  firstSeen: Date.UTC(2022, 4, 17),
  lastActive: Date.UTC(2025, 2, 20, 9, 12),
  txCount: 732,
  totalInUsd: 96210,
  totalOutUsd: 94880,
  status: 'normal',
  statusNote: 'Stable swapping behavior. Latest swap introduced a new asset.',
  dna: {
    typicalAmount: '$150 – $600',
    typicalFrequency: '5 transactions / week',
    mostActive: '08:00 – 12:00 UTC',
    commonAsset: 'BNB',
    counterparties: 7,
    medianUsd: 340,
    txPerWeek: 5,
    traits: [
    { label: 'Amount pattern', value: 70, descriptor: 'Consistent', description: 'Swaps are usually similar in size.' },
    { label: 'Frequency', value: 50, descriptor: 'Moderate', description: 'A few trades each week.' },
    { label: 'Time pattern', value: 80, descriptor: 'Predictable', description: 'Almost always active in the morning (UTC).' },
    { label: 'Asset diversity', value: 50, descriptor: 'Moderate', description: 'BNB and a handful of tokens.' },
    { label: 'Relationship stability', value: 90, descriptor: 'Very stable', description: 'Mostly uses the same DEX.' }]

  },
  activity: [
  { hash: BNB_TX_HASH, direction: 'out', counterparty: PANCAKE_ROUTER, symbol: 'BNB', amount: '0.62', valueUsd: 368.9, timestamp: Date.UTC(2025, 2, 20, 9, 12), level: 'unusual' }]

},
{
  address: BTC_WALLET,
  chain: 'bitcoin',
  tags: ['Established', 'Long-term holder'],
  firstSeen: Date.UTC(2019, 10, 2),
  lastActive: Date.UTC(2025, 2, 19, 16, 8),
  txCount: 214,
  totalInUsd: 1842300,
  totalOutUsd: 1790120,
  status: 'normal',
  statusNote: 'Infrequent, large transfers consistent with long-term holding.',
  dna: {
    typicalAmount: '$8k – $40k',
    typicalFrequency: '2 transactions / week',
    mostActive: '15:00 – 19:00 UTC',
    commonAsset: 'BTC',
    counterparties: 5,
    medianUsd: 22000,
    txPerWeek: 2,
    traits: [
    { label: 'Amount pattern', value: 60, descriptor: 'Steady', description: 'Large but consistent transfer sizes.' },
    { label: 'Frequency', value: 30, descriptor: 'Low', description: 'A couple of transactions each week.' },
    { label: 'Time pattern', value: 80, descriptor: 'Predictable', description: 'Usually active in the late afternoon (UTC).' },
    { label: 'Asset diversity', value: 10, descriptor: 'Single asset', description: 'Only BTC.' },
    { label: 'Relationship stability', value: 90, descriptor: 'Very stable', description: 'Five long-standing counterparties.' }]

  },
  activity: [
  { hash: BTC_TX_HASH, direction: 'out', counterparty: BTC_RECEIVER, symbol: 'BTC', amount: '0.4825', valueUsd: 31284, timestamp: Date.UTC(2025, 2, 19, 16, 8), level: 'normal' }]

},
{
  address: TRON_WALLET,
  chain: 'tron',
  tags: ['Established', 'Stablecoin focused'],
  firstSeen: Date.UTC(2023, 5, 21),
  lastActive: Date.UTC(2025, 2, 18, 22, 15),
  txCount: 486,
  totalInUsd: 318400,
  totalOutUsd: 316950,
  status: 'normal',
  statusNote: 'Regular USDT activity. The latest transfer was larger than usual.',
  dna: {
    typicalAmount: '$300 – $900',
    typicalFrequency: '11 transactions / week',
    mostActive: '20:00 – 01:00 UTC',
    commonAsset: 'USDT',
    counterparties: 15,
    medianUsd: 780,
    txPerWeek: 11,
    traits: [
    { label: 'Amount pattern', value: 60, descriptor: 'Mostly consistent', description: 'Occasional larger transfers.' },
    { label: 'Frequency', value: 70, descriptor: 'Regular', description: 'Activity most days of the week.' },
    { label: 'Time pattern', value: 70, descriptor: 'Predictable', description: 'Usually active late evening (UTC).' },
    { label: 'Asset diversity', value: 20, descriptor: 'Focused', description: 'Almost exclusively USDT.' },
    { label: 'Relationship stability', value: 60, descriptor: 'Moderate', description: 'A mix of regular and new counterparties.' }]

  },
  activity: [
  { hash: TRON_TX_HASH, direction: 'out', counterparty: TRON_RECEIVER, symbol: 'USDT', amount: '2400', valueUsd: 2400, timestamp: Date.UTC(2025, 2, 18, 22, 15), level: 'unusual' }]

}];