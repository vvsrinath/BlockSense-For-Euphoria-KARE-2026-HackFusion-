import { mockAssets } from '../mock/mockAssets';
import { createRandom, fakeAddress, fakeHash, hashString } from '@blocksense/shared';
import type { Asset, AssetTransfer, AssetType, ChainFilter, ChainId, TransactionAsset } from '@blocksense/shared';
import { mockRequest, sameValue } from '@blocksense/blockchain';

export interface AssetQuery {
  type: AssetType;
  chain: ChainFilter;
  query: string;
}

export async function listAssets({ type, chain, query }: AssetQuery): Promise<Asset[]> {
  return mockRequest(() => {
    const q = query.trim().toLowerCase();
    return mockAssets.filter(
      (a) =>
      a.type === type && (
      chain === 'all' || a.chain === chain) && (
      !q || a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q) || (a.contract ?? '').toLowerCase().includes(q))
    );
  }, 70);
}

export async function getAsset(id: string): Promise<Asset | null> {
  return mockRequest(() => mockAssets.find((a) => a.id === id) ?? null, 120);
}

export function findAssetId(asset: TransactionAsset, chain: ChainId): string | undefined {
  const match = mockAssets.find((a) =>
  asset.contractAddress && a.contract ? sameValue(a.contract, asset.contractAddress) : a.type === 'native' && a.chain === chain && a.symbol === asset.symbol
  );
  return match?.id;
}

export async function getAssetTransfers(asset: Asset): Promise<{recent: AssetTransfer[];large: AssetTransfer[];}> {
  return mockRequest(() => {
    const rand = createRandom(hashString(`${asset.id}:transfers`));
    const price = asset.priceUsd ?? 1;
    const base = asset.type === 'nft' ? 1 : Math.max(1, 900 / price);
    let ts = Date.UTC(2025, 2, 20, 18, 0);
    const transfers: AssetTransfer[] = Array.from({ length: 14 }, () => {
      ts -= Math.round(rand() * 40 * 60000);
      const amount = asset.type === 'nft' ? 1 : Number((base * (0.1 + rand() * rand() * 60)).toFixed(asset.decimals && asset.decimals > 6 ? 4 : 2));
      return {
        hash: fakeHash(rand, asset.chain),
        from: fakeAddress(rand, asset.chain),
        to: fakeAddress(rand, asset.chain),
        amount,
        valueUsd: asset.type === 'nft' ? Math.round(price * (0.8 + rand() * 0.5)) : amount * price,
        timestamp: ts
      };
    });
    return {
      recent: transfers.slice(0, 6),
      large: [...transfers].sort((a, b) => b.valueUsd - a.valueUsd).slice(0, 4)
    };
  }, 110);
}