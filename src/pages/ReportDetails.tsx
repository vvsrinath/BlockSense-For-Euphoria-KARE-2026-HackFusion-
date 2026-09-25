import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, DownloadIcon, FileTextIcon, InfoIcon, Share2Icon } from 'lucide-react';
import { getReport } from '../api/reports';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { LevelBadge } from '../components/common/LevelBadge';
import { Skeleton } from '../components/common/Skeleton';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { useCopy } from '../hooks/useCopy';
import { getChain } from '../utils/chains';
import { formatDateTime, truncateMiddle } from '../utils/format';

export function ReportDetails() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { data, status, error, retry } = useAsync(() => getReport(id), `report:${id}`);
  const { copy } = useCopy();

  useEffect(() => {
    if (data && params.get('print') === '1') {
      setParams({}, { replace: true });
      const t = setTimeout(() => window.print(), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [data, params, setParams]);

  if (status === 'error') return <PageContainer><ErrorState error={error} onRetry={retry} /></PageContainer>;
  if (status === 'loading' && !data) {
    return (
      <PageContainer>
        <Skeleton className="mx-auto h-[640px] max-w-3xl rounded-2xl" />
      </PageContainer>);

  }
  if (!data) {
    return (
      <PageContainer>
        <EmptyState icon={FileTextIcon} title="Report not found" description="It may have been removed from this browser." action={<Button to="/reports">All reports</Button>} />
      </PageContainer>);

  }

  const report = data;
  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          back={{ to: '/reports', label: 'Reports' }}
          title="Report"
          className="print:hidden"
          actions={
          <>
              <Button variant="secondary" icon={Share2Icon} onClick={() => copy(window.location.href, 'Report link copied')}>
                Share
              </Button>
              <Button icon={DownloadIcon} onClick={() => window.print()}>
                Download PDF
              </Button>
            </>
          } />
        

        <article className="rounded-2xl border border-line bg-surface p-6 shadow-card md:p-12 print:border-0 print:p-0 print:shadow-none">
          <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <BrandLogo size={26} />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Transaction Intelligence Report</h1>
              <p className="mt-1 text-sm text-muted">{report.title}</p>
            </div>
            <dl className="text-sm sm:text-right">
              <dt className="text-xs text-muted">Report ID</dt>
              <dd className="font-mono text-[13px] text-ink">{report.id}</dd>
              <dt className="mt-2 text-xs text-muted">Generated</dt>
              <dd className="text-ink">{formatDateTime(report.createdAt)}</dd>
            </dl>
          </header>

          <section aria-label="At a glance" className="grid gap-6 border-b border-line py-6 sm:grid-cols-[160px_1fr]">
            <div>
              <p className="text-xs text-muted">Anomaly score</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums text-ink">
                {report.score}
                <span className="text-base font-normal text-muted"> / 100</span>
              </p>
              <LevelBadge level={report.level} className="mt-2" />
            </div>
            <div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span>
                  <span className="text-muted">Transaction </span>
                  <span className="font-mono text-[13px] text-ink">{truncateMiddle(report.txHash, 10, 8)}</span>
                </span>
                <span>
                  <span className="text-muted">Network </span>
                  <span className="text-ink">{getChain(report.chain).name}</span>
                </span>
                <span>
                  <span className="text-muted">Asset </span>
                  <span className="text-ink">{report.assetLabel}</span>
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-muted">Key findings</p>
              <ul className="mt-2 space-y-1.5">
                {report.findings.map((f) =>
                <li key={f} className="flex gap-2 text-sm text-ink">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
                    {f}
                  </li>
                )}
              </ul>
            </div>
          </section>

          <ol className="divide-y divide-line">
            {report.sections.map((section, i) =>
            <li key={section.id} className="py-6 [break-inside:avoid]">
                <h2 className="flex items-baseline gap-3 text-base font-semibold text-ink">
                  <span className="text-sm font-medium tabular-nums text-muted">{i + 1}.</span>
                  {section.title}
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">{section.body}</p>
                {section.facts && section.facts.length > 0 &&
              <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {section.facts.map((fact) =>
                <div key={fact.label} className="flex justify-between gap-4 border-b border-line py-2 text-sm">
                        <dt className="shrink-0 text-muted">{fact.label}</dt>
                        <dd className="text-right text-ink">{fact.value}</dd>
                      </div>
                )}
                  </dl>
              }
              </li>
            )}
          </ol>

          <footer className="mt-4 rounded-xl bg-subtle/70 p-4 text-xs leading-relaxed text-muted">
            <p className="flex gap-2">
              <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              This report describes observed on-chain behavior and how it differs from available history. It does not identify individuals and is not proof of wrongdoing. Generated by BlockSense from demo data.
            </p>
          </footer>
        </article>

        <div className="mt-6 flex justify-center print:hidden">
          <Link to={`/analyze/tx/${report.txHash}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Open the full transaction analysis
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </PageContainer>);

}