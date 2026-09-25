import { LEGEND_KINDS, levelLabel, nodeKindLabel } from '@blocksense/intelligence';
import { levelStyles, nodeKindStyles } from '@blocksense/ui';

import { cn } from '@blocksense/shared';
import type { AnomalyLevel } from '@blocksense/shared';
const statuses: AnomalyLevel[] = ['normal', 'unusual', 'high'];

export function NetworkLegend({ className }: {className?: string;}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted', className)} aria-label="Graph legend">
      {LEGEND_KINDS.map((kind) =>
      <span key={kind} className="inline-flex items-center gap-1.5">
          <span className={cn('h-2.5 w-2.5 rounded-full', nodeKindStyles[kind].dot)} aria-hidden="true" />
          {nodeKindLabel(kind)}
        </span>
      )}
      <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
      {statuses.map((s) => {
        const Icon = levelStyles[s].icon;
        return (
          <span key={s} className="inline-flex items-center gap-1">
            <Icon className={cn('h-3.5 w-3.5', levelStyles[s].text)} aria-hidden="true" />
            {levelLabel(s)}
          </span>);

      })}
    </div>);

}