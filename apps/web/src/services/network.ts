import { api } from './api';
import { detectInput } from '@blocksense/blockchain';
import type { ChainId, NetworkEntity, NetworkGraphData, NetworkLink } from '@blocksense/shared';

/**
 * Derive edges from a parent/child entity list.
 *
 * The API already returns links, but the graph view expands nodes locally, and a
 * newly added entity has no server-side link yet. Deriving edges from
 * `parentId` keeps the two representations consistent.
 */
export function buildLinks(entities: NetworkEntity[], centerId: string): NetworkLink[] {
  return entities
    .filter((e) => e.id !== centerId)
    .map((e) => {
      const source = e.parentId ?? centerId;
      return {
        id: `${source}->${e.id}`,
        source,
        target: e.id,
        txCount: e.txCount,
        volumeUsd: e.totalUsd,
        flagged: e.level === 'high' || e.kind === 'high'
      };
    });
}

/** Fetch the counterparty graph for an address. */
export async function getNetwork(address: string, chain?: ChainId, depth = 2): Promise<NetworkGraphData> {
  const resolved = chain ?? detectInput(address).chains[0] ?? 'ethereum';
  return api.network(resolved, address, depth);
}
