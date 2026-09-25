import { BehaviorSignal } from './BehaviorSignal';
import { Panel } from '@blocksense/ui';
import type { AnomalySignal } from '@blocksense/shared';

interface BehaviorSignalsProps {
  signals: AnomalySignal[];
  className?: string;
}

export function BehaviorSignals({ signals, className }: BehaviorSignalsProps) {
  return (
    <Panel title="Behavior signals" description="How this transaction compares with the wallet's own history" className={className}>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {signals.map((signal) =>
        <BehaviorSignal key={signal.id} signal={signal} />
        )}
      </ul>
    </Panel>);

}