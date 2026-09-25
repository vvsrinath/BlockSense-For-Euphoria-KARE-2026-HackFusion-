import { useState } from 'react';
import { ChevronDownIcon, CloudOffIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@blocksense/shared';

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const [open, setOpen] = useState(false);
  const code = error && 'code' in error ? String((error as Error & {code: string;}).code) : 'UNKNOWN_ERROR';

  return (
    <div className={cn('mx-auto max-w-md py-12', className)} role="alert">
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15">
          <CloudOffIcon className="h-6 w-6 text-warning-ink" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">We couldn't retrieve the blockchain data right now.</h2>
        <p className="mt-1.5 text-sm text-muted">The network provider may be temporarily unavailable.</p>
        {onRetry &&
        <Button onClick={onRetry} icon={RefreshCwIcon} className="mt-5">
            Try again
          </Button>
        }
        <div className="mt-5 border-t border-line pt-4 text-left">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink">
            
            Technical details
            <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform duration-150 ease-out', open && 'rotate-180')} aria-hidden="true" />
          </button>
          {open &&
          <pre className="mt-2 overflow-x-auto rounded-lg bg-subtle p-3 font-mono text-[11px] text-muted">
              {code}
              {'\n'}
              {error?.message ?? 'No additional details.'}
            </pre>
          }
        </div>
      </div>
    </div>);

}