import { Link } from 'react-router-dom';
import { Button } from '@blocksense/ui';
import { docsSections, externalLinks } from '../../../data/site';
import { TRON_EXAMPLE_TX } from '../../../data/exampleIdentifiers';

const REPO = 'https://github.com/vvsrinath/BlockSense-For-Euphoria-KARE-2026-HackFusion-';

/** Developer hub. The starting point for anyone wanting to run or build on this. */
export function Docs() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">Documentation</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          BlockSense is a pnpm TypeScript monorepo. The API reads five chains live and serves every view
          in the product over HTTP, so almost anything the interface can do is one request away.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button to="/docs/api">API reference</Button>
          <Button to="/docs/contributing" variant="secondary">
            Run it locally
          </Button>
          <Button to={REPO} target="_blank" rel="noreferrer noopener" variant="ghost">
            GitHub
          </Button>
        </div>
      </header>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Sections</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {docsSections
            .filter((section) => section.to !== '/docs')
            .map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.to}
                  to={section.to}
                  className="group rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors duration-150 hover:border-primary/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink group-hover:text-primary">
                    {section.label}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.description}</p>
                </Link>
              );
            })}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h2 className="text-[15px] font-semibold text-ink">The shortest useful example</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          One request returns a resolved, priced transaction. No key, no sign-up, no database.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-subtle p-4 font-mono text-xs leading-relaxed text-ink">
{`curl {API}/api/v1/transactions/tron/${TRON_EXAMPLE_TX}

# every response uses the same envelope
{
  "success": true,
  "data":   { "chain": "tron", "asset": {}, "anomaly": { "score": 85, "level": "high", "confidence": "low" } },
  "meta":   { "requestId": "req_...", "timestamp": 1790360000000 }
}`}
        </pre>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">Elsewhere</h2>
        <ul className="mt-3 space-y-2">
          {externalLinks.map((link) => (
            <li key={link.to}>
              {link.to.startsWith('http') ? (
                <a href={link.to} target="_blank" rel="noreferrer noopener" className="text-sm font-medium text-primary hover:underline">
                  {link.label}
                </a>
              ) : (
                <Link to={link.to} className="text-sm font-medium text-primary hover:underline">
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
