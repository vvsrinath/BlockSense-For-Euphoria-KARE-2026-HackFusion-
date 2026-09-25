/**
 * Network node semantics.
 *
 * Headless: labels and ordering only. Icons and Tailwind classes for these
 * kinds live in `apps/web/src/theme/nodeKindStyles.ts`, so this package stays
 * usable from the API and from tests.
 */

import type { NodeKind } from '@blocksense/shared';

export interface NodeKindInfo {
  kind: NodeKind;
  label: string;
  /** One-line description used in tooltips and legends. */
  description: string;
}

export const NODE_KIND_INFO: Record<NodeKind, NodeKindInfo> = {
  center: { kind: 'center', label: 'Selected wallet', description: 'The wallet under investigation.' },
  wallet: { kind: 'wallet', label: 'Wallet', description: 'An externally owned address.' },
  exchange: { kind: 'exchange', label: 'Exchange', description: 'A known trading venue or custodian.' },
  defi: { kind: 'defi', label: 'DeFi', description: 'A lending, DEX or staking protocol.' },
  contract: { kind: 'contract', label: 'Contract', description: 'A smart contract, not a person.' },
  new: { kind: 'new', label: 'New wallet', description: 'First seen recently.' },
  high: { kind: 'high', label: 'High-anomaly wallet', description: 'Scored as high risk.' }
};

/** Kinds shown in the graph legend, in display order. Excludes the center node. */
export const LEGEND_KINDS: NodeKind[] = ['wallet', 'exchange', 'defi', 'contract', 'new', 'high'];

export function nodeKindLabel(kind: NodeKind): string {
  return NODE_KIND_INFO[kind].label;
}

/**
 * Choose the kind that best describes an entity.
 *
 * `high` wins over the structural kind because it is the reason an analyst is
 * looking at the node; `center` is assigned by the caller, not inferred.
 */
export function resolveNodeKind(input: {
  level: 'normal' | 'unusual' | 'high';
  firstSeen: number;
  txCount: number;
  structural: Exclude<NodeKind, 'center' | 'high' | 'new'>;
  now?: number;
  newAfterDays?: number;
}): NodeKind {
  if (input.level === 'high') return 'high';
  const ageDays = input.firstSeen ? ((input.now ?? Date.now()) - input.firstSeen) / 86_400_000 : Infinity;
  const newAfterDays = input.newAfterDays ?? 30;
  if (ageDays <= newAfterDays && input.txCount <= 5) return 'new';
  return input.structural;
}
