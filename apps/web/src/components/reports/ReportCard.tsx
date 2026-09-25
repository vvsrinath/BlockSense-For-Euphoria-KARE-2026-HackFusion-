import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, DownloadIcon, Share2Icon } from 'lucide-react';
import { AddressDisplay, Button, ChainBadge, LevelBadge } from '@blocksense/ui';

import { useCopy } from '@blocksense/ui';
import { formatDate } from '@blocksense/shared';
import type { Report } from '@blocksense/shared';
export function ReportCard({ report }: {report: Report;}) {
  const navigate = useNavigate();
  const { copy } = useCopy();

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{report.title}</h2>
          <p className="mt-0.5 text-xs text-muted">Generated {formatDate(report.createdAt)}</p>
        </div>
        <LevelBadge level={report.level} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div className="col-span-2">
          <dt className="text-xs text-muted">Transaction</dt>
          <dd className="mt-0.5">
            <AddressDisplay value={report.subject} chain={report.chain} type="tx" start={8} end={6} showExplorer={false} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Network</dt>
          <dd className="mt-0.5">
            <ChainBadge chain={report.chain} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Anomaly score</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-ink">{report.score}/100</dd>
        </div>
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-xs text-muted">Asset</dt>
          <dd className="mt-0.5 font-medium text-ink">{report.assetLabel}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs font-medium text-muted">Key findings</p>
        <ul className="mt-2 space-y-1.5">
          {report.findings.slice(0, 4).map((f) =>
          <li key={f} className="flex gap-2 text-sm text-ink">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
              {f}
            </li>
          )}
        </ul>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button to={`/reports/${report.id}`} size="sm" iconRight={ArrowRightIcon}>
          View report
        </Button>
        <Button size="sm" variant="secondary" icon={DownloadIcon} onClick={() => navigate(`/reports/${report.id}?print=1`)}>
          Download PDF
        </Button>
        <Button size="sm" variant="ghost" icon={Share2Icon} onClick={() => copy(`${window.location.origin}/reports/${report.id}`, 'Report link copied')}>
          Share
        </Button>
      </div>
    </article>);

}