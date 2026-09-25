import { InfoTip } from './InfoTip';
import { cn } from '../../utils/cn';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  className?: string;
}

export function StatCard({ label, value, hint, emphasis = false, className }: StatCardProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="flex items-center gap-1 text-xs text-muted">
        {label}
        {hint && <InfoTip text={hint} />}
      </dt>
      <dd className={cn('mt-1 truncate font-semibold tabular-nums text-ink', emphasis ? 'text-2xl' : 'text-lg')}>{value}</dd>
    </div>);

}