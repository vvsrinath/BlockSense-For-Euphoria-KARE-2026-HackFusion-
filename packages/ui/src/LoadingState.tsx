import { CircleCheckIcon, CircleIcon, LoaderCircleIcon } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { cn } from '@blocksense/shared';

interface LoadingStateProps {
  title: string;
  steps: string[];
  current: number;
}

export function LoadingState({ title, steps, current }: LoadingStateProps) {
  const progress = Math.min(100, Math.round(current / steps.length * 100));
  return (
    <div className="mx-auto max-w-md py-12" role="status" aria-live="polite">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="flex items-center gap-3">
          <BrandLogo variant="mark" size={28} />
          <p className="text-[15px] font-semibold text-ink">{title}</p>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-brand transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-5 space-y-2.5">
          {steps.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={step} className={cn('flex items-center gap-2.5 text-sm', done ? 'text-ink' : active ? 'text-ink' : 'text-muted')}>
                {done ?
                <CircleCheckIcon className="h-4 w-4 text-success" aria-hidden="true" /> :
                active ?
                <LoaderCircleIcon className="h-4 w-4 animate-spin text-primary" aria-hidden="true" /> :

                <CircleIcon className="h-4 w-4 text-line-strong" aria-hidden="true" />
                }
                <span>{step}</span>
                <span className="sr-only">{done ? '(done)' : active ? '(in progress)' : '(pending)'}</span>
              </li>);

          })}
        </ol>
      </div>
    </div>);

}