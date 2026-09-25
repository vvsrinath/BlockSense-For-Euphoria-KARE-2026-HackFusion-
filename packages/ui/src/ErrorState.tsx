import { useState } from 'react';
import { ChevronDownIcon, CloudOffIcon, RefreshCwIcon, SearchXIcon, TimerIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@blocksense/shared';

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * What to say, per failure.
 *
 * Every error used to render the same two sentences, which made a provider
 * throttling us for a few seconds indistinguishable from a broken product —
 * and told the reader nothing about whether waiting would help. A missing
 * transaction, a rate limit, and a bad address each need different words and a
 * different next step.
 */
function describe(error: Error | null | undefined): { title: string; body: string; retryable: boolean } {
  const code = error && 'code' in error ? String((error as Error & { code: string }).code) : 'UNKNOWN_ERROR';

  if (code === 'TRANSACTION_NOT_FOUND' || code === 'WALLET_NOT_FOUND' || code === 'ASSET_NOT_FOUND') {
    return {
      title: "We couldn't find that on-chain.",
      body: 'The identifier may be mistyped, or it may not exist on the chain you are viewing. Check the address or hash and try again.',
      retryable: false
    };
  }

  if (code === 'RPC_RATE_LIMITED' || code === 'RATE_LIMITED') {
    return {
      title: 'The network provider is throttling requests.',
      body: 'This chain is being read through a shared public endpoint, which caps how often it can be asked. Waiting usually clears it — this page retries on its own a few times first.',
      retryable: true
    };
  }

  if (code === 'RPC_TIMEOUT' || code === 'RPC_UNAVAILABLE') {
    return {
      title: 'The network provider did not respond in time.',
      body: 'The chain may be busy, or the public endpoint may be overloaded. This page retries automatically, and you can try again manually.',
      retryable: true
    };
  }

  if (code === 'INVALID_ADDRESS' || code === 'INVALID_TRANSACTION_HASH' || code === 'INVALID_REQUEST') {
    return {
      title: "That doesn't look like a valid identifier.",
      body: 'Check the address or transaction hash. A truncated or mistyped value cannot be looked up.',
      retryable: false
    };
  }

  if (code === 'UNSUPPORTED_CHAIN') {
    return {
      title: 'That chain is not supported yet.',
      body: 'BlockSense reads Ethereum, BNB Chain, TRON, Solana and Bitcoin. Try an identifier from one of those.',
      retryable: false
    };
  }

  if (code === 'NOT_IMPLEMENTED') {
    return {
      title: 'This is not available for that chain yet.',
      body: error?.message ?? 'The data needed for this view is not implemented for this chain.',
      retryable: false
    };
  }

  return {
    title: "We couldn't retrieve the blockchain data right now.",
    body: 'The request did not complete. This page retries on its own for transient failures, and you can try again manually.',
    retryable: true
  };
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const [open, setOpen] = useState(false);
  const code = error && 'code' in error ? String((error as Error & {code: string;}).code) : 'UNKNOWN_ERROR';
  const { title, body, retryable } = describe(error);

  // An unknown address is a different problem from an unavailable network, and
  // the icon is the fastest way to tell them apart.
  const Icon = code.includes('NOT_FOUND') ? SearchXIcon : code === 'RPC_RATE_LIMITED' || code === 'RATE_LIMITED' ? TimerIcon : CloudOffIcon;

  return (
    <div className={cn('mx-auto max-w-md py-12', className)} role="alert">
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15">
          <Icon className="h-6 w-6 text-warning-ink" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
        {onRetry &&
        <Button onClick={onRetry} icon={RefreshCwIcon} className="mt-5" variant={retryable ? 'soft' : 'primary'}>
            {retryable ? 'Try again' : 'Check the identifier'}
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
