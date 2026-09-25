import { changelog } from '../../data/changelog';
import { PageIntro, Section } from '../../components/public/marketing';

/** Release history, newest first. */
export function Changelog() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Changelog"
          title="What changed, and why"
          description="Entries describe the user-visible consequence rather than a list of modified files. Newest first."
        />
      </Section>

      <Section className="pt-0">
        <ol className="mx-auto max-w-3xl space-y-4">
          {changelog.map((entry) => (
            <li key={entry.version}>
              <article className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-[15px] font-semibold text-ink">Version {entry.version}</h2>
                  <time dateTime={entry.date} className="text-xs text-muted">
                    {entry.date}
                  </time>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">{entry.summary}</p>

                <dl className="mt-5 space-y-3 border-t border-line pt-5">
                  {entry.changes.map((change) => (
                    <div key={change.area} className="grid gap-1 sm:grid-cols-[130px_1fr] sm:gap-4">
                      <dt className="text-xs font-medium text-muted">{change.area}</dt>
                      <dd className="text-sm leading-relaxed text-muted">{change.text}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
