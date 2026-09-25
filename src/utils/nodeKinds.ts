import {
  BuildingIcon,
  CircleDotIcon,
  FileCode2Icon,
  LandmarkIcon,
  OctagonAlertIcon,
  SparklesIcon,
  WalletIcon,
  type LucideIcon } from
'lucide-react';
import type { NodeKind } from '../types/network';

interface KindMeta {
  label: string;
  icon: LucideIcon;
  dot: string;
  soft: string;
  solid: string;
}

export const nodeKindMeta: Record<NodeKind, KindMeta> = {
  center: { label: 'Selected wallet', icon: CircleDotIcon, dot: 'bg-primary', soft: 'bg-primary/10 text-primary', solid: 'bg-brand text-white' },
  wallet: { label: 'Wallet', icon: WalletIcon, dot: 'bg-primary', soft: 'bg-primary/10 text-primary', solid: 'bg-primary text-white' },
  exchange: { label: 'Exchange', icon: BuildingIcon, dot: 'bg-orange', soft: 'bg-orange/10 text-orange', solid: 'bg-orange text-white' },
  defi: { label: 'DeFi', icon: LandmarkIcon, dot: 'bg-purple', soft: 'bg-purple/10 text-purple', solid: 'bg-purple text-white' },
  contract: { label: 'Contract', icon: FileCode2Icon, dot: 'bg-muted', soft: 'bg-subtle text-muted', solid: 'bg-muted text-white' },
  new: { label: 'New wallet', icon: SparklesIcon, dot: 'bg-cyan', soft: 'bg-cyan/10 text-cyan', solid: 'bg-cyan text-white' },
  high: { label: 'High-anomaly wallet', icon: OctagonAlertIcon, dot: 'bg-danger', soft: 'bg-danger/10 text-danger-ink', solid: 'bg-danger text-white' }
};

export const legendKinds: NodeKind[] = ['wallet', 'exchange', 'defi', 'contract', 'new', 'high'];