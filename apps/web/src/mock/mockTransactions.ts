import type { Transaction } from '@blocksense/shared';
import {
  BNB_TX_HASH,
  BNB_WALLET,
  BTC_EXCHANGE,
  BTC_RECEIVER,
  BTC_TX_HASH,
  BTC_WALLET,
  CAKE_CONTRACT,
  COINBASE_WALLET,
  DEMO_RECEIVER,
  DEMO_TX_HASH,
  DEMO_WALLET,
  HIGH_ANOMALY_WALLET,
  LUMEN_KEYS_CONTRACT,
  NFT_SENDER,
  NFT_TX_HASH,
  PANCAKE_ROUTER,
  SEAPORT,
  TRON_EXCHANGE,
  TRON_RECEIVER,
  TRON_TX_HASH,
  TRON_WALLET,
  UNISWAP_ROUTER,
  USDC_CONTRACT,
  USDT_TRON_CONTRACT } from
'./mockAddresses';

export const mockTransactions: Transaction[] = [
{
  hash: DEMO_TX_HASH,
  chain: 'ethereum',
  from: DEMO_WALLET,
  to: DEMO_RECEIVER,
  timestamp: Date.UTC(2025, 2, 20, 3, 47, 12),
  status: 'confirmed',
  block: 19283411,
  confirmations: 1842,
  isDemo: true,
  asset: {
    type: 'token',
    name: 'USD Coin',
    symbol: 'USDC',
    amount: '500',
    contractAddress: USDC_CONTRACT,
    standard: 'ERC-20',
    decimals: 6,
    valueUsd: 500
  },
  fee: { amount: '0.0021', symbol: 'ETH', valueUsd: 7.42 },
  anomaly: {
    score: 87,
    level: 'high',
    signals: [
    'Amount 12.5× higher than normal',
    'First interaction with receiver',
    'Frequency 8× higher than usual',
    'Unusual activity period'],

    details: [
    { id: 'amount', kind: 'amount', label: 'Amount change', value: '12.5× higher', detail: 'This wallet usually sends around $40 per transfer.', level: 'high' },
    { id: 'frequency', kind: 'frequency', label: 'Frequency', value: '8× higher', detail: '23 transfers in the last 24 hours, compared with about 3 on a typical day.', level: 'high' },
    { id: 'relationship', kind: 'relationship', label: 'New relationship', value: 'First interaction', detail: 'The sender has never sent funds to this receiver before.', level: 'unusual' },
    { id: 'time', kind: 'time', label: 'Time pattern', value: 'Unusual', detail: 'Sent at 03:47 UTC. This wallet is usually active 14:00–18:00 UTC.', level: 'unusual' },
    { id: 'history', kind: 'history', label: 'Wallet history', value: 'Established', detail: 'The sender has more than two years of steady activity.', level: 'normal' },
    { id: 'asset', kind: 'asset', label: 'Asset pattern', value: 'Typical asset', detail: "USDC is this wallet's most frequently used asset.", level: 'normal' }]

  },
  summary: [
  '500 USDC moved from an established wallet to a wallet it has never paid before.',
  "The amount is 12.5× larger than the sender's usual transfer, and it happened outside its normal hours.",
  'The receiver is 6 days old and has an observed connection to one high-anomaly wallet.'],

  technical: [
  { label: 'Method', value: 'transfer(address, uint256)', hint: 'The contract function that was called.' },
  { label: 'Gas used', value: '46,109' },
  { label: 'Gas price', value: '45.6 Gwei' },
  { label: 'Nonce', value: '1,247', hint: 'How many transactions this sender had sent before.' },
  { label: 'Event logs', value: '1 · Transfer' },
  { label: 'Raw token amount', value: '500000000', hint: '500 × 10⁶, because USDC uses 6 decimals.' },
  { label: 'Internal transactions', value: '0' },
  { label: 'Input data', value: '0xa9059cbb00000000000000000000000072b4e1a9c3d5f7082b6e4c1a9d3f5e7b8c2a44cc' }],

  related: [
  { address: DEMO_RECEIVER, label: 'Receiver · New wallet', kind: 'new', relationship: 'First interaction · created 6 days ago', level: 'unusual' },
  { address: HIGH_ANOMALY_WALLET, label: 'High-anomaly wallet', kind: 'high', relationship: 'Sent 4 transfers to the receiver', level: 'high' },
  { address: COINBASE_WALLET, label: 'Coinbase', kind: 'exchange', relationship: 'Regular deposits · 212 transfers', level: 'normal' },
  { address: UNISWAP_ROUTER, label: 'Uniswap V3 Router', kind: 'defi', relationship: 'Frequent swaps · 96 interactions', level: 'normal' }]

},
{
  hash: BTC_TX_HASH,
  chain: 'bitcoin',
  from: BTC_WALLET,
  to: BTC_RECEIVER,
  timestamp: Date.UTC(2025, 2, 19, 16, 8, 40),
  status: 'confirmed',
  block: 892398,
  confirmations: 34,
  asset: { type: 'native', name: 'Bitcoin', symbol: 'BTC', amount: '0.4825', valueUsd: 31284 },
  fee: { amount: '0.0000405', symbol: 'BTC', valueUsd: 2.63 },
  anomaly: {
    score: 18,
    level: 'normal',
    signals: [],
    details: [
    { id: 'amount', kind: 'amount', label: 'Amount change', value: 'Within range', detail: "Close to this wallet's typical transfer size.", level: 'normal' },
    { id: 'frequency', kind: 'frequency', label: 'Frequency', value: 'As usual', detail: 'About 2 transactions per week, as usual.', level: 'normal' },
    { id: 'relationship', kind: 'relationship', label: 'Relationship', value: 'Known receiver', detail: '14 earlier transfers between these wallets.', level: 'normal' },
    { id: 'time', kind: 'time', label: 'Time pattern', value: 'Usual hours', detail: "Sent within the wallet's usual 15:00–19:00 UTC window.", level: 'normal' },
    { id: 'history', kind: 'history', label: 'Wallet history', value: 'Established', detail: 'Active since November 2019.', level: 'normal' },
    { id: 'asset', kind: 'asset', label: 'Asset pattern', value: 'Native asset', detail: 'Bitcoin is the only asset on this network.', level: 'info' }]

  },
  summary: [
  '0.4825 BTC moved between two wallets that have transacted 14 times before.',
  "Amount, timing and frequency all match the sender's history.",
  'No unusual network connections were observed.'],

  technical: [
  { label: 'Inputs', value: '2' },
  { label: 'Outputs', value: '2 (1 change output)', hint: 'Bitcoin returns unspent value to the sender as change.' },
  { label: 'Virtual size', value: '225 vB' },
  { label: 'Fee rate', value: '18 sat/vB' },
  { label: 'Raw amount', value: '48,250,000 sats' },
  { label: 'Locktime', value: '0' }],

  related: [
  { address: BTC_RECEIVER, label: 'Receiver', kind: 'wallet', relationship: 'Known counterparty · 14 transfers', level: 'normal' },
  { address: BTC_EXCHANGE, label: 'Exchange wallet', kind: 'exchange', relationship: 'Occasional deposits · 6 transfers', level: 'normal' }]

},
{
  hash: TRON_TX_HASH,
  chain: 'tron',
  from: TRON_WALLET,
  to: TRON_RECEIVER,
  timestamp: Date.UTC(2025, 2, 18, 22, 15, 3),
  status: 'confirmed',
  block: 62187204,
  confirmations: 2237,
  asset: {
    type: 'token',
    name: 'Tether USD',
    symbol: 'USDT',
    amount: '2400',
    contractAddress: USDT_TRON_CONTRACT,
    standard: 'TRC-20',
    decimals: 6,
    valueUsd: 2400
  },
  fee: { amount: '13.84', symbol: 'TRX', valueUsd: 3.21 },
  anomaly: {
    score: 58,
    level: 'unusual',
    signals: ['Amount 3.1× higher than normal', 'Rare counterparty'],
    details: [
    { id: 'amount', kind: 'amount', label: 'Amount change', value: '3.1× higher', detail: 'This wallet usually sends around $780 per transfer.', level: 'unusual' },
    { id: 'frequency', kind: 'frequency', label: 'Frequency', value: 'As usual', detail: 'About 11 transactions per week, in line with history.', level: 'normal' },
    { id: 'relationship', kind: 'relationship', label: 'Relationship', value: 'Rare counterparty', detail: 'Only one earlier transfer to this receiver, 9 months ago.', level: 'unusual' },
    { id: 'time', kind: 'time', label: 'Time pattern', value: 'Usual hours', detail: 'This wallet is usually active in the late evening (UTC).', level: 'normal' },
    { id: 'history', kind: 'history', label: 'Wallet history', value: 'Established', detail: 'Active since June 2023.', level: 'normal' },
    { id: 'asset', kind: 'asset', label: 'Asset pattern', value: 'Typical asset', detail: "USDT is this wallet's main asset.", level: 'normal' }]

  },
  summary: [
  '2,400 USDT moved on TRON to a wallet the sender rarely pays.',
  'The amount is about 3× the usual transfer; timing and frequency are normal.',
  'Worth a closer look, but most behavior matches history.'],

  technical: [
  { label: 'Contract call', value: 'transfer(address, uint256)' },
  { label: 'Energy used', value: '64,285', hint: 'TRON charges energy for smart contract execution.' },
  { label: 'Bandwidth used', value: '345' },
  { label: 'Raw token amount', value: '2400000000' }],

  related: [
  { address: TRON_RECEIVER, label: 'Receiver', kind: 'wallet', relationship: 'Rare counterparty · 2 transfers', level: 'unusual' },
  { address: TRON_EXCHANGE, label: 'Exchange wallet', kind: 'exchange', relationship: 'Regular deposits · 88 transfers', level: 'normal' }]

},
{
  hash: NFT_TX_HASH,
  chain: 'ethereum',
  from: NFT_SENDER,
  to: DEMO_WALLET,
  timestamp: Date.UTC(2025, 2, 12, 15, 32, 9),
  status: 'confirmed',
  block: 19230877,
  confirmations: 52376,
  asset: {
    type: 'nft',
    name: 'Lumen Keys #1842',
    symbol: 'LUMEN',
    collection: 'Lumen Keys',
    tokenId: '1842',
    contractAddress: LUMEN_KEYS_CONTRACT,
    standard: 'ERC-721',
    valueUsd: 1450
  },
  fee: { amount: '0.0034', symbol: 'ETH', valueUsd: 12.01 },
  anomaly: {
    score: 29,
    level: 'normal',
    signals: [],
    details: [
    { id: 'amount', kind: 'amount', label: 'Amount change', value: 'Single NFT', detail: 'One collectible was transferred.', level: 'info' },
    { id: 'frequency', kind: 'frequency', label: 'Frequency', value: 'As usual', detail: 'The receiver trades NFTs every few weeks.', level: 'normal' },
    { id: 'relationship', kind: 'relationship', label: 'Relationship', value: 'Known sender', detail: '4 earlier interactions between these wallets.', level: 'normal' },
    { id: 'time', kind: 'time', label: 'Time pattern', value: 'Usual hours', detail: "Within the receiver's usual active window.", level: 'normal' },
    { id: 'history', kind: 'history', label: 'Wallet history', value: 'Established', detail: 'Both wallets have more than a year of history.', level: 'normal' },
    { id: 'asset', kind: 'asset', label: 'Asset pattern', value: 'Occasional asset', detail: 'NFTs are a small share of this activity.', level: 'info' }]

  },
  summary: [
  'One Lumen Keys NFT (#1842) moved to the demo wallet from a known counterparty.',
  'This matches earlier behavior between the two wallets.'],

  technical: [
  { label: 'Method', value: 'safeTransferFrom(address, address, uint256)' },
  { label: 'Gas used', value: '58,412' },
  { label: 'Gas price', value: '58.2 Gwei' },
  { label: 'Event logs', value: '2 · Approval, Transfer' },
  { label: 'Marketplace', value: 'OpenSea Seaport' }],

  related: [
  { address: NFT_SENDER, label: 'Sender', kind: 'wallet', relationship: 'Known counterparty · 4 transfers', level: 'normal' },
  { address: SEAPORT, label: 'OpenSea Seaport', kind: 'contract', relationship: 'Marketplace contract', level: 'normal' }]

},
{
  hash: BNB_TX_HASH,
  chain: 'bnb',
  from: BNB_WALLET,
  to: PANCAKE_ROUTER,
  timestamp: Date.UTC(2025, 2, 20, 9, 12, 55),
  status: 'confirmed',
  block: 36481980,
  confirmations: 132,
  asset: {
    type: 'token',
    name: 'PancakeSwap Token',
    symbol: 'CAKE',
    amount: '142.5',
    contractAddress: CAKE_CONTRACT,
    standard: 'BEP-20',
    decimals: 18,
    valueUsd: 356.25
  },
  assets: [
  { type: 'native', name: 'BNB', symbol: 'BNB', amount: '0.62', valueUsd: 368.9, direction: 'sent' },
  { type: 'token', name: 'PancakeSwap Token', symbol: 'CAKE', amount: '142.5', contractAddress: CAKE_CONTRACT, standard: 'BEP-20', decimals: 18, valueUsd: 356.25, direction: 'received' }],

  fee: { amount: '0.00021', symbol: 'BNB', valueUsd: 0.12 },
  anomaly: {
    score: 44,
    level: 'unusual',
    signals: ['First time holding CAKE'],
    details: [
    { id: 'amount', kind: 'amount', label: 'Amount change', value: 'Within range', detail: 'Similar size to earlier swaps.', level: 'normal' },
    { id: 'frequency', kind: 'frequency', label: 'Frequency', value: 'As usual', detail: 'About 5 transactions per week.', level: 'normal' },
    { id: 'relationship', kind: 'relationship', label: 'Relationship', value: 'Known protocol', detail: 'PancakeSwap has been used 41 times before.', level: 'normal' },
    { id: 'time', kind: 'time', label: 'Time pattern', value: 'Usual hours', detail: 'Within the usual 08:00–12:00 UTC window.', level: 'normal' },
    { id: 'history', kind: 'history', label: 'Wallet history', value: 'Established', detail: 'Active since May 2022.', level: 'normal' },
    { id: 'asset', kind: 'asset', label: 'Asset pattern', value: 'New asset', detail: 'First time this wallet has received CAKE.', level: 'unusual' }]

  },
  summary: [
  'The wallet swapped 0.62 BNB for 142.5 CAKE on PancakeSwap.',
  'It is the first time this wallet has held CAKE; everything else matches history.'],

  technical: [
  { label: 'Method', value: 'exactInputSingle(params)' },
  { label: 'Gas used', value: '142,806' },
  { label: 'Gas price', value: '1.5 Gwei' },
  { label: 'Event logs', value: '5 · Swap, Transfer ×2, Deposit, Withdrawal' },
  { label: 'Internal transactions', value: '1' }],

  related: [
  { address: PANCAKE_ROUTER, label: 'PancakeSwap Router', kind: 'defi', relationship: 'Frequent swaps · 41 interactions', level: 'normal' },
  { address: CAKE_CONTRACT, label: 'CAKE token contract', kind: 'contract', relationship: 'First interaction', level: 'unusual' }]

}];