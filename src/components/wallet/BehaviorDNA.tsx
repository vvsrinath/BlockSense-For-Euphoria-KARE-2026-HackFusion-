import { ClockIcon, CoinsIcon, RepeatIcon, TrendingUpIcon, UsersIcon, type LucideIcon } from "lucide-react";
import { Panel } from "../common/Panel";
import { Wallet } from "../../types/wallet";
import { cn } from "../../utils/cn";
interface Fact {
  label: string;
  value: string;
  icon: LucideIcon;
}
export function BehaviorDNA({
  wallet,
  className



}: {wallet: Wallet;className?: string;}) {
  const {
    dna
  } = wallet;
  const facts: Fact[] = [{
    label: 'Typical amount',
    value: dna.typicalAmount,
    icon: TrendingUpIcon
  }, {
    label: 'Typical frequency',
    value: dna.typicalFrequency,
    icon: RepeatIcon
  }, {
    label: 'Most active time',
    value: dna.mostActive,
    icon: ClockIcon
  }, {
    label: 'Common asset',
    value: dna.commonAsset,
    icon: CoinsIcon
  }, {
    label: 'Common counterparties',
    value: `${dna.counterparties} wallets`,
    icon: UsersIcon
  }];
  return <Panel title="Behavior DNA" description="Observed patterns from wallet history" className={className}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <dl className="space-y-4">
          {facts.map((f) => <div key={f.label} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted">{f.label}</dt>
                <dd className="text-[15px] font-semibold text-ink">{f.value}</dd>
              </div>
            </div>)}
        </dl>

        <ul className="space-y-4">
          {dna.traits.map((trait) => {
          const filled = Math.round(trait.value / 10);
          return <li key={trait.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{trait.label}</p>
                  <p className="text-xs text-muted">{trait.descriptor}</p>
                </div>
                <div className="mt-1.5 grid grid-cols-10 gap-1" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={trait.value} aria-label={`${trait.label}: ${trait.descriptor}`}>
                  {Array.from({
                length: 10
              }, (_, i) => <span key={i} className={cn('h-2 rounded-sm', i < filled ? 'bg-primary' : 'bg-subtle')} />)}
                </div>
                <p className="mt-1 text-xs text-muted">{trait.description}</p>
              </li>;
        })}
        </ul>
      </div>
      <p className="mt-6 border-t border-line pt-4 text-xs text-muted">
        Describes observed transaction behavior only. It does not identify who controls the wallet or their intent.
      </p>
    </Panel>;
}