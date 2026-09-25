import { FileTextIcon } from 'lucide-react';
import { listReports } from '../api/reports';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Skeleton } from '../components/common/Skeleton';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { ReportCard } from '../components/reports/ReportCard';
import { useAsync } from '../hooks/useAsync';

export function Reports() {
  const { data, status, error, retry } = useAsync(listReports, 'reports');

  return (
    <PageContainer>
      <PageHeader title="Reports" description="Investigation reports written in plain language, ready to share." />
      {status === 'error' ?
      <ErrorState error={error} onRetry={retry} /> :
      !data ?
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div> :
      data.length === 0 ?
      <EmptyState
        icon={FileTextIcon}
        title="No reports yet"
        description="Analyze a transaction and choose Generate report to create one."
        action={<Button to="/analyze">Analyze a transaction</Button>} /> :


      <ul className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {data.map((report) =>
        <li key={report.id}>
              <ReportCard report={report} />
            </li>
        )}
        </ul>
      }
    </PageContainer>);

}