import { Panel } from '@blocksense/ui';

const LAYERS = [
  {
    name: 'apps/web',
    role: 'React client',
    detail:
      'Vite + React + Tailwind. Talks to the API only — no chain node is ever contacted from the browser. Recent history and the watchlist live in localStorage, so there is no account and nothing to sync.'
  },
  {
    name: 'apps/api',
    role: 'HTTP service',
    detail:
      'A node:http server with a small router, a TTL cache, rate limiting, and Zod validation at the edge. Also the Netlify Function entry point, so it runs on the same origin as the app.'
  },
  {
    name: 'packages/blockchain',
    role: 'Chain adapters',
    detail:
      'One adapter per chain behind a shared base class. The base class derives wallet profiles so behaviour is computed identically everywhere, and each adapter only knows how to read its own chain.'
  },
  {
    name: 'packages/transaction-engine',
    role: 'Detection',
    detail: 'Classifies an identifier as a chain, address, or hash, and rejects anything ambiguous rather than guessing.'
  },
  {
    name: 'packages/intelligence',
    role: 'Analysis',
    detail:
      'Signals, scoring, behavioural DNA, relationships, and explanations. Pure functions with no I/O, so the same analysis runs in the API, the browser, and the tests.'
  },
  {
    name: 'packages/shared',
    role: 'Contracts',
    detail: 'Types, Zod schemas, and constants shared by every layer. One definition of a transaction, so a schema change is caught at compile time.'
  },
  {
    name: 'packages/ui',
    role: 'Design system',
    detail: 'The primitives both apps render with, and the only place that imports Tailwind classes for shared components.'
  }
];

/** How a single request travels, and where each decision is made. */
const REQUEST_PATH = [
  ['Browser', 'service calls the API client, which owns the base URL, the envelope, and error mapping.'],
  ['API edge', 'rate limit, security headers, body size cap, then the router.'],
  ['Cache', 'a fresh entry short-circuits; an expired one is kept as a fallback if the provider fails.'],
  ['Adapter', 'the chain is read live. Ethereum and BNB report NOT_IMPLEMENTED for history when no explorer key is set.'],
  ['Pricing', 'one batched request prices the whole page. An unpriceable asset keeps no value rather than a zero.'],
  ['Intelligence', 'signals, score, level, and confidence, all pure functions over the transaction and its history.'],
  ['Envelope', 'the response is wrapped with a request id, so a failure can be traced without guessing which call it was.']
];

export function Architecture() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">Architecture</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          A pnpm workspace with seven packages. The dependency direction is one-way: the browser depends
          on the API, the API depends on the libraries, and the libraries never depend on the apps.
        </p>
      </header>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Packages</h2>
        <div className="mt-4 space-y-3">
          {LAYERS.map((layer) => (
            <div key={layer.name} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <code className="font-mono text-sm font-semibold text-ink">{layer.name}</code>
                <span className="text-xs text-muted">{layer.role}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{layer.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">A request, end to end</h2>
        <p className="mt-2 text-sm text-muted">
          Seven steps, and each one owns a decision that is deliberately made in a single place.
        </p>
        <ol className="mt-4 space-y-2.5">
          {REQUEST_PATH.map(([stage, detail], index) => (
            <li key={stage} className="flex gap-3 rounded-xl border border-line bg-surface p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{stage}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Three decisions worth explaining</h2>
        <div className="mt-4 space-y-4">
          <Panel title="Adapters derive profiles, not just transactions">
            <p className="text-sm leading-relaxed text-muted">
              Wallet behaviour — typical amount, cadence, counterparties, DNA traits — is computed once in
              the shared base class. An adapter supplies raw history and balances, and nothing else. That
              is why a TRON profile and a Bitcoin profile are described in the same terms, and why adding
              a sixth chain does not mean reimplementing analysis.
            </p>
          </Panel>
          <Panel title="The intelligence layer does no I/O">
            <p className="text-sm leading-relaxed text-muted">
              Scoring and explanation are pure functions over data already in hand. The same code runs in
              the API, in the browser, and in a unit test with no server and no network. It is also why the
              test suite can pin score band boundaries without mocking a single provider.
            </p>
          </Panel>
          <Panel title="The API is a bundle, and so is the deployment">
            <p className="text-sm leading-relaxed text-muted">
              The API imports its workspace packages by TypeScript source path, which a plain{' '}
              <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-xs">node</code> process cannot
              load, so it is bundled to one self-contained file. That same bundle is what the Netlify
              Function runs, which means the artifact that is tested is the artifact that ships.
            </p>
          </Panel>
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Quality gates</h2>
        <p className="mt-2 text-sm text-muted">
          Four commands, all of which run in CI and must pass before a change lands.
        </p>
        <Panel className="mt-4">
          <ul className="space-y-2 font-mono text-xs text-muted">
            <li>pnpm typecheck — no type errors anywhere in the workspace</li>
            <li>pnpm lint — no errors; the two known warnings are Fast Refresh hints in existing files</li>
            <li>pnpm test — the full suite, with providers stubbed and prices stubbed</li>
            <li>pnpm build — both the web bundle and the API bundle</li>
          </ul>
        </Panel>
      </section>
    </div>
  );
}
