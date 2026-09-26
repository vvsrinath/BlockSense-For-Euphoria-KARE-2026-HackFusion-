import { cn } from '@blocksense/shared';

/**
 * The BlockSense brand.
 *
 * The supplied artwork is a *vertical* lockup: an emblem above a row of ten
 * letterforms. Two consequences, both of which used to be wrong here.
 *
 * The raster wordmark is illegible at interface sizes — scaled into a 28px
 * header, each of the ten letters is under three pixels wide. So the header
 * uses the emblem on its own (`logo-mark.png`, cut from the lockup by
 * `pnpm brand:assets`) and renders the name as real text beside it, which stays
 * selectable, themeable, and crisp at any size.
 *
 * The full lockup is still the right thing for a social card, where it is drawn
 * 380px wide and the wordmark is genuinely legible.
 */

interface BrandLogoProps {
  variant?: 'full' | 'mark';
  /** Height of the emblem in pixels. */
  size?: number;
  showTagline?: boolean;
  className?: string;
}

/**
 * Intrinsic aspect of the cut-out emblem, 215×263.
 *
 * Written as a literal rather than a comment so a change to the artwork shows up
 * as a distorted logo in review instead of a silently wrong ratio.
 */
const MARK_ASPECT = 215 / 263;

export function BrandLogo({ variant = 'full', size = 28, showTagline = false, className }: BrandLogoProps) {
  const height = size;
  const width = Math.round(size * MARK_ASPECT);

  const mark = (
    <img
      src="/logo-mark.png"
      // The emblem is 21–26 CSS px wide, so the browser is told the rendered
      // width and given the two WebP sizes that cover 1x and 2x. Falling back
      // to the 49 kB PNG would ship eight times the bytes for a 26px logo.
      srcSet="/logo-mark-64.webp 64w, /logo-mark-128.webp 128w"
      sizes={`${width}px`}
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
    </span>
  );
}
