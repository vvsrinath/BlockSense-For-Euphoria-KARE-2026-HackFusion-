import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type NodeChange,
  type OnSelectionChangeParams } from
'@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence } from 'framer-motion';
import { GitForkIcon, RotateCcwIcon } from 'lucide-react';
import { GraphNode, type EntityNode } from './GraphNode';
import { NodeDetails } from './NodeDetails';
import { useNetworkGraph } from './useNetworkGraph';
import { Button } from '../common/Button';
import { LevelBadge } from '../common/LevelBadge';
import { Panel } from '../common/Panel';
import type { NetworkGraphData } from '../../types/network';
import { cn } from '../../utils/cn';
import { truncateMiddle } from '../../utils/format';
import { NODE_WIDTH, layoutEntities } from '../../utils/graphLayout';
import { nodeKindMeta } from '../../utils/nodeKinds';

const nodeTypes = { entity: GraphNode };

export function NetworkCanvas({ data }: {data: NetworkGraphData;}) {
  const graph = useNetworkGraph(data);
  const { setSelectedId } = graph;
  const { fitView } = useReactFlow();
  const [nodes, setNodes] = useState<EntityNode[]>([]);

  useEffect(() => {
    const placements = layoutEntities(graph.entities, data.centerId);
    setNodes((prev) => {
      const prevPositions = new Map(prev.map((n) => [n.id, n.position]));
      return graph.entities.map((entity) => {
        const p = placements.get(entity.id) ?? { x: 0, y: 0 };
        return {
          id: entity.id,
          type: 'entity' as const,
          position: prevPositions.get(entity.id) ?? { x: p.x - NODE_WIDTH / 2, y: p.y - 28 },
          data: { entity, expanded: graph.expanded.has(entity.id) }
        };
      });
    });
  }, [graph.entities, graph.expanded, data.centerId]);

  useEffect(() => {
    setNodes((nds) => nds.map((n) => n.selected === (n.id === graph.selectedId) ? n : { ...n, selected: n.id === graph.selectedId }));
  }, [graph.selectedId]);

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.2, duration: 200 }), 60);
    return () => clearTimeout(t);
  }, [graph.entities.length, fitView]);

  const edges: Edge[] = useMemo(
    () =>
    graph.links.map((l) => ({
      id: l.id,
      source: l.source,
      target: l.target,
      type: 'straight',
      focusable: false,
      style: l.flagged ?
      { stroke: 'rgb(var(--danger))', strokeWidth: 2, strokeDasharray: '6 4' } :
      { stroke: 'rgb(var(--line-strong))', strokeWidth: Math.min(3, 1 + l.txCount / 150) }
    })),
    [graph.links]
  );

  const onNodesChange = useCallback((changes: NodeChange<EntityNode>[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onSelectionChange = useCallback(({ nodes: selected }: OnSelectionChangeParams) => setSelectedId(selected[0]?.id ?? null), [setSelectedId]);

  const selected = graph.entities.find((e) => e.id === graph.selectedId) ?? null;
  const connections = graph.entities.filter((e) => e.id !== data.centerId);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="relative h-[62vh] min-h-[460px] overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <Button size="sm" variant="soft" icon={GitForkIcon} onClick={graph.expandNetwork} disabled={!graph.canExpandNetwork}>
            Expand network
          </Button>
          <Button size="sm" variant="secondary" icon={RotateCcwIcon} onClick={graph.reset}>
            Reset
          </Button>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onSelectionChange={onSelectionChange}
          nodesConnectable={false}
          elementsSelectable
          minZoom={0.3}
          maxZoom={2}
          fitView
          fitViewOptions={{ padding: 0.2 }}>
          
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgb(var(--line-strong))" />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
        <AnimatePresence>
          {selected &&
          <NodeDetails
            key={selected.id}
            entity={selected}
            chain={data.chain}
            isCenter={selected.id === data.centerId}
            expanded={graph.expanded.has(selected.id)}
            onClose={() => setSelectedId(null)}
            onExpand={() => graph.expand(selected.id)}
            onHide={() => graph.hide(selected.id)} />

          }
        </AnimatePresence>
      </div>

      <Panel
        title={`Connections (${connections.length})`}
        description="The same network as a list. Select one to see details."
        action={
        graph.hiddenCount > 0 ?
        <button type="button" onClick={graph.reset} className="text-[13px] font-medium text-primary hover:underline">
              Restore {graph.hiddenCount} hidden
            </button> :
        undefined
        }>
        
        <ul className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
          {connections.map((e) => {
            const meta = nodeKindMeta[e.kind];
            const active = e.id === graph.selectedId;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ease-out',
                    active ? 'bg-primary/[0.08]' : 'hover:bg-subtle'
                  )}>
                  
                  <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', meta.dot)} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{e.label}</span>
                    <span className="block truncate text-xs text-muted">
                      <span className="font-mono">{truncateMiddle(e.address, 5, 4)}</span> · {e.relationship}
                    </span>
                  </span>
                  {e.level !== 'normal' && <LevelBadge level={e.level} />}
                </button>
              </li>);

          })}
        </ul>
      </Panel>
    </div>);

}