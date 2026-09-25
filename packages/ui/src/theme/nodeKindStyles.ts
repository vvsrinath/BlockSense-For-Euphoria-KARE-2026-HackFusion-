import {
  BuildingIcon,
  CircleDotIcon,
  FileCode2Icon,
  LandmarkIcon,
  OctagonAlertIcon,
  ShieldAlertIcon,
  SparklesIcon,
  WalletIcon,
  type LucideIcon
} from 'lucide-react';
import type { NodeKind } from '@blocksense/shared';

/**
 * Visual tokens for network node kinds.
 *
 * Semantics (labels, descriptions) come from `@blocksense/intelligence`; only
 * the icon and colour classes are defined here.
 */
export interface NodeKindStyle {
  icon: LucideIcon;
  dot: string;
  soft: string;
  solid: string;
}

export const nodeKindStyles: Record<NodeKind, NodeKindStyle> = {
  center: { icon: CircleDotIcon, dot: 'bg-primary', soft: 'bg-primary/10 text-primary', solid: 'bg-brand text-white' },
  wallet: { icon: WalletIcon, dot: 'bg-primary', soft: 'bg-primary/10 text-primary', solid: 'bg-primary text-white' },
  exchange: { icon: BuildingIcon, dot: 'bg-orange', soft: 'bg-orange/10 text-orange', solid: 'bg-orange text-white' },
  defi: { icon: LandmarkIcon, dot: 'bg-purple', soft: 'bg-purple/10 text-purple', solid: 'bg-purple text-white' },
  contract: { icon: FileCode2Icon, dot: 'bg-muted', soft: 'bg-subtle text-muted', solid: 'bg-muted text-white' },
  new: { icon: SparklesIcon, dot: 'bg-cyan', soft: 'bg-cyan/10 text-cyan', solid: 'bg-cyan text-white' },
  elevated: { icon: ShieldAlertIcon, dot: 'bg-warning', soft: 'bg-warning/15 text-warning-ink', solid: 'bg-warning text-white' },
  high: { icon: OctagonAlertIcon, dot: 'bg-danger', soft: 'bg-danger/10 text-danger-ink', solid: 'bg-danger text-white' }
};
