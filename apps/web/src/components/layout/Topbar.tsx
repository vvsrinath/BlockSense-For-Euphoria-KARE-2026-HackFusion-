import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon } from 'lucide-react';
import { BrandLogo, IconButton } from '@blocksense/ui';

import { SearchBox } from '../search/SearchBox';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { useSettings } from '../../stores/SettingsContext';

export function Topbar() {
  const { resolvedTheme, update } = useSettings();
  const dark = resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 md:h-16 md:flex-nowrap md:px-6 md:py-0 lg:px-8">
        <Link to="/home" className="md:hidden" aria-label="BlockSense home">
          <BrandLogo size={26} />
        </Link>
        <div className="order-3 w-full md:order-none md:w-auto md:max-w-3xl md:flex-1">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <IconButton icon={dark ? SunIcon : MoonIcon} label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => update({ theme: dark ? 'light' : 'dark' })} />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>);

}