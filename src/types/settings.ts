import type { ChainFilter } from './chain';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ViewMode = 'simple' | 'advanced';
export type Currency = 'USD' | 'EUR';
export type TimeFormat = '24h' | '12h';

export interface Settings {
  theme: ThemePreference;
  viewMode: ViewMode;
  defaultChain: ChainFilter;
  currency: Currency;
  timeFormat: TimeFormat;
  sidebarCollapsed: boolean;
  simulateError: boolean;
  rememberSearches: boolean;
}