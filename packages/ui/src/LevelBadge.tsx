import { type SignalLevel, cn } from '@blocksense/shared';
import { levelLabel } from '@blocksense/intelligence';
import { levelStyles } from './theme/levelStyles';

interface LevelBadgeProps {
  level: SignalLevel;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function LevelBadge({ level, label, size = 'sm', className }: LevelBadgeProps) {
  const style = levelStyles[level];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-[13px]',
        style.badge,
        className
      )}>
      
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {label ?? levelLabel(level)}
    </span>);

}