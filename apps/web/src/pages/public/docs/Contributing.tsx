import { Panel } from '@blocksense/ui';

const REPO = 'https://github.com/vvsrinath/BlockSense-For-Euphoria-KARE-2026-HackFusion-';

const GOOD_FIRST = [
  {
    title: 'A sixth chain adapter',
    body: 'Extend BaseAdapter for history, balances, and a transaction builder. The profile and DNA logic is already shared, so this is mostly decoding.'
  },
  {
    title: 'Deeper graph expansion',
    body: 'Depth is validated and capped at 3, but expansion is one hop. Walking outward with the existing node and edge caps is a contained change.'
  },
  {
    title: 'Token metadata fallbacks',
    body: 'Two chain adapters still read metadata from a contract call alone. Widening the fallback keeps amounts correct when a node drops a request.'
  },
  {
    title: 'Tests for uncovered adapters',
    body: 'The suite covers the TRON decoders, the EVM explorer path, pricing, and resilience. Bitcoin and the Solana history path are thinner and would welcome fixtures.'
  }
];

/** Contributing guide. */
export function Contributing() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">Contributing</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          The project is open source and the roadmap is public. Everything below runs locally with Node 20
          and pnpm, and no provider key is needed to get a working product.
        </p>
      </header>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Run it locally</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-subtle p-4 font-mono text-xs leading-relaxed text-ink">
{`git clone ${REPO}.git
cd BlockSense

pnpm install

# terminal 1 — the API, on :3000
pnpm dev:api

# terminal 2 — the app, on :5173
pnpm dev`}
        </pre>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The Vite dev server proxies <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-xs">/api</code> to
          the API, so the two run on different ports in development and one origin in production.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Before you open a pull request</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-subtle p-4 font-mono text-xs leading-relaxed text-ink">
{`pnpm typecheck
pnpm lint
pnpm test
pnpm build`}
        </pre>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          All four must pass. The suite never contacts a provider: adapters are installed as fixtures and
          the price service is swapped for an offline one, so a test run does not depend on a third party
          being up.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">What a good change looks like</h2>
        <ul className="mt-3 space-y-3">
          {[
            'Tests that fail before the fix and pass after it. For a bug, pin the exact input that broke.',
            'A comment explaining why, where the reason is not obvious from the code. Especially for chain quirks — they are not discoverable.',
            'Honest handling of anything unknown. An unpriceable asset stays unpriced; a missing key returns NOT_IMPLEMENTED rather than an empty result.',
            'No new runtime dependency without a reason in the description. The bundle is deliberately self-contained.'
          ].map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Where help is most wanted</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {GOOD_FIRST.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Panel title="Reporting a bug">
          <p className="text-sm leading-relaxed text-muted">
            Open an issue with what you did, what you expected, and what happened instead. If it involves a
            specific chain, include the transaction hash or address — most chain bugs are only reproducible
            against a real one. Security issues should go to the private route on the{' '}
            <a href="/security" className="font-medium text-primary hover:underline">
              security page
            </a>{' '}
            rather than a public issue.
          </p>
        </Panel>
      </section>
    </div>
  );
}
