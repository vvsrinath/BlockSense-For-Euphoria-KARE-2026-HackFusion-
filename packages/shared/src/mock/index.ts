import type {
  ChainId,
  Transaction,
  TransactionAnomaly,
  TransactionAsset,
  Wallet,
  Asset,
  NetworkGraphData,
  NetworkEntity,
  NetworkLink,
  Report,
  ReportSection,
  AnomalyLevel,
  AnomalySignal,
  SignalKind,
  SignalLevel
} from '../types';
import { fakeHash, fakeAddress } from '../utils/seed';

/**
 * Deterministic-shape demo data.
 *
 * Chain labels live here rather than being imported from `@blocksense/blockchain`
 * because that package already depends on this one for its types, so reaching
 * back into it would close a cycle. This mirrors what `utils/seed.ts` already
 * does: the per-chain address and hash formats are duplicated deliberately so
 * the mock layer stays a leaf.
 */
const CHAIN_META: Record<ChainId, { name: string; symbol: string; block: [number, number] }> = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', block: [19_000_000, 21_000_000] },
  bnb: { name: 'BNB Chain', symbol: 'BNB', block: [36_000_000, 45_000_000] },
  tron: { name: 'TRON', symbol: 'TRX', block: [62_000_000, 78_000_000] },
  solana: { name: 'Solana', symbol: 'SOL', block: [280_000_000, 340_000_000] },
  bitcoin: { name: 'Bitcoin', symbol: 'BTC', block: [880_000, 910_000] }
};

const CHAINS = Object.keys(CHAIN_META) as ChainId[];

interface AssetDef {
  symbol: string;
  name: string;
  type: TransactionAsset['type'];
  standard: string;
  decimals: number;
  contract?: string;
}

/**
 * Assets are scoped per chain on purpose. A Solana transaction carrying a
 * USDC ERC-20 contract address is the kind of detail that makes a demo look
 * wrong to anyone who knows the chains, and mock data is meant to stand in for
 * the real thing.
 */
