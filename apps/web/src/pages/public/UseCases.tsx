import { useCases } from '../../data/marketing';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';

/**
 * Use cases.
 *
 * Written as a problem and how it is answered, rather than a list of industry
 * labels. Every "how" is something the product does today.
 */
export function UseCases() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Use cases"
          title="What people actually need this for"
          description="Eight situations where behavioural context on an address answers a question a decoded transaction cannot."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-2">
          {useCases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <div key={useCase.title} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-[15px] font-semibold text-ink">{useCase.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink">{useCase.problem}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{useCase.how}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Is your use case missing?"
          description="If the question you are trying to answer needs behavioural context, it is probably answerable here. Tell us what it is."
          primary={{ label: 'Get in touch', to: '/contact' }}
          secondary={{ label: 'See the scope', to: '/scope' }}
        />
      </Section>
    </>
  );
}
