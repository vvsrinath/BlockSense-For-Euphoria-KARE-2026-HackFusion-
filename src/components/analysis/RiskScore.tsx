import { InfoIcon } from 'lucide-react';
import { LevelBadge } from '../common/LevelBadge';
import type { TransactionAnomaly } from '../../types/transaction';
import { cn } from '../../utils/cn';
import { levelHeadline, levelMeta } from '../../utils/levels';

interface RiskScoreProps {
  anomaly: TransactionAnomaly;
  className?: string;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RiskScore({ anomaly, className }: RiskScoreProps) {
  const meta = levelMeta[anomaly.level];
  const contributing = anomaly.details.filter((d) => d.level === 'high' || d.level === 'unusual');

  return (
    <section aria-labelledby="anomaly-heading" className={cn('flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card md:p-6', className)}>
      <h2 id="anomaly-heading" className="text-[15px] font-semibold text-ink">
        Anomaly score
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-[120px] w-[120px] shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-subtle" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={meta.stroke}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - anomaly.score / 100)} />
            
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-semibold leading-none tabular-nums text-ink">{anomaly.score}</span>
            <span className="mt-1 text-xs text-muted">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">{levelHeadline(anomaly.level)}</p>
          <LevelBadge level={anomaly.level} className="mt-2" size="md" />
        </div>
      </div>

      <div className="mt-4 flex h-1.5 overflow-hidden rounded-full" aria-hidden="true">
        <span className="w-[40%] bg-success/60" />
        <span className="w-[30%] bg-warning/60" />
        <span className="w-[30%] bg-danger/60" />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>Normal 0–39</span>
        <span>Unusual 40–69</span>
        <span>High 70–100</span>
      </div>

      {contributing.length > 0 ?
      <dl className="mt-5 space-y-3 border-t border-line pt-4">
          {contributing.map((signal) => {
          const SignalIcon = levelMeta[signal.level].icon;
          return (
            <div key={signal.id} className="flex items-start gap-2.5">
                <SignalIcon className={cn('mt-0.5 h-4 w-4 shrink-0', levelMeta[signal.level].text)} aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{signal.label}</dt>
                  <dd className="text-sm font-medium text-ink">{signal.value}</dd>
                </div>
              </div>);

        })}
        </dl> :

      <p className="mt-5 border-t border-line pt-4 text-sm text-muted">No signals differ from this wallet's history.</p>
      }

      <div className="mt-auto pt-5">
        <p className="flex gap-2 rounded-xl bg-primary/[0.06] p-3 text-xs leading-relaxed text-muted">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          This score highlights behavior that differs from the observed history. It is not proof of wrongdoing.
        </p>
      </div>
    </section>);

}