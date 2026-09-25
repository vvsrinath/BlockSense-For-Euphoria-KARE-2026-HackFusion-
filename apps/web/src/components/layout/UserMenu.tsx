import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ActivityIcon,
  BookOpenIcon,
  GithubIcon,
  InfoIcon,
  LifeBuoyIcon,
  SettingsIcon
} from 'lucide-react';
import { DropdownPanel } from '@blocksense/ui';
import { useClickOutside } from '../../hooks/useClickOutside';
import { developer } from '../../data/developer';

const itemClass = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-subtle';

/**
 * Project menu.
 *
 * This was an account menu with a signed-in user called "Alex Morgan" and a
 * sign-out button, for a product that has no accounts, no authentication, and
 * no database. Both were fabricated: they implied a backend that does not
 * exist, and a sign-out that cannot do anything. There is no session to end, so
 * the control is now the project's own links.
 */
export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Project menu"
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary transition-colors duration-150 ease-out hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        {developer.initials}
      </button>

      <DropdownPanel open={open} className="w-64" role="menu" label="Project">
        <div className="px-3 py-2.5">
          <p className="text-sm font-medium text-ink">{developer.shortName}</p>
          <p className="mt-0.5 text-xs text-muted">Built BlockSense</p>
        </div>
        <div className="my-1 h-px bg-line" />

        <Link role="menuitem" to="/about" onClick={close} className={itemClass}>
          <InfoIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          About the developer
        </Link>
        <Link role="menuitem" to="/docs" onClick={close} className={itemClass}>
          <BookOpenIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          Documentation
        </Link>
        <Link role="menuitem" to="/status" onClick={close} className={itemClass}>
          <ActivityIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          System status
        </Link>
        <a
          role="menuitem"
          href={developer.github}
          target="_blank"
          rel="noreferrer noopener"
          onClick={close}
          className={itemClass}>
          <GithubIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          {developer.githubHandle} on GitHub
        </a>

        <div className="my-1 h-px bg-line" />

        <Link role="menuitem" to="/settings" onClick={close} className={itemClass}>
          <SettingsIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          Settings
        </Link>
        <Link role="menuitem" to="/help" onClick={close} className={itemClass}>
          <LifeBuoyIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          Help
        </Link>
      </DropdownPanel>
    </div>
  );
}
