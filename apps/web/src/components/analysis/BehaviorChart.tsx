import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getBehaviorSeries } from '../../services/wallets';
import { ErrorState, Panel, Segmented, Skeleton } from '@blocksense/ui';

import { useSettings } from '../../stores/SettingsContext';
import { useAsync } from '../../hooks/useAsync';
import { cn, formatMoney, formatNumber } from '@blocksense/shared';
import type { BehaviorMetric, BehaviorPoint, BehaviorRange } from '@blocksense/shared';
import { chartPalette } from '@blocksense/intelligence';

interface BehaviorChartProps {
  address: string;
  title?: string;
  description?: string;
  className?: string;
}

const ranges: {value: BehaviorRange;label: string;}[] = ['7D', '30D', '90D', '1Y', 'ALL'].map((r) => ({ value: r as BehaviorRange, label: r }));
const metrics: {value: BehaviorMetric;label: string;}[] = [
{ value: 'frequency', label: 'Frequency' },
{ value: 'average', label: 'Avg. amount' },
{ value: 'volume', label: 'Volume' }];

const keys: Record<BehaviorMetric, {in: keyof BehaviorPoint;out: keyof BehaviorPoint;}> = {
  frequency: { in: 'inCount', out: 'outCount' },
  average: { in: 'inAvg', out: 'outAvg' },
  volume: { in: 'inVolume', out: 'outVolume' }
};

export function BehaviorChart({ address, title = 'Behavior over time', description = 'Incoming vs outgoing activity', className }: BehaviorChartProps) {
  const { settings, resolvedTheme } = useSettings();
  const [range, setRange] = useState<BehaviorRange>('30D');
  const [metric, setMetric] = useState<BehaviorMetric>('frequency');
  const { data, status, error, retry } = useAsync(() => getBehaviorSeries(address, range), `${address}:${range}`);
  const palette = chartPalette[resolvedTheme];
  const k = keys[metric];

  const format = (v: number) => metric === 'frequency' ? formatNumber(v) : formatMoney(v, settings.currency, { compact: v >= 10000 });

  const totals = useMemo(() => {
    if (!data?.length) return { in: 0, out: 0 };
    const sum = (key: keyof BehaviorPoint) => data.reduce((acc, p) => acc + Number(p[key]), 0);
    if (metric === 'average') return { in: sum(k.in) / data.length, out: sum(k.out) / data.length };
    return { in: sum(k.in), out: sum(k.out) };
  }, [data, metric, k.in, k.out]);

  const metricNoun = metric === 'frequency' ? 'transactions' : metric === 'average' ? 'average per transfer' : 'total volume';

  return (
    <Panel
      title={title}
      description={description}
      className={className}
      action={<Segmented options={ranges} value={range} onChange={setRange} label="Time range" />}>
      
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.incoming }} aria-hidden="true" />
              Incoming
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{format(totals.in)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.outgoing }} aria-hidden="true" />
              Outgoing
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{format(totals.out)}</p>
          </div>
          <p className="hidden self-end pb-1 text-xs text-muted sm:block">{metricNoun}</p>
        </div>
        <Segmented options={metrics} value={metric} onChange={setMetric} label="Metric" />
      </div>

      <div className="mt-5 h-[240px]">
        {status === 'error' ?
        <ErrorState error={error} onRetry={retry} className="py-0" /> :
        !data ?
        <Skeleton className="h-full w-full" /> :

        <div
          className={cn('h-full transition-opacity duration-150 ease-out', status === 'loading' && 'opacity-60')}
          role="img"
          aria-label={`${title}: incoming ${format(totals.in)}, outgoing ${format(totals.out)} ${metricNoun} over ${range}.`}>
          
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis
                tick={{ fill: palette.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => metric === 'frequency' ? String(v) : formatMoney(v, settings.currency, { compact: true })} />
              
                <Tooltip
                cursor={{ stroke: palette.grid }}
                contentStyle={{ background: palette.surface, border: `1px solid ${palette.grid}`, borderRadius: 12, fontSize: 12, color: palette.ink }}
                labelStyle={{ color: palette.ink, fontWeight: 600, marginBottom: 4 }}
                formatter={(value) => format(Number(value))} />
              
                <Line type="monotone" dataKey={k.in} name="Incoming" stroke={palette.incoming} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                <Line type="monotone" dataKey={k.out} name="Outgoing" stroke={palette.outgoing} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        }
      </div>
    </Panel>);

}