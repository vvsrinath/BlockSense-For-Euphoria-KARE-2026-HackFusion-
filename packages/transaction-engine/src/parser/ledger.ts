/**
 * Chain-native transaction parsing.
 *
 * Each chain reports a transaction in its own shape. The parser's job is to
 * flatten that into a single intermediate form the normaliser can consume,
 * so that downstream code never has to ask "is this UTXO or account-based?".
 */

import type { ChainId } from '@blocksense/shared';

/** Execution model, which determines how a transaction maps to parties. */
export type LedgerModel = 'utxo' | 'account';

/** How each chain records who sent and who received. */
export interface LedgerSemantics {
  chain: ChainId;
  model: LedgerModel;
  /** Unit of the chain's height. */
  heightUnit: 'block' | 'slot';
  /** Base units per whole coin. */
  nativeDecimals: number;
  /** A transaction can credit more than one recipient. */
  multipleOutputs: boolean;
  /** A transaction can debit more than one sender. */
  multipleInputs: boolean;
  /** Whether transfers are grouped into a single swap-style record. */
  groupsSwaps: boolean;
}

export const LEDGER_SEMANTICS: Record<ChainId, LedgerSemantics> = {
  bitcoin: {
    chain: 'bitcoin',
    model: 'utxo',
    heightUnit: 'block',
    nativeDecimals: 8,
    multipleInputs: true,
    multipleOutputs: true,
    groupsSwaps: false
  },
  ethereum: {
    chain: 'ethereum',
    model: 'account',
    heightUnit: 'block',
    nativeDecimals: 18,
    multipleInputs: false,
    multipleOutputs: false,
    groupsSwaps: false
  },
  bnb: {
    chain: 'bnb',
    model: 'account',
    heightUnit: 'block',
    nativeDecimals: 18,
    multipleInputs: false,
    multipleOutputs: false,
    groupsSwaps: false
  },
  tron: {
    chain: 'tron',
    model: 'account',
    heightUnit: 'block',
    nativeDecimals: 6,
    multipleInputs: false,
    multipleOutputs: false,
    groupsSwaps: false
  },
  solana: {
    chain: 'solana',
    model: 'account',
    heightUnit: 'slot',
    nativeDecimals: 9,
    multipleInputs: true,
    multipleOutputs: true,
    groupsSwaps: true
  }
};

export function semanticsFor(chain: ChainId): LedgerSemantics {
  return LEDGER_SEMANTICS[chain];
}

/** One movement of value, before normalisation. */
export interface RawTransfer {
  assetType: 'native' | 'token' | 'nft';
  assetId: string;
  symbol: string;
  name: string;
  /** Base units, as an integer string. */
  rawAmount: string;
  decimals: number;
  from: string;
  to: string;
  contractAddress?: string;
  tokenId?: string;
  standard?: string;
}

/** The chain-native transaction, reduced to what the engine needs. */
export interface RawTransaction {
  chain: ChainId;
  hash: string;
  height: number;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  fee: { rawAmount: string; symbol: string; decimals: number };
  transfers: RawTransfer[];
}

/** Did the transaction move value into `address`? */
export function isRecipient(tx: RawTransaction, address: string): boolean {
  return tx.transfers.some((t) => t.to.toLowerCase() === address.toLowerCase());
}

/** Did the transaction move value out of `address`? */
export function isSender(tx: RawTransaction, address: string): boolean {
  return tx.transfers.some((t) => t.from.toLowerCase() === address.toLowerCase());
}

/** Every distinct address the transaction touched. */
export function participants(tx: RawTransaction): string[] {
  const set = new Set<string>();
  tx.transfers.forEach((t) => {
    if (t.from) set.add(t.from);
    if (t.to) set.add(t.to);
  });
  return [...set];
}

/** True when the transaction swaps one asset for another rather than gifting it. */
export function looksLikeSwap(tx: RawTransaction): boolean {
  const semantics = semanticsFor(tx.chain);
  if (!semantics.groupsSwaps) return false;
  const sent = new Set(tx.transfers.filter((t) => isSender(tx, t.from)).map((t) => t.assetId));
  const received = new Set(tx.transfers.filter((t) => isRecipient(tx, t.to)).map((t) => t.assetId));
  let overlap = false;
  sent.forEach((id) => {
    if (received.has(id)) overlap = true;
  });
  return sent.size > 0 && received.size > 0 && !overlap && sent.size !== received.size;
}
