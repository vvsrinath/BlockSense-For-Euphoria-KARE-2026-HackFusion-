/**
 * Asset identity.
 *
 * The same token has different identifiers on different chains, and the same
 * contract address means different things on different chains. Asset ids are
 * therefore always namespaced by chain: `ethereum:0xabc…`.
 */

import type { Asset, ChainId } from '@blocksense/shared';

export function nativeAssetId(chain: ChainId): string {
  return `${chain}:native`;
}

export function tokenAssetId(chain: ChainId, contractAddress: string): string {
  return `${chain}:${contractAddress.toLowerCase()}`;
}

export function nftAssetId(chain: ChainId, contractAddress: string, tokenId: string): string {
  return `${chain}:${contractAddress.toLowerCase()}:${tokenId}`;
}

/** Split a namespaced asset id back into its parts. */
export function parseAssetId(
  id: string
): { chain: ChainId; contractAddress?: string; tokenId?: string } | null {
  const parts = id.split(':');
  const [chain, contractAddress, tokenId] = parts;
  if (!chain) return null;
  return {
    chain: chain as ChainId,
    ...(contractAddress && contractAddress !== 'native' ? { contractAddress } : {}),
    ...(tokenId ? { tokenId } : {})
  };
}

/** The token standard implied by a contract address shape, where detectable. */
export function inferStandard(contractAddress: string): string {
  const v = contractAddress.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return 'ERC-20';
  if (/^(SP|SN|TK)[1-9A-HJ-NP-Za-km-z]{32,50}$/.test(v)) return 'SPL';
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(v)) return 'TRC-20';
  return 'unknown';
}

/** Build the shared `Asset` record for a native coin. */
export function nativeAsset(chain: ChainId, name: string, symbol: string, decimals: number): Asset {
  return {
    id: nativeAssetId(chain),
    name,
    symbol,
    chain,
    type: 'native',
    standard: 'native',
    decimals,
    description: `The native asset of ${name}.`
  };
}

/** True when the id refers to a chain's native coin rather than a token. */
export function isNativeAssetId(id: string): boolean {
  return id.endsWith(':native');
}
