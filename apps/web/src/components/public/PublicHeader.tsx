import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MenuIcon, XIcon } from 'lucide-react';
import { BrandLogo, Button } from '@blocksense/ui';
import { cn } from '@blocksense/shared';
import { publicNav, publicNavSecondary } from '../../data/site';

/**
 * Public site header.
 *
 * Separate from the application header on purpose: the marketing pages have no
 * sidebar, no workspace, and no signed-in state to show.
 */
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // A route change should never leave the mobile menu covering the page.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-content items-center gap-6 px-4 md:px-6 lg:px-8">
        <Link to="/" aria-label="BlockSense home" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          <BrandLogo size={26} />
        </Link>

        <nav aria-label="Primary" className="hidden flex-1 items-center gap-1 lg:flex">
          {publicNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive || pathname.startsWith(`${item.to}/`)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-subtle hover:text-ink'
                )
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {publicNavSecondary.map((item) => (
            <Button key={item.to} to={item.to} variant={item.label === 'Sign in' ? 'primary' : 'ghost'} size="sm">
              {item.label}
            </Button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="public-mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-subtle hover:text-ink lg:hidden">
          {open ? <XIcon className="h-5 w-5" aria-hidden="true" /> : <MenuIcon className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav id="public-mobile-nav" aria-label="Primary mobile" className="border-t border-line bg-surface px-4 py-3 lg:hidden">
          <ul className="space-y-0.5">
            {publicNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-subtle hover:text-ink'
                    )
                  }>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 border-t border-line pt-3">
            {publicNavSecondary.map((item) => (
              <Button key={item.to} to={item.to} variant={item.label === 'Sign in' ? 'primary' : 'secondary'} size="sm" className="flex-1">
                {item.label}
              </Button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
