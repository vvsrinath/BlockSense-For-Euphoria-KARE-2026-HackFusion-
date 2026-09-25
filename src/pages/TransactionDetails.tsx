import { useParams } from 'react-router-dom';
import { SearchXIcon } from 'lucide-react';
import { getTransaction } from '../api/transactions';
import { TransactionAnalysisView } from '../components/analysis/TransactionAnalysisView';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { PageContainer } from '../components/layout/PageContainer';
import { DEMO_TX_HASH } from '../data/mockAddresses';
import { useProgressiveLoad } from '../hooks/useProgressiveLoad';
import { detectInput } from '../utils/detectInput';

const STEPS = ['Transaction found', 'Asset identified', 'Sender history loaded', 'Receiver history loaded', 'Relationship analysis', 'Behavioral analysis'];

export function TransactionDetails() {
  const { hash = '' } = useParams();
  const load = useProgressiveLoad(() => getTransaction(hash), `tx:${hash}`, STEPS.length);

  if (load.status === 'loading') {
    return (
      <PageContainer>
        <LoadingState title="Analyzing transaction…" steps={STEPS} current={load.step} />
      </PageContainer>);

  }

  if (load.status === 'error') {
    return (
      <PageContainer>
        <ErrorState error={load.error} onRetry={load.retry} />
      </PageContainer>);

  }

  if (!load.data) {
    const isTx = detectInput(hash).kind === 'transaction';
    return (
      <PageContainer>
        <EmptyState
          icon={SearchXIcon}
          title={isTx ? "This transaction isn't in the demo dataset" : "We couldn't identify this input."}
          description={
          isTx ?
          'Live transaction lookups activate once the BlockSense backend is connected. Try the demo transaction in the meantime.' :
          'Check the address or transaction hash and try again.'
          }
          action={
          <>
              <Button to={`/analyze/tx/${DEMO_TX_HASH}`}>Open demo transaction</Button>
              <Button to="/analyze" variant="secondary">
                New search
              </Button>
            </>
          } />
        
      </PageContainer>);

  }

  return <TransactionAnalysisView tx={load.data} />;
}