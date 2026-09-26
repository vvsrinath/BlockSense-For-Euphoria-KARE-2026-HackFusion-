import { api } from './api';
import { detectInput } from '@blocksense/blockchain';
import { MOCK_DATA } from './mockData';
import { fakeAddress, fakeHash } from '@blocksense/shared';
import type { Asset, AssetTransfer, ChainFilter, ChainId, Transaction, TransactionAsset } from '@blocksense/shared';

const rand = () => Math.random();

const ALL_CHAINS: ChainId[] = ['ethereum', 'bnb', 'tron', 'solana', 'bitcoin'];

/**
 * The demo catalog is built once, and IDs are stable (`<chain>-<symbol>`) so
 * routing to an asset and looking it up again agree with each other.
 */
const MOCK_ASSETS: Asset[] = ALL_CHAINS.flatMap((chain) => MOCK_DATA.generateAssetsForChain(rand, chain));

export interface AssetQuery {
  type: Asset['type'];
  chain: ChainFilter;
  query: string;
}

export async function listAssets({ type, chain, query }: AssetQuery): Promise<Asset[]> {
  // Both filters come from the page's own controls, so they are applied here;
  // ignoring them made the segmented controls look broken.
  const trimmed = query.trim().toLowerCase();

  return MOCK_ASSETS.filter((asset) => {
    if (type && asset.type !== type) return false;
    if (chain !== 'all' && asset.chain !== chain) return false;
    if (trimmed && !asset.name.toLowerCase().includes(trimmed) && !asset.symbol.toLowerCase().includes(trimmed)) return false;
    return true;
  });
}

export async function getAsset(id: string): Promise<Asset | null> {
  const needle = id.trim().toLowerCase();
  const byId = MOCK_ASSETS.find((a) => a.id.toLowerCase() === needle);
  if (byId) return byId;

  // A bare symbol like `USDC` exists on several chains, so resolve it from the
  // catalog rather than guessing a chain the user never named.
  const bySymbol = MOCK_ASSETS.find((a) => a.symbol.toLowerCase() === needle);
  if (bySymbol) return bySymbol;

  const chain = detectInput(id).chains[0];
  if (!chain) return null;
  return api.asset(chain, id);
}

export function findAssetId(asset: TransactionAsset, chain: ChainId): string | undefined {
  if (asset.type === 'native') return `${chain}-${asset.symbol.toLowerCase()}`;
  return asset.contractAddress;
}

export async function getAssetTransfers(asset: Asset): Promise<{ recent: AssetTransfer[]; large: AssetTransfer[] }> {
  // Transfers have to look like they came from the asset's own chain; EVM-shaped
  // hex addresses on a Solana token page is exactly the kind of detail that
  // undermines a demo.
  const transfers: AssetTransfer[] = Array.from({ length: 12 }, (_, i) => ({
    hash: fakeHash(rand, asset.chain),
    from: fakeAddress(rand, asset.chain),
    to: fakeAddress(rand, asset.chain),
    amount: rand() * 1000,
    valueUsd: Math.round(rand() * 5000 * 100) / 100,
    timestamp: Date.now() - i * 2 * 24 * 60 * 60 * 1000 - Math.floor(rand() * 12 * 60 * 60 * 1000)
  }));

  return {
    recent: transfers,
    // "Large transfers" is a ranking, not a prefix of the recent list, so it is
    // sorted by value instead of sliced.
    large: [...transfers].sort((a, b) => b.valueUsd - a.valueUsd).slice(0, 3)
  };
}

export function toTransfer(tx: Transaction): AssetTransfer {
  return {
    hash: tx.hash, from: tx.from, to: tx.to,
    amount: Number(tx.asset.amount ?? 0),
    valueUsd: tx.asset.valueUsd ?? 0,
    timestamp: tx.timestamp
  };
}
