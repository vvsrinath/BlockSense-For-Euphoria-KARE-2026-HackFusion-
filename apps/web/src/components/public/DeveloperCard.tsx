import { GithubIcon, LinkedinIcon, MailIcon } from 'lucide-react';
import { developer } from '../../data/developer';
import { cn } from '@blocksense/shared';
import { DeveloperPortrait } from './DeveloperPortrait';

/**
 * The author card.
 *
 * Reuses `DeveloperPortrait` so the photo and its initials fallback behave the
 * same way here and in the contact section.
 */
export function DeveloperCard() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:flex-row sm:items-start sm:gap-7 sm:p-7 sm:text-left">
      <DeveloperPortrait eager className="h-28 w-28 sm:h-32 sm:w-32" />

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
