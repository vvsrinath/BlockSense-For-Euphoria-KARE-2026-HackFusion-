import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildLinks, expandEntity } from '../../services/network';
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

  const addChildren = useCallback(
    (parents: NetworkEntity[]) => {
      setEntities((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        const additions = parents.flatMap((p) => expandEntity(p, data.chain)).filter((c) => !ids.has(c.id));
        return [...prev, ...additions].slice(0, MAX_NODES);
      });
      setExpanded((prev) => {
        const next = new Set(prev);
        parents.forEach((p) => next.add(p.id));
        return next;
      });
    },
    [data.chain]
  );

  const expand = useCallback(
    (id: string) => {
      const parent = entities.find((e) => e.id === id);
      if (parent && !expanded.has(id)) addChildren([parent]);
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
    if (expandableFirstRing.length) addChildren(expandableFirstRing);
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