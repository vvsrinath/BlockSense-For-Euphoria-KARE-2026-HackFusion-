import { Link } from "react-router-dom";
import { PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon, BoxIcon } from "lucide-react";
import { BrandLogo } from "../brand/BrandLogo";
import { SidebarLink } from "./SidebarLink";
import { useSettings } from "../../contexts/SettingsContext";
import { primaryNav } from "../../data/navigation";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { cn } from "../../utils/cn";
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
        <Link to="/settings" className={cn('mt-2 flex items-center gap-3 rounded-xl py-2 hover:bg-subtle', collapsed ? 'justify-center' : 'px-2')} aria-label="Alex Morgan — profile and settings">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">AM</span>
          {!collapsed && <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">Alex Morgan</span>
              <span className="block truncate text-xs text-muted">Demo workspace</span>
            </span>}
        </Link>
      </div>
    </aside>;
}