import { NavLink } from "react-router-dom";
import { cn } from '@blocksense/shared';
import { type LucideIcon } from "lucide-react";
interface SidebarLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
}
export function SidebarLink({
  to,
  label,
  icon: Icon,
  collapsed
}: SidebarLinkProps) {
  return <NavLink to={to} title={collapsed ? label : undefined} className={({
    isActive
  }) => cn('flex h-10 items-center gap-3 rounded-xl text-sm font-medium transition-[background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50', collapsed ? 'justify-center px-0' : 'px-3', isActive ? 'bg-primary/[0.08] text-primary' : 'text-muted hover:bg-subtle hover:text-ink')}>
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
    </NavLink>;
}