import {
  CoinsIcon,
  FileTextIcon,
  HouseIcon,
  NetworkIcon,
  ScanSearchIcon,
  StarIcon,
  WalletIcon,
  type LucideIcon } from
'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
{ to: '/home', label: 'Home', shortLabel: 'Home', icon: HouseIcon },
{ to: '/analyze', label: 'Analyze', shortLabel: 'Analyze', icon: ScanSearchIcon },
{ to: '/wallet', label: 'Wallet Analysis', shortLabel: 'Wallet', icon: WalletIcon },
{ to: '/network', label: 'Network Graph', shortLabel: 'Network', icon: NetworkIcon },
{ to: '/assets', label: 'Assets & Tokens', shortLabel: 'Assets', icon: CoinsIcon },
{ to: '/watchlist', label: 'Watchlist', shortLabel: 'Watchlist', icon: StarIcon },
{ to: '/reports', label: 'Reports', shortLabel: 'Reports', icon: FileTextIcon }];