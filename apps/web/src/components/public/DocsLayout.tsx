import { type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from '@blocksense/shared';
import { docsSections } from '../../data/site';

/**
 * Docs shell: public header, a sticky section sidebar, and the page.
 *
 * Separate from both the marketing layout and the application layout, because
 * documentation needs a table of contents rather than a marketing footer or an
 * app sidebar.
 */
export function DocsLayout({
  children,
  active
}: {
  children: ReactNode;
  /** Route of the current page, so the sidebar can mark it. */
  active: string;
}) {
  const current = docsSections.find((section) => section.to === active);

  return (
    <div className="mx-auto w-full max-w-content px-4 py-10 md:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted">
          <li>
            <Link to="/docs" className="transition-colors duration-150 hover:text-ink">
              Docs
            </Link>
          </li>
          {current && current.to !== '/docs' && (
            <>
              <li aria-hidden="true">
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </li>
              <li className="font-medium text-ink" aria-current="page">
                {current.label}
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Documentation sections" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {docsSections.map((section) => (
              <li key={section.to} className="shrink-0 lg:shrink">
                <NavLink
                  to={section.to}
                  end={section.to === '/docs'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-subtle hover:text-ink'
                    )
                  }>
                  <section.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