const ASSETS_BY_CHAIN: Record<ChainId, AssetDef[]> = {
  ethereum: [
    { symbol: 'ETH', name: 'Ether', type: 'native', standard: 'ERC-20', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', type: 'token', standard: 'ERC-20', decimals: 6, contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'USDT', name: 'Tether USD', type: 'token', standard: 'ERC-20', decimals: 6, contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'DAI', name: 'Dai Stablecoin', type: 'token', standard: 'ERC-20', decimals: 18, contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { symbol: 'BSENSE', name: 'BlockSense NFT', type: 'nft', standard: 'ERC-721', decimals: 0, contract: '0x1a92Df7380dC035D7c39F988A22cC8132274B45a' }
  ],
  bnb: [
    { symbol: 'BNB', name: 'BNB', type: 'native', standard: 'BEP-20', decimals: 18 },
    { symbol: 'USDT', name: 'Tether USD', type: 'token', standard: 'BEP-20', decimals: 18, contract: '0x55d398326f99059fF775485246999027B3197955' },
    { symbol: 'BUSD', name: 'Binance USD', type: 'token', standard: 'BEP-20', decimals: 18, contract: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' },
    { symbol: 'CAKE', name: 'PancakeSwap', type: 'token', standard: 'BEP-20', decimals: 18, contract: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' }
  ],
  tron: [
    { symbol: 'TRX', name: 'TRON', type: 'native', standard: 'TRC-20', decimals: 6 },
    { symbol: 'USDT', name: 'Tether USD', type: 'token', standard: 'TRC-20', decimals: 6, contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
    { symbol: 'USDC', name: 'USD Coin', type: 'token', standard: 'TRC-20', decimals: 6, contract: 'TRowCD4wJg9Mvb7v5PbukzRw2GVoHgsjtBfL3BWXA' }
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', type: 'native', standard: 'SPL', decimals: 9 },
    { symbol: 'USDC', name: 'USD Coin', type: 'token', standard: 'SPL', decimals: 6, contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { symbol: 'USDT', name: 'Tether USD', type: 'token', standard: 'SPL', decimals: 6, contract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' }
  ],
  bitcoin: [
    // Bitcoin has no token standard, so the native asset is the only thing
    // that can be transferred.
    { symbol: 'BTC', name: 'Bitcoin', type: 'native', standard: 'BTC', decimals: 8 }
  ]
};

const NAMES = ['Vitalik', 'Changpeng', 'Justin', 'Sam', 'Michael', 'Sarah', 'Alex', 'Wei', 'Phoenix', 'Nexus'];
const DESCRIPTIONS = ['early adopter', 'exchange hot wallet', 'DeFi whale', 'NFT collector', 'mining pool', 'bridge contract'];

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randomTimestamp(rand: () => number): number {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - Math.floor(rand() * thirtyDays);
}

/** Anomalies are weighted towards `normal` so a demo list is not all alarms. */
function randomLevel(rand: () => number): AnomalyLevel {
  const levels: AnomalyLevel[] = ['normal', 'normal', 'normal', 'normal', 'unusual', 'elevated', 'high'];
  return pick(levels, rand);
}

function scoreForLevel(rand: () => number, level: AnomalyLevel): number {
  switch (level) {
    case 'normal': return randomInt(rand, 5, 29);
    case 'unusual': return randomInt(rand, 30, 59);
    case 'elevated': return randomInt(rand, 60, 79);
    case 'high': return randomInt(rand, 80, 100);
  }
}

const SIGNAL_DETAILS: Record<SignalKind, string> = {
  amount: "Transaction amount is significantly above the wallet's observed historical range.",
  frequency: 'Transaction frequency increased significantly.',
  relationship: 'First observed interaction with this receiver.',
  time: "Transaction occurred outside the wallet's typical activity period.",
  history: 'Insufficient historical data for strong confidence.',
  asset: 'Unusual asset movement detected.'
};

const SIGNAL_LABELS: Record<SignalKind, string> = {
  amount: 'Amount outside observed range',
  frequency: 'Frequency spike',
  relationship: 'New counterparty',
  time: 'Off-hours activity',
  history: 'Limited history',
  asset: 'Unusual asset movement'
};

export function randomAnomaly(rand: () => number): TransactionAnomaly {
  const level = randomLevel(rand);
  const signalKinds: SignalKind[] = ['amount', 'frequency', 'relationship', 'time', 'history', 'asset'];
  const signalLevels: SignalLevel[] = ['info', 'normal', 'unusual', 'elevated', 'high'];
  const details: AnomalySignal[] = Array.from({ length: randomInt(rand, 1, 4) }, () => {
    const kind = pick(signalKinds, rand);
    return {
      id: `sig-${randomInt(rand, 1000, 9999)}`,
      kind,
      label: SIGNAL_LABELS[kind],
      value: `${randomInt(rand, 2, 15)}x above observed range`,
      detail: SIGNAL_DETAILS[kind],
      level: pick(signalLevels, rand)
    };
  });

  return {
    score: scoreForLevel(rand, level),
    level,
    confidence: pick(['low', 'medium', 'high'] as const, rand),
    // `signals` is the short human-readable list; `details` carries the evidence
    // the UI expands into. Both are populated from the same generated signals.
    signals: details.map((d) => d.detail),
    details
  };
}

/** A randomly chosen asset that actually exists on `chain`. */
function assetsFor(chain: ChainId, rand: () => number): AssetDef {
  return pick(ASSETS_BY_CHAIN[chain], rand);
}

export function generateTransaction(rand: () => number, hashOverride?: string, chainOverride?: ChainId): Transaction {
  const chain = chainOverride ?? pick(CHAINS, rand);
  const assetDef = assetsFor(chain, rand);
  const from = fakeAddress(rand, chain);
  const to = fakeAddress(rand, chain);
  const timestamp = randomTimestamp(rand);
  const block = randomInt(rand, ...CHAIN_META[chain].block);
  const amount = assetDef.type === 'nft' ? '1' : (rand() * 10000 + 1).toFixed(assetDef.decimals);
  const valueUsd = Math.round(rand() * 50000 * 100) / 100;
  const anomaly = randomAnomaly(rand);
  const hash = hashOverride ?? fakeHash(rand, chain);
  const feeAmount = (rand() * 0.1).toFixed(8);
  const feeSymbol = CHAIN_META[chain].symbol;

  const asset: TransactionAsset = {
    type: assetDef.type,
    name: assetDef.name,
    symbol: assetDef.symbol,
    amount,
    contractAddress: assetDef.contract,
    standard: assetDef.standard,
    decimals: assetDef.decimals,
    valueUsd
  };

  return {
    hash,
    chain,
    from,
    to,
    timestamp,
    status: pick(['confirmed', 'confirmed', 'confirmed', 'pending', 'failed'] as const, rand),
    block,
    confirmations: randomInt(rand, 12, 10000),
    isDemo: true,
    asset,
    // A single-asset transfer lists that asset once, using the same amount, so
    // the summary table and the detail card cannot disagree.
    assets: [asset],
    fee: { amount: feeAmount, symbol: feeSymbol, valueUsd: Math.round(rand() * 50 * 100) / 100 },
    anomaly,
    summary: [
      `Sent ${amount} ${assetDef.symbol} to ${to.slice(0, 6)}…${to.slice(-4)}`,
      `Fee of ${feeAmount} ${feeSymbol}`,
      `Anomaly score: ${anomaly.score}/100 (${anomaly.level})`
    ],
    technical: [
      { label: 'Transaction hash', value: hash },
      { label: 'Block', value: String(block) },
      { label: 'Confirmations', value: String(randomInt(rand, 12, 10000)) }
    ],
    related: Array.from({ length: randomInt(rand, 1, 3) }, () => ({
      address: fakeAddress(rand, chain),
      label: pick(NAMES, rand),
      kind: pick(['wallet', 'exchange', 'defi', 'contract'] as const, rand),
      relationship: pick(DESCRIPTIONS, rand),
      level: randomLevel(rand)
    }))
  };
}

export function generateWallet(rand: () => number, addressOverride?: string, chainOverride?: ChainId): Wallet {
  const chain = chainOverride ?? pick(CHAINS, rand);
  const address = addressOverride ?? fakeAddress(rand, chain);
  const anomaly = randomAnomaly(rand);

  return {
    address,
    chain,
    label: `${pick(NAMES, rand)} Wallet`,
    tags: [pick(DESCRIPTIONS, rand)],
    firstSeen: randomTimestamp(rand) - randomInt(rand, 30, 730) * 24 * 60 * 60 * 1000,
    lastActive: randomTimestamp(rand),
    txCount: randomInt(rand, 50, 5000),
    totalInUsd: Math.round(rand() * 5000000 * 100) / 100,
    totalOutUsd: Math.round(rand() * 5000000 * 100) / 100,
    // Status and its note come from one anomaly so the score shown in the note
    // always matches the level in the badge.
    status: anomaly.level,
    statusNote: `Observed behavior differs from historical activity. Score: ${anomaly.score}/100`,
    spike: rand() > 0.7,
    dna: {
      typicalAmount: `$${randomInt(rand, 10, 5000)} - $${randomInt(rand, 5000, 50000)}`,
      typicalFrequency: `${randomInt(rand, 1, 20)} transactions/week`,
      mostActive: `${randomInt(rand, 0, 23)}:00 - ${randomInt(rand, 0, 23)}:00 UTC`,
      commonAsset: assetsFor(chain, rand).symbol,
      counterparties: randomInt(rand, 5, 100),
      medianUsd: Math.round(rand() * 5000 * 100) / 100,
      txPerWeek: randomInt(rand, 1, 50),
      traits: Array.from({ length: randomInt(rand, 3, 6) }, () => {
        const descriptor = pick(['stable', 'volatile', 'periodic', 'consistent'], rand);
        const label = pick(['Typical Amount', 'Typical Frequency', 'Most Active Time', 'Common Asset'], rand);
        return { label, value: rand() * 100, descriptor, description: `${descriptor} behavior pattern` };
      })
    },
    activity: Array.from({ length: randomInt(rand, 10, 30) }, () => ({
      hash: fakeHash(rand, chain),
      direction: pick(['in', 'out'] as const, rand),
      counterparty: fakeAddress(rand, chain),
      symbol: assetsFor(chain, rand).symbol,
      amount: (rand() * 1000).toFixed(2),
      valueUsd: Math.round(rand() * 10000 * 100) / 100,
      timestamp: randomTimestamp(rand),
      level: randomLevel(rand)
    }))
  };
}

export function generateAsset(rand: () => number, identifier?: string, chainOverride?: ChainId): Asset {
  const chain = chainOverride ?? pick(CHAINS, rand);
  const assetDef = assetsFor(chain, rand);
  return {
    id: identifier ?? `${chain}-${assetDef.symbol}-${randomInt(rand, 1000, 9999)}`,
    name: assetDef.name,
    symbol: assetDef.symbol,
    chain,
    type: assetDef.type,
    standard: assetDef.standard,
    holders: randomInt(rand, 100, 5000000),
    contract: assetDef.contract,
    decimals: assetDef.decimals,
    totalSupply: assetDef.type === 'token' ? `${Math.floor(rand() * 1e9)}` : undefined,
    priceUsd: Math.round(rand() * 4000 * 100) / 100,
    description: `${assetDef.name} on ${CHAIN_META[chain].name}`
  };
}

/** Every asset that exists on `chain`, for chain-filtered asset views. */
export function generateAssetsForChain(rand: () => number, chain: ChainId): Asset[] {
  return ASSETS_BY_CHAIN[chain].map((def) => generateAsset(rand, `${chain}-${def.symbol}`, chain));
}

export function generateNetworkGraph(rand: () => number, address: string, chain: ChainId = 'ethereum', depth = 2): NetworkGraphData {
  // `depth` is the caller's requested breadth. Each hop adds a few more
  // counterparties, but it is bounded so a large depth cannot generate a graph
  // big enough to stall rendering.
  const entityCount = Math.min(48, randomInt(rand, 6, 14) * Math.max(1, depth));
  const kinds: NetworkEntity['kind'][] = ['wallet', 'exchange', 'defi', 'contract', 'new'];

  const entities: NetworkEntity[] = [{
    id: address,
    address,
    label: 'Selected wallet',
    kind: 'center',
    level: 'normal',
    firstSeen: randomTimestamp(rand),
    txCount: randomInt(rand, 50, 5000),
    totalUsd: Math.round(rand() * 1000000 * 100) / 100,
    relationship: 'focus'
  }];

  const links: NetworkLink[] = [];

  for (let i = 0; i < entityCount; i++) {
    const entityAddress = fakeAddress(rand, chain);
    const kind = pick(kinds, rand);
    const level = randomLevel(rand);
    entities.push({
      id: entityAddress,
      address: entityAddress,
      label: `${pick(NAMES, rand)} ${entityAddress.slice(0, 4)}…${entityAddress.slice(-4)}`,
      kind,
      level,
      firstSeen: randomTimestamp(rand),
      txCount: randomInt(rand, 1, 500),
      totalUsd: Math.round(rand() * 100000 * 100) / 100,
      relationship: 'counterparty',
      parentId: address
    });
    links.push({
      id: `${address}->${entityAddress}`,
      source: address,
      target: entityAddress,
      txCount: randomInt(rand, 1, 50),
      volumeUsd: Math.round(rand() * 10000 * 100) / 100,
      flagged: level === 'high'
    });
  }

  return { centerId: address, chain, entities, links };
}

export function generateReport(rand: () => number, hash: string, chain: ChainId = 'ethereum'): Report {
  const anomaly = randomAnomaly(rand);
  const levelLabel = anomaly.level === 'normal' ? 'Low risk' : anomaly.level === 'unusual' ? 'Unusual activity' : anomaly.level === 'elevated' ? 'Elevated risk' : 'High anomaly';
  const chainName = CHAIN_META[chain].name;
  const assetSymbol = assetsFor(chain, rand).symbol;

  const sections: ReportSection[] = [
    { id: 'summary', title: 'Transaction Summary', body: `Transaction ${hash.slice(0, 10)}… on ${chainName}. ${anomaly.score}/100 anomaly score (${levelLabel}).`, facts: [{ label: 'Chain', value: chainName }, { label: 'Anomaly Score', value: `${anomaly.score}/100` }] },
    { id: 'assets', title: 'Asset Movement', body: `Asset transfer detected: ${assetSymbol}.`, facts: [{ label: 'Type', value: 'token transfer' }] },
    { id: 'sender', title: 'Sender Behavior', body: `Sender wallet shows ${anomaly.level} behavioral patterns.`, facts: [{ label: 'Typical Amount', value: `$${randomInt(rand, 50, 5000)}` }] },
    { id: 'receiver', title: 'Receiver Behavior', body: 'Receiver wallet is a new interaction.', facts: [{ label: 'First Interaction', value: 'Yes' }] },
    { id: 'network', title: 'Network Analysis', body: `Network graph shows ${randomInt(rand, 3, 15)} connected entities.`, facts: [{ label: 'Connected Nodes', value: String(randomInt(rand, 3, 15)) }] },
    { id: 'anomaly', title: 'Anomaly Signals', body: anomaly.details.map((s) => s.detail).join(' '), facts: anomaly.details.map((s) => ({ label: s.label, value: s.detail })) },
    { id: 'limitations', title: 'Limitations', body: 'This analysis is based on observable on-chain data. It does not constitute a determination of fraud, illegality, or malicious intent.', facts: [{ label: 'Confidence', value: anomaly.confidence }] }
  ];

  return {
    id: `rep-${randomInt(rand, 10000, 99999)}`,
    title: `Investigation Report — ${hash.slice(0, 10)}…`,
    txHash: hash,
    subject: chain,
    chain,
    assetLabel: assetSymbol,
    score: anomaly.score,
    level: anomaly.level,
    createdAt: Date.now(),
    findings: anomaly.details.map((s) => s.detail),
    sections
  };
}

export function generateMultipleTransactions(count: number, chain?: ChainId): Transaction[] {
  const r = () => Math.random();
  return Array.from({ length: count }, () => generateTransaction(r, undefined, chain));
}

export function generateMultipleWallets(count: number, chain?: ChainId): Wallet[] {
  const r = () => Math.random();
  return Array.from({ length: count }, () => generateWallet(r, undefined, chain));
}

export const MOCK_DATA = {
  generateTransaction,
  generateWallet,
  generateAsset,
  generateAssetsForChain,
  generateNetworkGraph,
  generateReport,
  generateMultipleTransactions,
  generateMultipleWallets,
  randomAnomaly
};
