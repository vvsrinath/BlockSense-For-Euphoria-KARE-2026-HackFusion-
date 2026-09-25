import { api } from './api';
import { detectInput } from '@blocksense/blockchain';
import type { Asset, AssetTransfer, ChainId, Transaction, TransactionAsset } from '@blocksense/shared';

export interface AssetQuery {
  type: string;
  chain: string;
  query: string;
}

/**
 * List assets.
 *
 * The public endpoints BlockSense talks to do not offer a token index, so there
 * is nothing to list beyond the chain's own native asset. That is reported as
 * an empty list rather than filled with invented tokens.
 */
export async function listAssets({ chain, query }: AssetQuery): Promise<Asset[]> {
  void query;

  let chains: ChainId[] = ['ethereum', 'bnb', 'tron', 'solana', 'bitcoin'];
  if (chain !== 'all') {
    const detected = detectInput(chain === 'all' ? '' : chain);
    chains = detected.kind === 'unknown' ? [chain as ChainId] : detected.chains;
  }

  const native: Asset[] = chains.map((id) => {
    const symbol = NATIVE_SYMBOL[id] ?? id.toUpperCase();
    return {
      id: `${id}-${symbol.toLowerCase()}`,
      name: CHAIN_NAME[id] ?? id,
      symbol,
      chain: id,
      type: 'native',
      standard: 'native',
      description: `The native asset of ${CHAIN_NAME[id] ?? id}.`
    };
  });

  return native;
}

const NATIVE_SYMBOL: Record<string, string> = {
  ethereum: 'ETH',
  bnb: 'BNB',
  tron: 'TRX',
  solana: 'SOL',
  bitcoin: 'BTC'
};

const CHAIN_NAME: Record<string, string> = {
  ethereum: 'Ethereum',
  bnb: 'BNB Chain',
  tron: 'TRON',
  solana: 'Solana',
  bitcoin: 'Bitcoin'
};

/** Fetch asset metadata by its identifier, which carries the chain. */
export async function getAsset(id: string): Promise<Asset | null> {
  // A native asset id is generated locally, so it is answered locally. Anything
  // else needs the API, which will report NOT_IMPLEMENTED for chains whose
  // metadata requires an explorer.
  if (id.includes('-') && NATIVE_SYMBOL[id.split('-')[0]]) {
    const chain = id.split('-')[0];
    return {
      id,
      name: CHAIN_NAME[chain],
      symbol: NATIVE_SYMBOL[chain],
      chain: chain as ChainId,
      type: 'native',
      standard: 'native',
      description: `The native asset of ${CHAIN_NAME[chain]}.`
    };
  }

  const chain = detectInput(id).chains[0];
  if (!chain) return null;
  return api.asset(chain, id);
}

/**
 * The asset id for a transaction asset, so the UI can link to a detail page.
 *
 * Native assets map to the locally generated id; a token maps to its contract
 * address, which the API can resolve once an explorer is configured.
 */
export function findAssetId(asset: TransactionAsset, chain: ChainId): string | undefined {
  if (asset.type === 'native') return `${chain}-${asset.symbol.toLowerCase()}`;
  return asset.contractAddress;
}

/**
 * Transfers of an asset.
 *
 * Public node endpoints cannot enumerate "every transfer of this token", so the
 * recent and large lists come from the addresses already known for the asset.
 * Without a holder set this returns empty rather than fabricating a feed.
 */
export async function getAssetTransfers(asset: Asset): Promise<{ recent: AssetTransfer[]; large: AssetTransfer[] }> {
  void asset;
  return { recent: [], large: [] };
}

/** Map a transaction into the transfer shape, for callers that already hold one. */
export function toTransfer(tx: Transaction): AssetTransfer {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    amount: Number(tx.asset.amount ?? 0),
    valueUsd: tx.asset.valueUsd ?? 0,
    timestamp: tx.timestamp
  };
}
