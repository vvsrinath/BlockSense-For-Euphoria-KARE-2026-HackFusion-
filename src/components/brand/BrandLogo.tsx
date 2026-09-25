import { useId } from 'react';
import { cn } from '../../utils/cn';

interface BrandLogoProps {
  variant?: 'full' | 'mark';
  size?: number;
  showTagline?: boolean;
  className?: string;
}

export function BrandLogo({ variant = 'full', size = 28, showTagline = false, className }: BrandLogoProps) {
  const gradientId = `bs-grad-${useId().replace(/:/g, '')}`;

  const mark =
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M5 7a4 4 0 0 1 4-4h9a6 6 0 0 1 0 12H5V7Z" fill={`url(#${gradientId})`} />
      <path d="M5 17h14.5a6 6 0 0 1 0 12H9a4 4 0 0 1-4-4v-8Z" fill={`url(#${gradientId})`} opacity="0.82" />
      <rect x="10" y="7.5" width="7" height="3" rx="1.5" className="fill-surface" />
      <rect x="10" y="21.5" width="8.5" height="3" rx="1.5" className="fill-surface" />
    </svg>;


  if (variant === 'mark') {
    return (
      <span className={cn('inline-flex', className)} role="img" aria-label="BlockSense">
        {mark}
      </span>);

  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {mark}
      <span className="flex flex-col leading-none">
        <span className="font-semibold tracking-tight" style={{ fontSize: Math.round(size * 0.64) }}>
          <span className="text-brand-ink">Block</span>
          <span className="text-primary">Sense</span>
        </span>
        {showTagline && <span className="mt-1.5 text-xs text-muted">See the transaction. Understand the behavior.</span>}
      </span>
    </span>);

}