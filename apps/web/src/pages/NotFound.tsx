import { Button, EmptyState } from '@blocksense/ui';

import { PageContainer } from '../components/layout/PageContainer';

export function NotFound() {
  return (
    <PageContainer>
      <EmptyState title="Page not found" description="The page you're looking for doesn't exist or has moved." action={<Button to="/home">Go to Home</Button>} />
    </PageContainer>);

}