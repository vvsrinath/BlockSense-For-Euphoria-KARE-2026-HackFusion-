import { useState } from 'react';
import { getWalletActivity } from '../../api/wallets';
import { ErrorState } from '../common/ErrorState';
import { Panel } from '../common/Panel';
import { Skeleton } from '../common/Skeleton';
import { TransactionTable } from '../tables/TransactionTable';
import { useAsync } from '../../hooks/useAsync';
import type { Wallet } from '../../types/wallet';
import { rowFromActivity } from '../../utils/rows';

const PAGE_SIZE = 8;

export function WalletActivity({ wallet }: {wallet: Wallet;}) {
  const [page, setPage] = useState(0);
  const { data, status, error, retry } = useAsync(() => getWalletActivity(wallet.address, page, PAGE_SIZE), `${wallet.address}:${page}`);

  return (
    <Panel title="Recent activity" description="Most recent transactions first. Older rows are sample history.">
      {status === 'error' ?
      <ErrorState error={error} onRetry={retry} className="py-4" /> :
      !data ?
      <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) =>
        <Skeleton key={i} className="h-12" />
        )}
        </div> :

      <TransactionTable
        caption="Wallet activity"
        rows={data.rows.map((a) => rowFromActivity(a, wallet.chain))}
        showChain={false}
        pagination={{ page, pageCount: Math.ceil(data.total / PAGE_SIZE), onChange: setPage }} />

      }
    </Panel>);

}