import { cn } from '@blocksense/shared';

/**
 * The BlockSense brand mark.
 *
 * The artwork is a raster file, not an inline SVG, so it comes from
 * `/public` and is referenced by URL. It is served as a square canvas at every
 * size: the lockup is wider than it is tall, and stretching it to a square
 * would distort the letterforms.
 */

interface BrandLogoProps {
  variant?: 'full' | 'mark';
  /** Height of the mark in pixels. The width follows the artwork's aspect. */
  size?: number;
  showTagline?: boolean;
  /**
   * Set false if the artwork already contains the wordmark, so it is not
   * rendered twice.
   */
  showWordmark?: boolean;
  className?: string;
}

/** Intrinsic aspect of logo.png, kept in sync by scripts/build-brand-assets. */
const ARTWORK_ASPECT = 419 / 327;

export function BrandLogo({
  variant = 'full',
  size = 28,
  showTagline = false,
  showWordmark = true,
  className
}: BrandLogoProps) {
  const height = size;
  const width = Math.round(size * ARTWORK_ASPECT);

  const mark = (
    <img
      src="/logo.png"
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      style={{ height: `${height}px`, width: `${width}px` }}
      className="shrink-0 select-none object-contain"
    />
  );

  if (variant === 'mark') {
    return (
      <span className={cn('inline-flex', className)} role="img" aria-label="BlockSense">
        {mark}
      </span>
    );
  }

  // With the artwork being a wide lockup, the text beside it is only correct
  // when the artwork is a mark on its own. `showWordmark` is the escape hatch.
  const withText = showWordmark ? (
    <span className="flex flex-col leading-none">
      <span className="font-semibold tracking-tight" style={{ fontSize: Math.round(size * 0.64) }}>
        <span className="text-brand-ink">Block</span>
        <span className="text-primary">Sense</span>
      </span>
      {showTagline && <span className="mt-1.5 text-xs text-muted">See the transaction. Understand the behavior.</span>}
    </span>
  ) : null;

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {mark}
      {withText}
    </span>
  );
}
