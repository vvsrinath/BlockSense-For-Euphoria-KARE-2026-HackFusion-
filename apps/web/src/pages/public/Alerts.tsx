import { BellRingIcon, CheckIcon, ClockIcon } from 'lucide-react';
import { Button, Panel } from '@blocksense/ui';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';

const PLANNED = [
  {
    title: 'A watched wallet crosses a score threshold',
    body: 'An alert when a transaction on a watchlist address produces an elevated or high score, with the signal that fired attached.'
  },
  {
    title: 'A wallet becomes active again',
    body: 'Useful for dormant treasury addresses, where the first movement in months is the interesting event.'
  },
  {
    title: 'A new counterparty appears',
    body: 'The first time a wallet transacts with an address it has never touched before.'
  },
  {
    title: 'Delivery by webhook or email',
    body: 'A stable endpoint to POST to, so alerts can land in an existing system rather than another inbox.'
  }
];

/**
 * Alerts.
 *
 * Deliberately a description of intent rather than a working toggle. A settings
 * switch that silently does nothing is worse than an honest page saying the
 * feature is on the roadmap, and the roadmap is public.
 */
export function Alerts() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Alerts"
          title="Alerts are on the roadmap, not shipped"
          description="This page describes what alerting will do and why. Nothing here is active, and there is no toggle to mislead you into thinking otherwise."
        />
      </Section>

      <Section className="pt-0">
        <div className="mx-auto max-w-2xl rounded-2xl border border-warning/40 bg-warning/[0.06] p-6">
          <div className="flex gap-3">
            <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning-ink" aria-hidden="true" />
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Why there is no switch</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Alerting needs somewhere to remember what you are watching, a scheduler to notice a change,
                and a delivery path. The product has no database and no background worker, and adding a
                settings toggle before those exist would produce a control that looks functional and does
                nothing. Phase 2 of the roadmap covers it.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
          What alerting will cover
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PLANNED.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BellRingIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <Panel title="In the meantime" description="What to use now, which is honest about its limits.">
          <ul className="space-y-3">
            {[
              'Keep the addresses you care about in your watchlist, and revisit them when you need a read.',
              'Use the API to build your own polling loop — the routes and error codes are documented, and the rate limits are stated.',
              'Follow the roadmap, since alerting is Phase 2 and the intent is published.'
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Button to="/docs/api" variant="soft" size="sm" className="mt-5">
            API reference
          </Button>
        </Panel>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Need alerts sooner?"
          description="If a specific alert would change what you do today, say so on the contact page. It may move up the roadmap."
          primary={{ label: 'Get in touch', to: '/contact' }}
          secondary={{ label: 'See the roadmap', to: '/roadmap' }}
        />
      </Section>
    </>
  );
}
