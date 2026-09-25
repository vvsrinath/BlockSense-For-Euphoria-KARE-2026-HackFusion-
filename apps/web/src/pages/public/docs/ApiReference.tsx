import { useMemo, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { cn } from '@blocksense/shared';
import { api } from '../../../services/api';
import { useAsync } from '../../../hooks/useAsync';
import { TRON_EXAMPLE_TX, BTC_EXAMPLE_WALLET } from '../../../data/exampleIdentifiers';
import { ErrorState } from '@blocksense/ui';

/**
 * Per-route documentation.
 *
 * The route *list* is fetched from the API's own index, so a route added to the
 * server shows up here without anyone editing this file. The prose is
 * hand-written, because the server does not know what a route is for.
 */
const DOCS: Record<string, { summary: string; params?: string; example?: string }> = {
  '/api/v1': { summary: 'Service metadata: name, version, limits, and the full route table.' },
  '/api/v1/health': { summary: 'Liveness plus per-chain configuration. Never spends rate-limit quota.', example: 'curl {API}/api/v1/health' },
  '/api/v1/health/chains': {
    summary: 'Per-chain reachability, block height, and latency. This is what the status page renders.',
    example: 'curl {API}/api/v1/health/chains'
  },
  '/api/v1/chains': { summary: 'The five supported chains, with the native symbol and whether each is live.' },
  '/api/v1/search': {
    summary: 'Classify an identifier without fetching it. Detects the chain when it is unambiguous.',
    params: '?query=<address or hash>',
    example: `curl '{API}/api/v1/search?query=${TRON_EXAMPLE_TX}'`
  },
  '/api/v1/transactions/{chain}/{hash}': {
    summary: 'A resolved, priced transaction, with token metadata and the summary a reader sees.',
    params: ':chain · :hash',
    example: `curl {API}/api/v1/transactions/tron/${TRON_EXAMPLE_TX}`
  },
  '/api/v1/transactions/{hash}': {
    summary: 'As above, detecting the chain from the hash format. Ambiguous hashes are rejected rather than guessed.',
    example: `curl {API}/api/v1/transactions/${TRON_EXAMPLE_TX}`
  },
  '/api/v1/wallets/{chain}/{address}': {
    summary: 'A behavioural profile: totals, cadence, counterparties, and DNA traits derived from history.',
    params: ':chain · :address',
    example: `curl {API}/api/v1/wallets/bitcoin/${BTC_EXAMPLE_WALLET}`
  },
  '/api/v1/wallets/{chain}/{address}/history': {
    summary: 'Recent transactions, newest first, each priced where the asset is known.',
    params: '?limit= (1–200) · ?since= · ?until=',
    example: `curl '{API}/api/v1/wallets/bitcoin/${BTC_EXAMPLE_WALLET}/history?limit=25'`
  },
  '/api/v1/wallets/{chain}/{address}/assets': {
    summary: 'Holdings for the address, from the balances read rather than the profile.',
    example: `curl {API}/api/v1/wallets/bitcoin/${BTC_EXAMPLE_WALLET}/assets`
  },
  '/api/v1/wallets/{chain}/{address}/network': {
    summary: 'A graph around the address. One hop today; depth is validated and capped, not yet walked.',
    params: '?depth= (1–3)',
    example: `curl '{API}/api/v1/wallets/bitcoin/${BTC_EXAMPLE_WALLET}/network?depth=2'`
  },
  '/api/v1/wallets/{chain}/{address}/balances': {
    summary: 'Current balances. Needs no explorer key on any chain.',
    example: `curl {API}/api/v1/wallets/ethereum/0x28C6c06298d514Db089934071355E5743bf21d60/balances`
  },
  '/api/v1/wallets/{address}': { summary: 'As above, detecting the chain from the address format.' },
  '/api/v1/wallets/{address}/history': { summary: 'As above, detecting the chain from the address format.' },
  '/api/v1/wallets/{address}/network': { summary: 'As above, detecting the chain from the address format.' },
  '/api/v1/assets/{chain}/{identifier}': { summary: 'A single asset by contract address or symbol.' },
  '/api/v1/assets/{identifier}': { summary: 'As above, detecting the chain from the identifier.' },
  '/api/v1/analyze': {
    summary: 'Score a transaction and return the analysis, with signals, level, and confidence.',
    params: 'POST { "chain": "tron", "hash": "…" }',
    example: `curl -X POST {API}/api/v1/analyze -H 'content-type: application/json' -d '{"chain":"tron","hash":"${TRON_EXAMPLE_TX}"}'`
  },
  '/api/v1/reports': { summary: 'List reports, or create one. Held in process memory, so they do not survive a restart.' },
  '/api/v1/reports/{id}': { summary: 'A single report by id.' }
};

/** Error codes, so an integrator can branch without parsing prose. */
const CODES = [
  ['INVALID_REQUEST', 'The body or query could not be parsed.'],
  ['INVALID_ADDRESS', 'The address is not valid for the chain given.'],
  ['INVALID_TRANSACTION_HASH', 'The hash is not valid for the chain given.'],
  ['UNSUPPORTED_CHAIN', 'Not one of the five supported chains.'],
  ['TRANSACTION_NOT_FOUND', 'The chain answered, and has no such transaction.'],
  ['RATE_LIMITED', 'Too many requests from this client.'],
  ['RPC_RATE_LIMITED', 'The upstream provider is throttling us. Retried before it is reported.'],
  ['RPC_UNAVAILABLE', 'The upstream provider could not be reached.'],
  ['RPC_TIMEOUT', 'The upstream provider did not answer in time.'],
  ['NOT_IMPLEMENTED', 'Real and expected: this data needs a provider key that is not configured.'],
  ['NETWORK_LIMIT_EXCEEDED', 'The requested graph depth or size exceeds the documented cap.']
];

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(String(children).replace('{API}', window.location.origin));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="group relative mt-3 block w-full overflow-x-auto rounded-xl bg-subtle p-4 text-left font-mono text-xs leading-relaxed text-ink">
      {String(children).replace('{API}', window.location.origin)}
      <span className="absolute right-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {copied ? <CheckIcon className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : <CopyIcon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />}
      </span>
    </button>
  );
}

