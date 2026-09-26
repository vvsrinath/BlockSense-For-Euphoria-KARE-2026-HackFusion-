import { createContext, useContext } from 'react';
import type { Settings } from '@blocksense/shared';

/**
 * The settings context and its reader hook.
 *
 * This file deliberately exports no components: the provider lives in
 * `SettingsProvider`, because a file that exports both a component and a hook
 * breaks React Fast Refresh, and because a hook is easier to import when it
 * does not drag a component module along with it.
 */
export interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  resolvedTheme: 'light' | 'dark';
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
