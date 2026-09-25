import { useId, useState } from 'react';
import { ChevronDownIcon, CodeIcon } from 'lucide-react';
import { InfoTip } from '../common/InfoTip';
import type { TechnicalField } from '../../types/transaction';
import { cn } from '../../utils/cn';

interface TechnicalDetailsProps {
  fields: TechnicalField[];
  defaultOpen: boolean;
  className?: string;
}

export function TechnicalDetails({ fields, defaultOpen, className }: TechnicalDetailsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={cn('rounded-2xl border border-line bg-surface shadow-card', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:px-6">
        
        <CodeIcon className="h-4 w-4 text-muted" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-[15px] font-semibold text-ink">{open ? 'Technical details' : 'View technical details'}</span>
          <span className="block text-sm text-muted">Raw values for technical users</span>
        </span>
        <ChevronDownIcon className={cn('h-4 w-4 text-muted transition-transform duration-200 ease-out', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open &&
      <dl id={panelId} className="grid gap-x-8 border-t border-line px-5 pb-5 pt-2 md:grid-cols-2 md:px-6">
          {fields.map((f) =>
        <div key={f.label} className="flex items-start justify-between gap-4 border-b border-line py-3">
              <dt className="flex shrink-0 items-center gap-1 text-sm text-muted">
                {f.label}
                {f.hint && <InfoTip text={f.hint} label="What this means" />}
              </dt>
              <dd className="min-w-0 break-all text-right font-mono text-[13px] text-ink">{f.value}</dd>
            </div>
        )}
        </dl>
      }
    </section>);

}