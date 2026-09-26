import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Open state for the mobile navigation drawer.
 *
 * The drawer is shared by `Topbar` (which opens it) and `Sidebar` (which renders
 * and closes it), so the state has to live above both of them. It is deliberately
 * not part of `SettingsContext`: unlike the sidebar collapse preference this is
 * transient UI state, and persisting it would reopen the drawer on every load.
 */
interface MobileSidebarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export function MobileSidebarProvider({ children }: { children: React.ReactNode; }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Escape closes the drawer so it behaves like a dialog on the keyboard.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
  return <MobileSidebarContext.Provider value={value}>{children}</MobileSidebarContext.Provider>;
}

export function useMobileSidebar(): MobileSidebarContextValue {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) throw new Error('useMobileSidebar must be used within MobileSidebarProvider');
  return ctx;
}