export function ApiReference() {
  const { data, status, error, retry } = useAsync(() => api.index(), 'api-index');
  const routes = useMemo(() => data?.routes ?? [], [data]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">API reference</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          No key is required. The API is served from the same origin as this site, so a relative URL is
          enough to get started. Responses always use the same envelope, and errors always carry a code
          from the table below.
        </p>
      </header>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Response envelope</h2>
        <p className="mt-2 text-sm text-muted">Success:</p>
        <Code>{`{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "req_...", "timestamp": 1790360000000 }
}`}</Code>
        <p className="mt-4 text-sm text-muted">Failure:</p>
        <Code>{`{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "No route for GET /api/v1/nope." },
  "meta": { "requestId": "req_...", "timestamp": 1790360000000 }
}`}</Code>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Routes</h2>
        <p className="mt-2 text-sm text-muted">
          {status === 'loading'
            ? 'Loading the live route table…'
            : `Fetched from the running API (v${data?.version ?? '?'}), so this list cannot fall out of date.`}
        </p>

        {status === 'loading' && (
          <ul className="mt-4 space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-surface/60" />
            ))}
          </ul>
        )}
        {status === 'error' && <ErrorState error={error} onRetry={retry} className="py-8" />}

        {routes.length > 0 && (
          <ul className="mt-4 space-y-3">
            {routes.map((route) => {
              const doc = DOCS[route.path];
              return (
                <li key={`${route.method} ${route.path}`} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold',
                        route.method === 'GET' ? 'bg-primary/10 text-primary' : 'bg-success/15 text-success'
                      )}>
                      {route.method}
                    </span>
                    <code className="font-mono text-sm text-ink">{route.path}</code>
                  </div>
                  {doc?.summary && <p className="mt-2.5 text-sm leading-relaxed text-muted">{doc.summary}</p>}
                  {doc?.params && (
                    <p className="mt-2 text-xs text-muted">
                      <span className="font-medium text-ink">Parameters:</span> <code className="font-mono">{doc.params}</code>
                    </p>
                  )}
                  {!doc && (
                    <p className="mt-2.5 text-sm text-muted">
                      Available on this deployment. See the route list above for the shape.
                    </p>
                  )}
                  {doc?.example && <Code>{doc.example}</Code>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Error codes</h2>
        <p className="mt-2 text-sm text-muted">
          Branch on the code, not the message. Messages are written for people and may change.
        </p>
        <Panel className="mt-4" bodyClassName="p-0 md:p-0">
          <ul className="divide-y divide-line">
            {CODES.map(([code, meaning]) => (
              <li key={code} className="grid gap-1 px-5 py-3 sm:grid-cols-[220px_1fr] sm:gap-4 md:px-6">
                <code className="font-mono text-xs text-ink">{code}</code>
                <span className="text-sm text-muted">{meaning}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Limits</h2>
        {data && (
          <Panel className="mt-4" bodyClassName="p-0 md:p-0">
            <ul className="divide-y divide-line">
              {[
                ['Cache TTL', `${data.limits.cacheTtlSeconds}s`],
                ['Max graph nodes', String(data.limits.maxGraphNodes)],
                ['Max graph edges', String(data.limits.maxGraphEdges)],
                ['Provider timeout', `${data.limits.requestTimeoutMs}ms`]
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between px-5 py-3 text-sm md:px-6">
                  <span className="text-muted">{label}</span>
                  <code className="font-mono text-xs text-ink">{value}</code>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">A note on throttling</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Chains are read from public endpoints, which are shared and rate limited. A request that gets
          <span className="font-medium text-ink"> RPC_RATE_LIMITED</span> has already been retried with
          backoff, and a recent cached answer is served rather than an error where one exists. For
          anything sustained, set a provider URL per chain — the variables are listed on the
          supported chains page.
        </p>
      </section>
    </div>
  );
}
