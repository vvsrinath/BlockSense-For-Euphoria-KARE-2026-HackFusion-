import { useEffect, useState } from 'react';
import { ActivityIcon, CircleCheckIcon, CircleXIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react';
import { Button, Panel } from '@blocksense/ui';
import { cn } from '@blocksense/shared';
import { api } from '../../services/api';
import { chains as knownChains } from '../../data/marketing';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';

interface ChainHealth {
  id: string;
  live: boolean;
  status: 'up' | 'down';
  height?: number;
  unit?: string;
  latencyMs?: number;
  error?: string;
}

const NAME: Record<string, string> = Object.fromEntries(knownChains.map((c) => [c.id, c.name]));

/** Capability probes, derived from the same health payload rather than faked. */
const CAPABILITIES = [
  { key: 'lookup', label: 'Transaction lookup', note: 'Single transaction resolution on every chain' },
  { key: 'history', label: 'Wallet history', note: 'Ethereum and BNB need an explorer key configured' },
  { key: 'analysis', label: 'Anomaly analysis', note: 'Scoring, levels, and confidence' },
  { key: 'graph', label: 'Network graph', note: 'One hop around the analysed address' }
];

function dot(status: ChainHealth['status']) {
  if (status === 'up') return { icon: CircleCheckIcon, className: 'text-success', label: 'Operational' };
  return { icon: CircleXIcon, className: 'text-danger', label: 'Unavailable' };
}

/**
 * Live system status.
 *
 * Every row is the API's own answer, polled on a timer. The page reports "no
 * data" when the API cannot be reached rather than showing an optimistic green
 * row, because a status page that lies is worse than no status page.
 */
export function Status() {
  const [data, setData] = useState<{ status: string; checkedAt?: number; chains: ChainHealth[] } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const result = await api.chainHealth();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCheckedAt(Date.now());
          // Deliberately unhurried: this is a public page and the endpoints it
          // reads are shared, rate-limited infrastructure.
          timer = setTimeout(poll, 30_000);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const chains = data?.chains ?? [];
  const allUp = !error && chains.length > 0 && chains.every((c) => c.status === 'up');
  const someDown = !error && chains.some((c) => c.status === 'down');
  const historyLive = chains.filter((c) => NAME[c.id] && c.id !== 'ethereum' && c.id !== 'bnb');

  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Status"
          title="System health, read live"
          description="This page polls the same endpoints the product uses, so what you see here is what a request would actually get. Nothing is cached or hard-coded."
        >
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium',
              error ? 'bg-danger/10 text-danger' : allUp ? 'bg-success/15 text-success' : someDown ? 'bg-warning/15 text-warning-ink' : 'bg-subtle text-muted'
            )}>
            <ActivityIcon className="h-4 w-4" aria-hidden="true" />
            {error ? 'API unreachable' : allUp ? 'All systems operational' : someDown ? 'Partial degradation' : loading ? 'Checking…' : 'No data'}
          </span>
        </PageIntro>
      </Section>

      <Section className="pt-0">
        {error && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-danger/40 bg-danger/[0.06] p-5">
            <div className="flex gap-3">
              <TriangleAlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-ink">The status endpoint could not be reached</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  That usually means the API is down or the page is being served without a working
                  backend. No rows below are shown as healthy, because there is no evidence that they
                  are.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  icon={RefreshCwIcon}
                  variant="secondary"
                  size="sm"
                  className="mt-4">
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        <Panel
          title="Chains"
          description={checkedAt ? `Checked ${new Date(checkedAt).toLocaleTimeString()} · refreshes every 30 seconds` : 'Checking…'}
          bodyClassName="p-0 md:p-0">
          <ul className="divide-y divide-line">
            {knownChains.map((chain) => {
              const health = chains.find((c) => c.id === chain.id);
              const style = health ? dot(health.status) : null;
              const Icon = style?.icon;
              return (
                <li key={chain.id} className="flex items-center gap-3 px-5 py-3.5 md:px-6">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${chain.accent}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{chain.name}</span>
                    {health?.error && <span className="mt-0.5 block truncate text-xs text-danger">{health.error}</span>}
                  </span>
                  {health?.height !== undefined && (
                    <span className="hidden shrink-0 text-right text-xs text-muted sm:block">
                      {health.height.toLocaleString()} {health.unit}
                      {health.latencyMs !== undefined && <span className="ml-2">{health.latencyMs}ms</span>}
                    </span>
                  )}
                  {Icon ? (
                    <span className={cn('inline-flex shrink-0 items-center gap-1.5 text-xs font-medium', style?.className)}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{style?.label}</span>
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted">Unknown</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </Section>

      <Section className="pt-0">
        <Panel title="Capabilities" description="What each part of the product depends on, and whether it is reachable right now.">
          <ul className="divide-y divide-line">
            {CAPABILITIES.map((capability) => {
              const reachable = !error && (capability.key === 'history' ? historyLive.length > 0 : allUp);
              const Icon = reachable ? CircleCheckIcon : CircleXIcon;
              return (
                <li key={capability.key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <Icon
                    className={cn('mt-0.5 h-4 w-4 shrink-0', reachable ? 'text-success' : 'text-muted')}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{capability.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{capability.note}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </Section>

      <Section className="pt-0">
        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-5 text-center shadow-card">
          <p className="text-sm leading-relaxed text-muted">
            Public endpoints are shared with everyone else using them, so a chain can be
            {' '}
            <span className="font-medium text-ink">operational here and still refuse a request</span> under
            load. The product retries with backoff and serves a recent answer when that happens, but if
            you are seeing failures, configure your own provider URL.
          </p>
          <Button to="/chains" variant="soft" size="sm" className="mt-4">
            Per-chain configuration
          </Button>
        </div>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Something looks wrong?"
          description="If a chain reports unavailable while the providers are fine, that is a bug worth reporting with the time you saw it."
          primary={{ label: 'Report an issue', to: '/contact' }}
          secondary={{ label: 'Supported chains', to: '/chains' }}
        />
      </Section>
    </>
  );
}
