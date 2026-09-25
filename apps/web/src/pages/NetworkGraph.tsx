import { useSearchParams } from 'react-router-dom';
import { SearchXIcon } from 'lucide-react';
import { getNetwork } from '../services/network';
import { AddressDisplay, Button, EmptyState, ErrorState, Skeleton } from '@blocksense/ui';

import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { NetworkGraph } from '../components/network/NetworkGraph';
import { NetworkLegend } from '../components/network/NetworkLegend';
import { DEFAULT_GRAPH_EXAMPLE } from '../data/examples';
import { useAsync } from '../hooks/useAsync';

export function NetworkGraphPage() {
  const [params] = useSearchParams();
  const requested = params.get('address');
  const address = requested ?? DEFAULT_GRAPH_EXAMPLE.address;
  const { data, status, error, retry } = useAsync(() => getNetwork(address), `network:${address}`);

  return (
    <PageContainer>
      <PageHeader
        title="Network graph"
        description={
        <span className="inline-flex flex-wrap items-center gap-2">
            Observed connections for
            <AddressDisplay value={address} showExplorer={false} />
            {!requested && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Demo wallet</span>}
          </span>
        }
        actions={
        <Button to={`/wallet/${encodeURIComponent(address)}`} variant="secondary">
            View wallet analysis
          </Button>
        } />
      
      <NetworkLegend className="mb-4" />

      {status === 'error' ?
      <ErrorState error={error} onRetry={retry} /> :
      status === 'loading' && !data ?
      <Skeleton className="h-[62vh] min-h-[460px] rounded-2xl" /> :
      !data ?
      <EmptyState
        icon={SearchXIcon}
        title="No network data for this address"
        description="This address isn't in the demo dataset. Network mapping for any address activates once the backend is connected."
        action={<Button to="/network">View demo network</Button>} /> :

      <NetworkGraph data={data} />
      }
    </PageContainer>);

}