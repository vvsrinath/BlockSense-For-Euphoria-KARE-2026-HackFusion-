import { ArrowDownIcon } from 'lucide-react';
import { pipeline } from '../../data/marketing';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';

/**
 * The analysis pipeline.
 *
 * Written as a linear chain on purpose: it is genuinely sequential, and each
 * step depends on the one before it. The caveats are the point — they show
 * where the analysis gets weak, which is the same thing the Scope page states
 * in prose.
 */
export function HowItWorks() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="How it works"
          title="From a block to an explanation, in nine steps"
          description="Nothing is stored and nothing is invented. Each step reads live chain data, and each one carries a caveat you should know about."
        />
      </Section>

      <Section className="pt-0">
        <ol className="mx-auto max-w-3xl space-y-3">
          {pipeline.map((step, index) => {
            const Icon = step.icon;
            const last = index === pipeline.length - 1;
            return (
              <li key={step.stage}>
                <div className="flex gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-xs font-semibold tabular-nums text-muted">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-[15px] font-semibold text-ink">{step.stage}</h2>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink">{step.produces}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.note}</p>
                  </div>
                </div>
                {!last && (
                  <div className="flex justify-center py-1" aria-hidden="true">
                    <ArrowDownIcon className="h-4 w-4 text-muted" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Follow one all the way through"
          description="Pick a real transaction and watch each step applied to it, with the real numbers the chain returned."
          primary={{ label: 'Analyze a transaction', to: '/analyze' }}
          secondary={{ label: 'Supported chains', to: '/chains' }}
        />
      </Section>
    </>
  );
}
