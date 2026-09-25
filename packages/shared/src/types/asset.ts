import type { ChainId } from './chain';

export type AssetType = 'token' | 'nft' | 'native';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  chain: ChainId;
  type: AssetType;
  standard: string;
  holders?: number;
  contract?: string;
  decimals?: number;
  totalSupply?: string;
  priceUsd?: number;
  description: string;
}

export interface AssetTransfer {
  hash: string;
  from: string;
  to: string;
  amount: number;
  valueUsd: number;
  timestamp: number;
}