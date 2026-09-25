import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildLinks, getNetwork } from '../../services/network';
import type { NetworkEntity, NetworkGraphData } from '@blocksense/shared';

const MAX_NODES = 40;

export function useNetworkGraph(data: NetworkGraphData) {
  const [entities, setEntities] = useState<NetworkEntity[]>(data.entities);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenCount, setHiddenCount] = useState(0);

  const reset = useCallback(() => {
    setEntities(data.entities);
    setExpanded(new Set());
    setSelectedId(null);
    setHiddenCount(0);
  }, [data.entities]);

  useEffect(() => {
    reset();
  }, [reset]);

  const links = useMemo(() => buildLinks(entities, data.centerId), [entities, data.centerId]);

  /**
   * Expand a node by asking the API for that entity's own neighbourhood.
   *
   * The previous implementation invented child nodes locally. A graph of
   * fabricated counterparties is exactly the kind of thing this product is
   * supposed to help people distrust, so expansion now costs a provider call
   * and returns real addresses or nothing.
   */
  const addChildren = useCallback(
    async (parents: NetworkEntity[]) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        parents.forEach((p) => next.add(p.id));
        return next;
      });

      for (const parent of parents) {
        let graph: Awaited<ReturnType<typeof getNetwork>>;
        try {
          graph = await getNetwork(parent.address, data.chain, 1);
        } catch {
          // A node with no indexable history simply does not expand.
          continue;
        }

        setEntities((prev) => {
          const ids = new Set(prev.map((e) => e.id));
          const additions = graph.entities
            .filter((c) => c.id !== data.centerId && c.id !== parent.id && !ids.has(c.id))
            .map((c) => ({ ...c, parentId: parent.id }));
          if (additions.length === 0) return prev;
          return [...prev, ...additions].slice(0, MAX_NODES);
        });
      }
    },
    [data.chain, data.centerId]
  );

  const expand = useCallback(
    (id: string) => {
      const parent = entities.find((e) => e.id === id);
      if (parent && !expanded.has(id)) void addChildren([parent]);
    },
    [entities, expanded, addChildren]
  );

  const expandableFirstRing = useMemo(
    () =>
    entities.
    filter((e) => e.id !== data.centerId && !e.parentId && !expanded.has(e.id) && e.kind !== 'contract').
    sort((a, b) => b.txCount - a.txCount).
    slice(0, 3),
    [entities, expanded, data.centerId]
  );

  const expandNetwork = useCallback(() => {
    if (expandableFirstRing.length) void addChildren(expandableFirstRing);
  }, [expandableFirstRing, addChildren]);

  const hide = useCallback(
    (id: string) => {
      if (id === data.centerId) return;
      setEntities((prev) => {
        const remove = new Set([id]);
        let changed = true;
        while (changed) {
          changed = false;
          prev.forEach((e) => {
            if (e.parentId && remove.has(e.parentId) && !remove.has(e.id)) {
              remove.add(e.id);
              changed = true;
            }
          });
        }
        setHiddenCount((c) => c + remove.size);
        return prev.filter((e) => !remove.has(e.id));
      });
      setSelectedId(null);
    },
    [data.centerId]
  );

  return {
    entities,
    links,
    expanded,
    selectedId,
    setSelectedId,
    expand,
    hide,
    reset,
    expandNetwork,
    canExpandNetwork: expandableFirstRing.length > 0 && entities.length < MAX_NODES,
    hiddenCount
  };
}