import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';
import { NetworkCanvas } from './NetworkCanvas';
import type { NetworkGraphData } from '@blocksense/shared';

export function NetworkGraph({ data }: {data: NetworkGraphData;}) {
  return (
    <ReactFlowProvider>
      <NetworkCanvas data={data} />
    </ReactFlowProvider>);

}