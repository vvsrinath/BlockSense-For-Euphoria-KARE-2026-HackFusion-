import { CircleCheckIcon, InfoIcon, OctagonAlertIcon, TriangleAlertIcon, type LucideIcon } from 'lucide-react';
import type { AnomalyLevel, SignalLevel } from '../types/chain';

interface LevelMeta {
  label: string;
  icon: LucideIcon;
  badge: string;
  text: string;
  stroke: string;
  fill: string;
}

export const levelMeta: Record<SignalLevel, LevelMeta> = {
  normal: {
    label: 'Normal',
    icon: CircleCheckIcon,
    badge: 'bg-success/10 text-success-ink',
    text: 'text-success-ink',
    stroke: 'stroke-success',
    fill: 'bg-success'
  },
  unusual: {
    label: 'Unusual',
    icon: TriangleAlertIcon,
    badge: 'bg-warning/15 text-warning-ink',
    text: 'text-warning-ink',
    stroke: 'stroke-warning',
    fill: 'bg-warning'
  },
  high: {
    label: 'High anomaly',
    icon: OctagonAlertIcon,
    badge: 'bg-danger/10 text-danger-ink',
    text: 'text-danger-ink',
    stroke: 'stroke-danger',
    fill: 'bg-danger'
  },
  info: {
    label: 'Info',
    icon: InfoIcon,
    badge: 'bg-primary/10 text-primary',
    text: 'text-primary',
    stroke: 'stroke-primary',
    fill: 'bg-primary'
  }
};

export function scoreToLevel(score: number): AnomalyLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'unusual';
  return 'normal';
}

export function levelHeadline(level: AnomalyLevel): string {
  if (level === 'high') return 'Unusual behavior detected';
  if (level === 'unusual') return 'Some behavior differs from history';
  return 'Behavior matches history';
}