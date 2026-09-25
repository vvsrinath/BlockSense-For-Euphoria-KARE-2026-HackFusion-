import { useState } from 'react';
import { PlayIcon, TerminalIcon } from 'lucide-react';
import { Button, Panel } from '@blocksense/ui';
import { cn } from '@blocksense/shared';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { TRON_EXAMPLE_TX } from '../data/exampleIdentifiers';

interface Route {
  method: string;
  path: string;
}

interface Sample {
  label: string;
  method: string;
  path: string;
}

const SAMPLES: Sample[] = [
  { label: 'Health', method: 'GET', path: '/health' },
  { label: 'Chain status', method: 'GET', path: '/health/chains' },
  { label: 'Supported chains', method: 'GET', path: '/chains' },
  { label: 'Classify an id', method: 'GET', path: `/search?query=${TRON_EXAMPLE_TX}` },
  { label: 'A transaction', method: 'GET', path: `/transactions/tron/${TRON_EXAMPLE_TX}` },
  { label: 'Analyze it', method: 'POST', path: '/analyze' }
];

function bodyFor(route: { method: string; path: string }): string | undefined {
  return route.method === 'POST' ? JSON.stringify({ chain: 'tron', hash: TRON_EXAMPLE_TX }, null, 2) : undefined;
}

/**
 * In-app API console.
 *
 * Sends real requests to the running API from the browser, so the route table
 * cannot drift from the server and a developer can confirm the API works
 * without leaving the app or reading a terminal.
 */
export function ApiConsole() {
  const { data } = useAsync(() => api.index(), 'api-console-index');
  const [selected, setSelected] = useState<Sample>(SAMPLES[0]!);
  const [path, setPath] = useState<string>(SAMPLES[0].path);
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const routes: Route[] = data?.routes ?? [];
  const method = selected.method;

  const send = async () => {
    setBusy(true);
    setResponse(null);
    setStatus(null);
    try {
      const res = await fetch(`/api/v1${path}`, {
        method,
        headers: { accept: 'application/json', ...(method === 'POST' ? { 'content-type': 'application/json' } : {}) },
        ...(method === 'POST' ? { body: bodyFor({ method, path }) } : {})
      });
      setStatus(res.status);
      setResponse(JSON.stringify(await res.json(), null, 2));
    } catch (err) {
      setResponse(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-5xl">
        <PageHeader
          title="API"
          description="Every view in BlockSense is one HTTP call. Send real requests against the running API."
          meta={
            data ? (
              <span className="text-xs text-muted">
                v{data.version} · {routes.length} routes · {data.dataSource} data
              </span>
            ) : null
          }
        />

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Panel title="Try it" bodyClassName="p-3 md:p-3">
            <ul className="space-y-1">
              {SAMPLES.map((sample) => (
                <li key={sample.label}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(sample);
                      setPath(sample.path);
                    }}
                    className={cn(
                      'w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150',
                      selected.label === sample.label ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-subtle hover:text-ink'
                    )}>
                    {sample.label}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="space-y-4">
            <Panel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <span className="flex h-10 items-center rounded-xl bg-primary/10 px-3 font-mono text-xs font-semibold text-primary">
                  {method}
                </span>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  aria-label="Request path"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 font-mono text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                />
                <Button onClick={send} icon={PlayIcon} disabled={busy}>
                  {busy ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </Panel>

            <Panel
              title="Response"
              action={
                status !== null ? (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      status < 300 ? 'bg-success/15 text-success' : 'bg-danger/10 text-danger'
                    )}>
                    {status}
                  </span>
                ) : null
              }>
              {response === null ? (
                <p className="flex items-center gap-2 py-2 text-sm text-muted">
                  <TerminalIcon className="h-4 w-4" aria-hidden="true" />
                  Send a request to see the response.
                </p>
              ) : (
                <pre className="max-h-[420px] overflow-auto rounded-xl bg-subtle p-4 font-mono text-xs leading-relaxed text-ink">
                  {response}
                </pre>
              )}
            </Panel>

            <Panel title="All routes" description="Fetched from the running API, so this list is always accurate.">
              <ul className="divide-y divide-line">
                {routes.map((route) => (
                  <li key={`${route.method} ${route.path}`} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                    <span
                      className={cn(
                        'w-11 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold',
                        route.method === 'GET' ? 'bg-primary/10 text-primary' : 'bg-success/15 text-success'
                      )}>
                      {route.method}
                    </span>
                    <code className="truncate font-mono text-xs text-ink">{route.path}</code>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
