import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MobileSidebarContext } from './MobileSidebarContext';

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
