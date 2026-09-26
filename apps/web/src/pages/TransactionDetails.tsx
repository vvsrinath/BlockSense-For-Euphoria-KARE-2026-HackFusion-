import { useParams, useSearchParams } from 'react-router-dom';
import { SearchXIcon } from 'lucide-react';
import { getTransaction } from '../services/transactions';
import { TransactionAnalysisView } from '../components/analysis/TransactionAnalysisView';
import { Button, EmptyState, ErrorState, LoadingState } from '@blocksense/ui';

import { PageContainer } from '../components/layout/PageContainer';
import { TRON_EXAMPLE_TX } from '../data/exampleIdentifiers';
import { useProgressiveLoad } from '../hooks/useProgressiveLoad';
import { detectInput } from '@blocksense/blockchain';
import { isSupportedChain } from '@blocksense/blockchain';
import type { ChainId } from '@blocksense/shared';

const STEPS = ['Transaction found', 'Asset identified', 'Sender history loaded', 'Receiver history loaded', 'Relationship analysis', 'Behavioral analysis'];

export function TransactionDetails() {
  const { hash = '' } = useParams();
  const [params] = useSearchParams();
  // The search box passes the chain it detected alongside the hash. Two chains
  // share the `0x` prefix and two share the bare-64-hex shape, so without this
  // the page re-guesses from the hash alone and can open the wrong chain.
  const chainParam = params.get('chain') ?? undefined;
  const chain = chainParam && isSupportedChain(chainParam) ? (chainParam as ChainId) : undefined;
  const load = useProgressiveLoad(() => getTransaction(hash, chain), `tx:${chain ?? ''}:${hash}`, STEPS.length);

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
              <Button to={`/analyze/tx/${TRON_EXAMPLE_TX}`}>Analyze a real transaction</Button>
              <Button to="/analyze" variant="secondary">
                New search
              </Button>
            </>
          } />
        
      </PageContainer>);

  }

  return <TransactionAnalysisView tx={load.data} />;
}