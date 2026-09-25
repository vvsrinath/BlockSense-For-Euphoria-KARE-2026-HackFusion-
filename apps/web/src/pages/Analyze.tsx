import { listRecentTransactions } from '../services/transactions';
import { ErrorState, Panel, Skeleton } from '@blocksense/ui';

import { QuickAnalyze } from '../components/home/QuickAnalyze';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { TransactionTable } from '../components/tables/TransactionTable';
import { useAsync } from '../hooks/useAsync';
import { rowFromTransaction } from '../utils/rows';

export function Analyze() {
  const samples = useAsync(listRecentTransactions, 'samples');

  return (
    <PageContainer>
      <PageHeader title="Analyze" description="Don't just see the transaction. Understand the behavior." />
      <QuickAnalyze
        title="What would you like to understand?"
        description="Paste a transaction hash or wallet address. We'll detect the chain and explain what happened."
        autoFocus />
      
      <Panel title="Sample transactions" description="Demo data across five networks — open any to see a full analysis" className="mt-4 lg:mt-6">
        {samples.status === 'error' ?
        <ErrorState error={samples.error} onRetry={samples.retry} className="py-4" /> :
        !samples.data ?
        <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) =>
          <Skeleton key={i} className="h-12" />
          )}
          </div> :

        <TransactionTable caption="Sample transactions" rows={samples.data.map(rowFromTransaction)} />
        }
      </Panel>
    </PageContainer>);

}