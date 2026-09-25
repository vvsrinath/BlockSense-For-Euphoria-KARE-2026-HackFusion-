import { useState } from 'react';
import { GithubIcon, LinkedinIcon, MailIcon } from 'lucide-react';
import { developer } from '../../data/developer';
import { cn } from '@blocksense/shared';

/**
 * The author card.
 *
 * The portrait is optional. If the file is missing the initials render instead,
 * because a broken image icon on an about page looks like a bug, and a
 * monogram is a deliberate fallback rather than a placeholder.
 */
export function DeveloperCard() {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(developer.photo) && !photoFailed;

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:flex-row sm:items-start sm:gap-7 sm:p-7 sm:text-left">
      <span className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 sm:h-32 sm:w-32">
        {showPhoto ? (
          <img
            src={developer.photo}
            alt={`${developer.name}, the developer of BlockSense`}
            width={128}
            height={128}
            loading="lazy"
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl font-semibold text-primary" aria-hidden="true">
            {developer.initials}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{developer.name}</h2>
        <p className="mt-0.5 text-sm text-primary">{developer.role}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{developer.bio}</p>

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <li>
            <a
              href={developer.github}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-primary/40 hover:text-ink">
              <GithubIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {developer.githubHandle}
            </a>
          </li>
          <li>
            <a
              href={developer.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-primary/40 hover:text-ink">
              <LinkedinIcon className="h-3.5 w-3.5" aria-hidden="true" />
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href={`mailto:${developer.email}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5',
                'text-xs font-medium text-muted transition-colors duration-150 hover:border-primary/40 hover:text-ink'
              )}>
              <MailIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {developer.email}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
