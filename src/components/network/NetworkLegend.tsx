import { levelMeta } from '../../utils/levels';
import { legendKinds, nodeKindMeta } from '../../utils/nodeKinds';
import { cn } from '../../utils/cn';
import type { AnomalyLevel } from '../../types/chain';

const statuses: AnomalyLevel[] = ['normal', 'unusual', 'high'];

export function NetworkLegend({ className }: {className?: string;}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted', className)} aria-label="Graph legend">
      {legendKinds.map((kind) =>
      <span key={kind} className="inline-flex items-center gap-1.5">
          <span className={cn('h-2.5 w-2.5 rounded-full', nodeKindMeta[kind].dot)} aria-hidden="true" />
          {nodeKindMeta[kind].label}
        </span>
      )}
      <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
      {statuses.map((s) => {
        const Icon = levelMeta[s].icon;
        return (
          <span key={s} className="inline-flex items-center gap-1">
            <Icon className={cn('h-3.5 w-3.5', levelMeta[s].text)} aria-hidden="true" />
            {levelMeta[s].label}
          </span>);

      })}
    </div>);

}