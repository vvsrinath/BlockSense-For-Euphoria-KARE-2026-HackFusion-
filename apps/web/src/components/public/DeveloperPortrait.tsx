import { useState } from 'react';
import { developer } from '../../data/developer';
import { cn } from '@blocksense/shared';

/**
 * The developer portrait, with an initials fallback.
 *
 * The fallback is deliberate. `developer.photo` points at a file in
 * `apps/web/public`, and a public/ folder that is missing an asset still serves
 * the SPA shell with a 200 for that path — so without `onError` the browser
 * would happily render the returned HTML as a broken image. Falling back to a
 * monogram keeps the page honest instead of showing a torn-image icon.
 */
export function DeveloperPortrait({
  className,
  imageClassName,
  eager = false
}: {
  className?: string;
  imageClassName?: string;
  /** Skip lazy loading for portraits that sit above the fold. */
  eager?: boolean;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(developer.photo) && !photoFailed;

  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10',
        className
      )}>
      {showPhoto ? (
        <img
          src={developer.photo}
          alt={`${developer.name}, the developer of BlockSense`}
          width={320}
          height={320}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setPhotoFailed(true)}
          className={cn('h-full w-full object-cover', imageClassName)}
        />
      ) : (
        <span className="text-2xl font-semibold text-primary" aria-hidden="true">
          {developer.initials}
        </span>
      )}
    </span>
  );
}
