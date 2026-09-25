/**
 * Normalisation: raw chain data → the shared `Transaction` type.
 *
 * After this function runs, nothing downstream needs to know which chain the
 * transaction came from. That is what makes the intelligence layer
 * chain-agnostic.
 */

import type {
  RelatedWallet,
  TechnicalField,
  Transaction,
  TransactionAsset
} from '@blocksense/shared';
import { resolveAmount, formatResolvedAmount } from '../amount/amount';
import {
  isSender,
  looksLikeSwap,
  participants,
  type RawTransaction,
  type RawTransfer
} from '../parser/ledger';

export interface NormalizeOptions {
  /** Address the investigator is currently looking at, for direction labelling. */
  focusAddress?: string;
  /** Only include transfers touching this address. */
  filterToAddress?: boolean;
  /** Chain-native confirmations, for chains that report them. */
  confirmations?: number;
}

/** Convert one raw transfer into the shared asset shape. */
export function normalizeTransfer(transfer: RawTransfer, focusAddress?: string): TransactionAsset {
  const asset: TransactionAsset = {
    type: transfer.assetType,
    name: transfer.name,
    symbol: transfer.symbol,
    contractAddress: transfer.contractAddress,
    tokenId: transfer.tokenId,
    standard: transfer.standard,
    decimals: transfer.decimals
  };

  if (transfer.assetType === 'nft') {
    asset.tokenId = transfer.tokenId;
  } else {
    const resolved = resolveAmount({ raw: transfer.rawAmount, decimals: transfer.decimals });
    asset.amount = resolved.amount;
  }

  if (focusAddress) {
    const focus = focusAddress.toLowerCase();
    if (transfer.to.toLowerCase() === focus) asset.direction = 'received';
    else if (transfer.from.toLowerCase() === focus) asset.direction = 'sent';
  }

  return asset;
}

/** Derive the wallets worth showing alongside the transaction. */
export function relatedWallets(tx: RawTransaction, focusAddress?: string): RelatedWallet[] {
  const seen = new Map<string, RelatedWallet>();
  const focus = focusAddress?.toLowerCase();

  tx.transfers.forEach((t) => {
    [t.from, t.to].forEach((address) => {
      if (!address) return;
      const key = address.toLowerCase();
      if (key === focus || seen.has(key)) return;
      seen.set(key, {
        address,
        label: key,
        kind: 'wallet',
        relationship: isSender(tx, address) ? 'sender' : 'receiver',
        level: 'normal'
      });
    });
  });

  return [...seen.values()];
}

/** Chain-specific fields worth surfacing in the technical tab. */
export function technicalFields(tx: RawTransaction): TechnicalField[] {
  const fields: TechnicalField[] = [
    { label: 'Transaction hash', value: tx.hash },
    { label: 'Chain', value: tx.chain },
    { label: 'Height', value: String(tx.height) },
    { label: 'Status', value: tx.status }
  ];

  const fee = resolveAmount({ raw: tx.fee.rawAmount, decimals: tx.fee.decimals });
  fields.push({ label: 'Network fee', value: formatResolvedAmount(fee, tx.fee.symbol) });

  return fields;
}

/** A one-line description of what the transaction did. */
export function summarize(tx: RawTransaction, assets: TransactionAsset[]): string[] {
  if (looksLikeSwap(tx)) {
    const out = assets.find((a) => a.direction === 'sent');
    const into = assets.find((a) => a.direction === 'received');
    if (out && into) {
      return [`Swapped ${out.amount ?? '?'} ${out.symbol} for ${into.amount ?? '?'} ${into.symbol}`];
    }
  }
  if (assets.length === 0) return ['No value transferred'];
  return assets.map((a) =>
    a.type === 'nft'
      ? `Transferred NFT ${a.name}${a.tokenId ? ` #${a.tokenId}` : ''}`
      : `Transferred ${a.amount ?? '0'} ${a.symbol}`
  );
}

/** Full pipeline: raw transaction → shared `Transaction`. */
export function normalizeTransaction(
  raw: RawTransaction,
  options: NormalizeOptions = {}
): Transaction {
  const { focusAddress, filterToAddress, confirmations = 0 } = options;

  const relevant = filterToAddress && focusAddress
    ? raw.transfers.filter(
        (t) =>
          t.from.toLowerCase() === focusAddress.toLowerCase() ||
          t.to.toLowerCase() === focusAddress.toLowerCase()
      )
    : raw.transfers;

  const assets = relevant.map((t) => normalizeTransfer(t, focusAddress));
  const primary = assets[0];

  if (!primary) {
    throw new Error(`Transaction ${raw.hash} has no transferable assets.`);
  }

  const sender = relevant[0]?.from ?? '';
  const receiver = relevant.find((t) => t.to)?.to ?? relevant[0]?.to ?? '';

  return {
    hash: raw.hash,
    chain: raw.chain,
    from: sender,
    to: receiver,
    timestamp: raw.timestamp,
    status: raw.status,
    block: raw.height,
    confirmations,
    asset: primary,
    ...(assets.length > 1 ? { assets } : {}),
    fee: {
      amount: resolveAmount({ raw: raw.fee.rawAmount, decimals: raw.fee.decimals }).amount,
      symbol: raw.fee.symbol
    },
    summary: summarize(raw, assets),
    technical: technicalFields(raw),
    related: relatedWallets(raw, focusAddress)
  };
}

/** Total distinct addresses a transaction involved. */
export function counterpartyCount(tx: RawTransaction): number {
  return participants(tx).length;
}
