/**
 * Graph construction.
 *
 * Turns a wallet's counterparties into the entity/link graph the UI renders.
 * Expansion is breadth-limited on purpose: an unbounded traversal of a real
 * blockchain will not terminate in a usable amount of time.
 */

import type { NetworkEntity, NetworkGraphData, NetworkLink } from '@blocksense/shared';
import type { ChainId } from '@blocksense/shared';
import { resolveNodeKind } from './nodeKinds';

export interface GraphOptions {
  chain: ChainId;
  centerId: string;
  /** Maximum links to follow outward from the centre. */
  maxDepth?: number;
  /** Hard cap on entities, so a hub account cannot produce a million-node graph. */
  maxEntities?: number;
  now?: number;
}

export const DEFAULT_MAX_DEPTH = 2;
export const DEFAULT_MAX_ENTITIES = 120;

export interface GraphInput {
  entities: NetworkEntity[];
  links: NetworkLink[];
}

/**
 * Prune a graph to a bounded neighbourhood of `centerId`.
 *
 * Links to entities outside the retained set are dropped, so the result is
 * always internally consistent.
 */
export function buildGraph(input: GraphInput, options: GraphOptions): NetworkGraphData {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxEntities = options.maxEntities ?? DEFAULT_MAX_ENTITIES;

  const byId = new Map(input.entities.map((e) => [e.id, e]));
  const depth = new Map<string, number>([[options.centerId, 0]]);
  const queue: string[] = [options.centerId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const currentDepth = depth.get(current) ?? 0;
    if (currentDepth >= maxDepth) continue;

    input.links
      .filter((l) => l.source === current || l.target === current)
      .forEach((link) => {
        const other = link.source === current ? link.target : link.source;
        if (!byId.has(other) || depth.has(other)) return;
        if (depth.size >= maxEntities) return;
        depth.set(other, currentDepth + 1);
        queue.push(other);
      });
  }

  const entities = input.entities.filter((e) => depth.has(e.id));
  const kept = new Set(entities.map((e) => e.id));
  const links = input.links.filter((l) => kept.has(l.source) && kept.has(l.target));

  return { centerId: options.centerId, chain: options.chain, entities, links };
}

/** Recompute an entity's kind so `high` and `new` reflect current evidence. */
export function refreshEntityKind(entity: NetworkEntity, structural: NetworkEntity['kind'], now?: number): NetworkEntity {
  return {
    ...entity,
    kind: resolveNodeKind({
      level: entity.level,
      firstSeen: entity.firstSeen,
      txCount: entity.txCount,
      structural: structural === 'center' || structural === 'high' || structural === 'elevated' || structural === 'new' ? 'wallet' : structural,
      ...(now !== undefined ? { now } : {})
    })
  };
}

/** Total USD volume represented by a graph. */
export function graphVolumeUsd(graph: NetworkGraphData): number {
  return graph.entities.reduce((sum, e) => sum + (Number.isFinite(e.totalUsd) ? e.totalUsd : 0), 0);
}

/** Number of links flagged as suspicious. */
export function flaggedLinkCount(graph: NetworkGraphData): number {
  return graph.links.filter((l) => l.flagged).length;
}
