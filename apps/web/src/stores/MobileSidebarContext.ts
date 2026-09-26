import { createContext, useContext } from 'react';

/**
 * Open state for the mobile navigation drawer.
 *
 * The drawer is shared by `Topbar` (which opens it) and `Sidebar` (which renders
 * and closes it), so the state has to live above both of them. It is deliberately
 * not part of `SettingsContext`: unlike the sidebar collapse preference this is
 * transient UI state, and persisting it would reopen the drawer on every load.
 *
 * Exports no components — the provider lives in `MobileSidebarProvider`, so
 * React Fast Refresh keeps working.
 */
export interface MobileSidebarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export function useMobileSidebar(): MobileSidebarContextValue {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) throw new Error('useMobileSidebar must be used within MobileSidebarProvider');
  return ctx;
}
