import { CheckIcon, CircleDotIcon, ClockIcon } from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { cn } from '@blocksense/shared';
import { roadmap } from '../../data/marketing';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';

const STATUS_STYLE = {
  Shipped: { icon: CheckIcon, className: 'bg-success/15 text-success' },
  'In progress': { icon: CircleDotIcon, className: 'bg-primary/10 text-primary' },
  Planned: { icon: ClockIcon, className: 'bg-subtle text-muted' }
} as const;

export function Roadmap() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Roadmap"
          title="Where BlockSense is going"
          description="Phase 1 is live. The rest is intent, not a commitment — and anything marked planned is subject to change."
        />
      </Section>

      <Section className="pt-0">
        <ol className="mx-auto max-w-3xl space-y-4">
          {roadmap.map((phase) => {
            const style = STATUS_STYLE[phase.status];
            const Icon = style.icon;
            return (
              <li key={phase.name}>
                <Panel>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[15px] font-semibold text-ink">{phase.name}</h2>
                    <span className={cn('ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium', style.className)}>
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {phase.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{phase.summary}</p>
                  <ul className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
                    {phase.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Something on this list you need sooner?"
          description="The order is a guess. If a phase does not match what you are building, say so and it may move."
          primary={{ label: 'Get in touch', to: '/contact' }}
          secondary={{ label: 'Changelog', to: '/changelog' }}
        />
      </Section>
    </>
  );
}
