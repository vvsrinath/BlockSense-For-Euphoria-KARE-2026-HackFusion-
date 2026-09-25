import { Link } from 'react-router-dom';
import { BrandLogo } from '@blocksense/ui';
import { footerColumns, externalLinks } from '../../data/site';
import { closing, developer } from '../../data/developer';

/** Public site footer: the full route map, so nothing here is a dead end. */
export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface print:hidden">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <BrandLogo size={26} />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Behavioural analysis of on-chain activity, read live from five chains. No private keys, no
              accounts, no stored data about you.
            </p>
            <p className="mt-3 text-sm text-muted">
              Built by{' '}
              <Link to="/about" className="font-medium text-ink transition-colors duration-150 hover:text-primary">
                {developer.name}
              </Link>
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-[13px] font-semibold text-ink">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted transition-colors duration-150 hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted">
            {closing.tagline} Open source, built for the Euphoria / HackFusion hackathon. Not
            investment, legal, or investigative advice.
          </p>
          <ul className="flex flex-wrap items-center gap-4">
            {externalLinks.map((link) =>
              link.to.startsWith('http') ? (
                <li key={link.to}>
                  <a
                    href={link.to}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-medium text-muted transition-colors duration-150 hover:text-ink">
                    {link.label}
                  </a>
                </li>
              ) : (
                <li key={link.to}>
                  <Link to={link.to} className="text-xs font-medium text-muted transition-colors duration-150 hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
