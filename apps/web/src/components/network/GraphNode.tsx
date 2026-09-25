import '@xyflow/react/dist/style.css';
import React, { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { cn, truncateMiddle } from '@blocksense/shared';
import type { NetworkEntity } from '@blocksense/shared';
import { levelLabel, nodeKindLabel } from '@blocksense/intelligence';
import { levelStyles, nodeKindStyles } from '@blocksense/ui';

export type EntityNodeData = {entity: NetworkEntity;expanded: boolean;};
export type EntityNode = Node<EntityNodeData, 'entity'>;

const hiddenHandle: React.CSSProperties = {
  top: '50%',
  left: '50%',
  opacity: 0,
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: 0,
  pointerEvents: 'none'
};

function GraphNodeInner({ data, selected }: NodeProps<EntityNode>) {
  const { entity } = data;
  const meta = nodeKindStyles[entity.kind];
  const Icon = meta.icon;
  const isCenter = entity.kind === 'center';
  const StatusIcon = levelStyles[entity.level].icon;

  return (
    <div className="flex w-[120px] cursor-pointer flex-col items-center" aria-label={`${entity.label}, ${nodeKindLabel(entity.kind)}, ${levelLabel(entity.level)}`}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full ring-4 transition-[box-shadow,transform] duration-150 ease-out',
          isCenter ? 'h-14 w-14' : 'h-11 w-11',
          meta.solid,
          selected ? 'scale-105 ring-primary/35' : 'ring-surface'
        )}>
        
        <Icon className={isCenter ? 'h-6 w-6' : 'h-[18px] w-[18px]'} aria-hidden="true" />
        {entity.level !== 'normal' &&
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface shadow-card">
            <StatusIcon className={cn('h-3 w-3', levelStyles[entity.level].text)} aria-hidden="true" />
          </span>
        }
        <Handle type="target" position={Position.Top} style={hiddenHandle} isConnectable={false} />
        <Handle type="source" position={Position.Bottom} style={hiddenHandle} isConnectable={false} />
      </div>
      <div className={cn('mt-1.5 max-w-[120px] rounded-md px-1.5 py-0.5 text-center', selected ? 'bg-primary/10' : 'bg-surface/90')}>
        <p className="truncate text-[11px] font-semibold text-ink">{entity.label}</p>
        <p className="font-mono text-[10px] text-muted">{truncateMiddle(entity.address, 5, 4)}</p>
      </div>
    </div>);

}

export const GraphNode = memo(GraphNodeInner);