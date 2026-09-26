import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon, MenuIcon } from 'lucide-react';
import { BrandLogo, IconButton } from '@blocksense/ui';

import { SearchBox } from '../search/SearchBox';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { useSettings } from '../../stores/SettingsContext';
import { useMobileSidebar } from '../../stores/MobileSidebarContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { PWAInstall } from './PWAInstall';

export function Topbar() {
  const { resolvedTheme, update } = useSettings();
  const dark = resolvedTheme === 'dark';
  const isMobile = useIsMobile();
  const { isOpen, toggle } = useMobileSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 md:h-16 md:flex-nowrap md:px-6 md:py-0 lg:px-8">
        {isMobile && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
            aria-controls="mobile-nav-drawer"
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <MenuIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <Link to="/home" className="md:hidden" aria-label="BlockSense home">
          <BrandLogo size={26} />
        </Link>
        <div className="order-3 w-full md:order-none md:w-auto md:max-w-3xl md:flex-1">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <PWAInstall />
          {isMobile ? null : <IconButton icon={dark ? SunIcon : MoonIcon} label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => update({ theme: dark ? 'light' : 'dark' })} />}
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
