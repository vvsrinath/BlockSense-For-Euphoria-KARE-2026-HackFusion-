import { CircleCheckIcon, InfoIcon, OctagonAlertIcon, TriangleAlertIcon, type LucideIcon } from 'lucide-react';
import type { SignalLevel } from '@blocksense/shared';

/**
 * Visual tokens for severity levels.
 *
 * The semantic side of a level (label, severity, headline) lives in
 * `@blocksense/intelligence`; only the presentation lives here.
 */
export interface LevelStyle {
  icon: LucideIcon;
  /** Pill background + text colour. */
  badge: string;
  text: string;
  stroke: string;
  fill: string;
}

export const levelStyles: Record<SignalLevel, LevelStyle> = {
  normal: {
    icon: CircleCheckIcon,
    badge: 'bg-success/10 text-success-ink',
    text: 'text-success-ink',
    stroke: 'stroke-success',
    fill: 'bg-success'
  },
  unusual: {
    icon: TriangleAlertIcon,
    badge: 'bg-warning/15 text-warning-ink',
    text: 'text-warning-ink',
    stroke: 'stroke-warning',
    fill: 'bg-warning'
  },
  high: {
    icon: OctagonAlertIcon,
    badge: 'bg-danger/10 text-danger-ink',
    text: 'text-danger-ink',
    stroke: 'stroke-danger',
    fill: 'bg-danger'
  },
  info: {
    icon: InfoIcon,
    badge: 'bg-primary/10 text-primary',
    text: 'text-primary',
    stroke: 'stroke-primary',
    fill: 'bg-primary'
  }
};
