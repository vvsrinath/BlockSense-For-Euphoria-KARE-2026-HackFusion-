import { ChainBadge } from '../common/ChainBadge';
import type { ChainInfo } from '../../types/chain';
import { formatNumber } from '../../utils/format';

export function ChainCard({ chain }: {chain: ChainInfo;}) {
  return (
    <div className="min-w-0 px-5 py-4">
      <ChainBadge chain={chain.id} className="font-medium" />
      <p className="mt-3 text-xs text-muted">{chain.latestLabel}</p>
      <p className="mt-0.5 font-mono text-lg font-medium tabular-nums text-ink">{formatNumber(chain.latestHeight)}</p>
      <p className="mt-0.5 text-xs text-muted">{chain.avgBlockTime}</p>
    </div>);

}