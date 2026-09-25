import { formatAmount, type Transaction, type TransactionAsset } from '@blocksense/shared';

export function assetAmountLabel(asset: TransactionAsset): string {
  if (asset.type === 'nft') return `${asset.collection ?? asset.name} #${asset.tokenId ?? ''}`.trim();
  return formatAmount(asset.amount ?? '0', asset.symbol);
}

export function assetKindLabel(asset: TransactionAsset): string {
  if (asset.type === 'nft') return 'NFT transfer';
  if (asset.type === 'native') return 'Native asset';
  return 'Token transfer';
}

export function transactionHeadline(tx: Transaction): {title: string;kind: string;} {
  if (tx.assets && tx.assets.length > 1) {
    const sent = tx.assets.find((a) => a.direction === 'sent');
    const received = tx.assets.find((a) => a.direction === 'received');
    if (sent && received) return { title: `${assetAmountLabel(sent)} → ${assetAmountLabel(received)}`, kind: 'Token swap' };
  }
  return { title: assetAmountLabel(tx.asset), kind: assetKindLabel(tx.asset) };
}