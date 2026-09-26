import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon, BoxIcon, XIcon } from 'lucide-react';
import { BrandLogo } from '@blocksense/ui';
import { SidebarLink } from './SidebarLink';
import { useSettings } from '../../stores/SettingsContext';
import { useMobileSidebar } from '../../stores/MobileSidebarContext';
import { primaryNav } from '../../data/navigation';
import { useMediaQuery, useIsMobile } from '../../hooks/useMediaQuery';
import { cn } from '@blocksense/shared';
import { developer } from '../../data/developer';

export function Sidebar() {
  const { settings, update } = useSettings();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobile = useIsMobile();
  const { isOpen, close } = useMobileSidebar();
  const location = useLocation();
  const [rendered, setRendered] = useState(isOpen);

  // Keep the drawer mounted through the closing transition instead of
  // unmounting it the instant `isOpen` flips to false.
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      return;
    }
    const timer = window.setTimeout(() => setRendered(false), 200);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // A route change means the user picked a destination, so the drawer is done.
  useEffect(() => {
    if (isOpen) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const collapsed = isDesktop && settings.sidebarCollapsed;
  // The drawer is always labelled on mobile; only the desktop rail collapses.
  const railCollapsed = collapsed || isMobile;

  return (
    <>
      {rendered && (
        <div
          className={cn('fixed inset-0 z-40 bg-ink/50 transition-opacity duration-200 md:hidden print:hidden', isOpen ? 'opacity-100' : 'opacity-0')}
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        id="mobile-nav-drawer"
        aria-label="Main navigation"
        aria-hidden={isMobile && !isOpen ? 'true' : undefined}
        className={cn(
          'z-50 shrink-0 flex-col border-r border-line bg-surface transition-[width,transform] duration-200 ease-out print:hidden',
          isMobile
            ? cn('fixed inset-y-0 left-0 flex w-[264px] shadow-xl', isOpen ? 'translate-x-0' : '-translate-x-full')
            : cn('sticky top-0 hidden h-screen md:flex', collapsed ? 'w-[72px]' : 'w-[240px]')
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center', railCollapsed ? 'justify-center' : 'px-5')}>
          <Link
            to="/"
            aria-label="BlockSense — back to landing page"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            onClick={isMobile ? close : undefined}
          >
            <BrandLogo variant={railCollapsed ? 'mark' : 'full'} size={28} />
          </Link>
          {isMobile && (
            <button
              type="button"
              onClick={close}
              aria-label="Close navigation menu"
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <XIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-0.5">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <SidebarLink to={item.to} label={item.label} icon={item.icon} collapsed={railCollapsed} onClick={isMobile ? close : undefined} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-0.5 border-t border-line px-3 py-3">
          <SidebarLink to="/settings" label="Settings" icon={SettingsIcon} collapsed={railCollapsed} onClick={isMobile ? close : undefined} />
          <SidebarLink to="/help" label="Help" icon={BoxIcon} collapsed={railCollapsed} onClick={isMobile ? close : undefined} />
          {isDesktop && (
            <button
              type="button"
              onClick={() => update({ sidebarCollapsed: !settings.sidebarCollapsed })}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'flex h-10 w-full items-center gap-3 rounded-xl text-sm font-medium text-muted transition-[background-color,color] duration-150 ease-out hover:bg-subtle hover:text-ink',
                collapsed ? 'justify-center' : 'px-3'
              )}
            >
              {collapsed ? <PanelLeftOpenIcon className="h-[18px] w-[18px]" aria-hidden="true" /> : <PanelLeftCloseIcon className="h-[18px] w-[18px]" aria-hidden="true" />}
              {!collapsed && <span>Collapse</span>}
            </button>
          )}
          {/* There is no account system, so this is the author rather than a
              signed-in user. Inventing a profile here would imply a backend that
              does not exist. */}
          <Link
            to="/about"
            className={cn('mt-2 flex items-center gap-3 rounded-xl py-2 hover:bg-subtle', railCollapsed ? 'justify-center' : 'px-2')}
            aria-label={`${developer.name} — about the developer`}
            onClick={isMobile ? close : undefined}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {developer.initials}
            </span>
            {!railCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{developer.shortName}</span>
                <span className="block truncate text-xs text-muted">Developer</span>
              </span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
