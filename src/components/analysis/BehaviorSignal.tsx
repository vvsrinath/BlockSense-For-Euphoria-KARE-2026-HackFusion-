import { ActivityIcon, ClockIcon, GemIcon, HistoryIcon, TrendingUpIcon, UserPlusIcon, type LucideIcon } from "lucide-react";
import { LevelBadge } from "../common/LevelBadge";
import { AnomalySignal, SignalKind } from "../../types/transaction";
import { cn } from "../../utils/cn";
import { levelMeta } from "../../utils/levels";
const kindIcons: Record<SignalKind, LucideIcon> = {
  amount: TrendingUpIcon,
  frequency: ActivityIcon,
  relationship: UserPlusIcon,
  time: ClockIcon,
  history: HistoryIcon,
  asset: GemIcon
};
export function BehaviorSignal({
  signal


}: {signal: AnomalySignal;}) {
  const Icon = kindIcons[signal.kind];
  const meta = levelMeta[signal.level];
  return <li className="flex gap-3 rounded-xl bg-subtle/60 p-4">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.badge)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="text-xs text-muted">{signal.label}</p>
          <LevelBadge level={signal.level} label={signal.level === 'info' ? 'Info' : undefined} />
        </div>
        <p className="mt-0.5 text-[15px] font-semibold text-ink">{signal.value}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{signal.detail}</p>
      </div>
    </li>;
}