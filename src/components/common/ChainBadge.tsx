import type { ChainId } from '../../types/chain';
import { getChain } from '../../utils/chains';
import { cn } from '../../utils/cn';

interface ChainBadgeProps {
  chain: ChainId;
  variant?: 'plain' | 'pill';
  className?: string;
}

export function ChainBadge({ chain, variant = 'plain', className }: ChainBadgeProps) {
  const info = getChain(chain);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-ink',
        variant === 'pill' && 'rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium',
        className
      )}>
      
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: info.color }} aria-hidden="true" />
      {info.name}
    </span>);

}