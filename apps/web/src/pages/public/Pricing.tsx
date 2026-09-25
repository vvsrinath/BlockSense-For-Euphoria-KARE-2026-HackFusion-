import { CheckIcon, MinusIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@blocksense/ui';
import { cn } from '@blocksense/shared';
import { plans } from '../../data/marketing';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';

/**
 * Pricing.
 *
 * Carries no numbers beyond the free tier, because the commercial model is not
 * decided. Publishing invented prices would be a commitment the project has not
 * made, and a wrong figure is harder to walk back than a missing one.
 */
export function Pricing() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Pricing"
          title="Plans for how BlockSense is used"
          description="The tiers below describe what each plan includes. Only the free tier has a number attached: the rest is intentionally unpriced until the model is settled."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col rounded-2xl border bg-surface p-6 shadow-card',
                plan.highlight ? 'border-primary/50 ring-1 ring-primary/20' : 'border-line'
              )}>
              {plan.highlight && (
                <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <SparklesIcon className="h-3 w-3" aria-hidden="true" />
                  Most useful for builders
                </span>
              )}

              <h2 className="text-[15px] font-semibold text-ink">{plan.name}</h2>
              <p className="mt-1 text-xs text-muted">{plan.audience}</p>

              <p className="mt-5 text-2xl font-semibold tracking-tight text-ink">{plan.priceLabel}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{plan.priceNote}</p>

              <p className="mt-4 text-sm leading-relaxed text-muted">{plan.summary}</p>

              <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex gap-2.5">
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        feature.included ? 'bg-success/15 text-success' : 'bg-subtle text-muted'
                      )}>
                      {feature.included ? (
                        <CheckIcon className="h-2.5 w-2.5" aria-hidden="true" />
                      ) : (
                        <MinusIcon className="h-2.5 w-2.5" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className={cn(feature.included ? 'text-ink' : 'text-muted line-through decoration-line')}>
                        {feature.label}
                      </span>
                      {feature.note && <span className="mt-0.5 block text-xs text-muted">{feature.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>

              <Button to={plan.cta.to} variant={plan.highlight ? 'primary' : 'secondary'} className="mt-6 w-full">
                {plan.cta.label}
              </Button>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted">
          Free-tier throughput is bounded by the public endpoints BlockSense reads, which are shared with
          everyone else using them. That ceiling is a property of the infrastructure, not a marketing
          choice, and it is why every plan includes the option to bring your own provider.
        </p>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Not sure which fits?"
          description="Tell us what you are trying to do and we will point you at the plan that matches, including if that is the free one."
          primary={{ label: 'Contact us', to: '/contact' }}
          secondary={{ label: 'Read the docs', to: '/docs' }}
        />
      </Section>
    </>
  );
}
