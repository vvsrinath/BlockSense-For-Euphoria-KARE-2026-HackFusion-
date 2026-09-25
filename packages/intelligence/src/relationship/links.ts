/**
 * Relationship inference.
 *
 * BlockSense labels counterparties as exchanges, DeFi protocols, contracts or
 * plain wallets. These labels come from evidence rather than a hardcoded
 * address list, so they stay useful as new addresses appear.
 */

import type { AnomalyLevel, NetworkEntity, NodeKind } from '@blocksense/shared';

export interface RelationshipEvidence {
  kind: 'known-address' | 'interaction-count' | 'label-similarity' | 'volume';
  weight: number;
  detail: string;
}

export interface RelationshipAssessment {
  address: string;
  kind: NodeKind;
  level: AnomalyLevel;
  evidence: RelationshipEvidence[];
}

/**
 * Interaction thresholds. A wallet contacted a handful of times is a normal
 * counterparty; contacted hundreds of times it is infrastructure.
 */
export const INTERACTION_THRESHOLDS = {
  contract: 25,
  exchange: 10,
  defi: 15
} as const;

export interface RelationshipInput {
  address: string;
  /** How many times the focus wallet interacted with this address. */
  interactionCount: number;
  /** Total USD moved between the two. */
  volumeUsd?: number;
  /** Label supplied by an upstream indexer or the user. */
  knownLabel?: string;
}

/** Classify a single counterparty from its evidence. */
export function assessRelationship(input: RelationshipInput): RelationshipAssessment {
  const evidence: RelationshipEvidence[] = [];
  let kind: NodeKind = 'wallet';
  let level: AnomalyLevel = 'normal';

  if (input.knownLabel) {
    evidence.push({
      kind: 'known-address',
      weight: 1,
      detail: `Labelled "${input.knownLabel}" by an upstream indexer.`
    });
    kind = 'wallet';
  }

  if (input.interactionCount >= INTERACTION_THRESHOLDS.contract) {
    evidence.push({
      kind: 'interaction-count',
      weight: 0.8,
      detail: `${input.interactionCount} interactions suggests an automated contract rather than a person.`
    });
    kind = 'contract';
  }

  if (input.volumeUsd !== undefined && input.volumeUsd > 1_000_000) {
    evidence.push({
      kind: 'volume',
      weight: 0.6,
      detail: `$${Math.round(input.volumeUsd).toLocaleString('en-US')} of total flow is exchange-scale.`
    });
    if (kind === 'wallet') kind = 'exchange';
  }

  if (evidence.length > 2) level = 'unusual';

  return { address: input.address, kind, level, evidence };
}

/** Classify a whole entity list, preserving any parent links. */
export function assessRelationships(inputs: RelationshipInput[]): RelationshipAssessment[] {
  return inputs.map(assessRelationship);
}

/** Convert an assessment into the entity shape the network graph consumes. */
export function toEntity(
  assessment: RelationshipAssessment,
  base: Pick<NetworkEntity, 'label' | 'firstSeen' | 'txCount' | 'totalUsd' | 'relationship' | 'parentId'>
): NetworkEntity {
  return {
    id: assessment.address,
    address: assessment.address,
    label: base.label,
    kind: assessment.kind,
    level: assessment.level,
    firstSeen: base.firstSeen,
    txCount: base.txCount,
    totalUsd: base.totalUsd,
    relationship: base.relationship,
    ...(base.parentId ? { parentId: base.parentId } : {})
  };
}
