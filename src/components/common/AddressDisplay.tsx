import { Link } from 'react-router-dom';
import { CheckIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react';
import { useCopy } from '../../hooks/useCopy';
import type { ChainId } from '../../types/chain';
import { explorerUrl } from '../../utils/chains';
import { cn } from '../../utils/cn';
import { truncateMiddle } from '../../utils/format';

interface AddressDisplayProps {
  value: string;
  chain?: ChainId;
  type?: 'address' | 'tx';
  start?: number;
  end?: number;
  to?: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
}

export function AddressDisplay({
  value,
  chain,
  type = 'address',
  start = 6,
  end = 4,
  to,
  showCopy = true,
  showExplorer = true,
  className
}: AddressDisplayProps) {
  const { copied, copy } = useCopy();
  const short = truncateMiddle(value, start, end);
  const textClass =
  'font-mono text-[13px] text-ink rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-0.5', className)}>
      <span className="group relative inline-flex min-w-0">
        {to ?
        <Link to={to} className={cn(textClass, 'hover:text-primary')} aria-label={`${type === 'tx' ? 'Transaction' : 'Address'} ${value}`}>
            {short}
          </Link> :

        <span tabIndex={0} className={textClass} aria-label={`${type === 'tx' ? 'Transaction' : 'Address'} ${value}`}>
            {short}
          </span>
        }
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-40 mb-2 hidden w-max max-w-[min(88vw,420px)] break-all rounded-lg bg-ink px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-surface shadow-pop group-focus-within:block group-hover:block">
          
          {value}
        </span>
      </span>
      {showCopy &&
      <button
        type="button"
        onClick={() => copy(value, type === 'tx' ? 'Transaction hash copied' : 'Address copied')}
        aria-label={`Copy ${type === 'tx' ? 'transaction hash' : 'address'}`}
        title="Copy"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-out hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        
          {copied ? <CheckIcon className="h-3.5 w-3.5 text-success-ink" aria-hidden="true" /> : <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      }
      {showExplorer && chain &&
      <a
        href={explorerUrl(chain, value, type)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on block explorer (opens in a new tab)"
        title="View on explorer"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-out hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        
          <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      }
    </span>);

}