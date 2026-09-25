import { Link } from "react-router-dom";
import { PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon, BoxIcon } from "lucide-react";
import { BrandLogo } from '@blocksense/ui';
import { SidebarLink } from "./SidebarLink";
import { useSettings } from '../../stores/SettingsContext';
import { primaryNav } from "../../data/navigation";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { cn } from '@blocksense/shared';
import { developer } from '../../data/developer';
export function Sidebar() {
  const {
    settings,
    update
  } = useSettings();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const collapsed = !isDesktop || settings.sidebarCollapsed;
  return <aside aria-label="Main navigation" className={cn('sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ease-out md:flex print:hidden', collapsed ? 'w-[72px]' : 'w-[240px]')}>
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center' : 'px-5')}>
        <Link to="/" aria-label="BlockSense — back to landing page" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          <BrandLogo variant={collapsed ? 'mark' : 'full'} size={28} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {primaryNav.map((item) => <li key={item.to}>
              <SidebarLink to={item.to} label={item.label} icon={item.icon} collapsed={collapsed} />
            </li>)}
        </ul>
      </nav>

      <div className="space-y-0.5 border-t border-line px-3 py-3">
        <SidebarLink to="/settings" label="Settings" icon={SettingsIcon} collapsed={collapsed} />
        <SidebarLink to="/help" label="Help" icon={BoxIcon} collapsed={collapsed} />
        {isDesktop && <button type="button" onClick={() => update({
        sidebarCollapsed: !settings.sidebarCollapsed
      })} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className={cn('flex h-10 w-full items-center gap-3 rounded-xl text-sm font-medium text-muted transition-[background-color,color] duration-150 ease-out hover:bg-subtle hover:text-ink', collapsed ? 'justify-center' : 'px-3')}>
            {collapsed ? <PanelLeftOpenIcon className="h-[18px] w-[18px]" aria-hidden="true" /> : <PanelLeftCloseIcon className="h-[18px] w-[18px]" aria-hidden="true" />}
            {!collapsed && <span>Collapse</span>}
          </button>}
        {/* There is no account system, so this is the author rather than a
            signed-in user. Inventing a profile here would imply a backend that
            does not exist. */}
        <Link
          to="/about"
          className={cn('mt-2 flex items-center gap-3 rounded-xl py-2 hover:bg-subtle', collapsed ? 'justify-center' : 'px-2')}
          aria-label={`${developer.name} — about the developer`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {developer.initials}
          </span>
          {!collapsed && <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{developer.shortName}</span>
              <span className="block truncate text-xs text-muted">Developer</span>
            </span>}
        </Link>
      </div>
    </aside>;
}