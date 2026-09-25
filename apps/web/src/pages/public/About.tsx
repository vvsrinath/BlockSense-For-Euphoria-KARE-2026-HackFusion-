import { CompassIcon, EyeIcon, GaugeIcon, ScaleIcon, TargetIcon } from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { CtaBand, InfoCard, PageIntro, Section } from '../../components/public/marketing';

const principles = [
  {
    icon: EyeIcon,
    title: 'Show the reasoning',
    body: 'A score with no explanation is not usable. Every result lists the signals that fired, what differed, and how confident the product is in its own conclusion.'
  },
  {
    icon: ScaleIcon,
    title: 'Refuse to overclaim',
    body: 'This is a tool that scores behaviour, not an oracle that judges guilt. The Scope page is part of the product, not fine print.'
  },
  {
    icon: TargetIcon,
    title: 'Report unknowns honestly',
    body: 'A token that cannot be priced has no value shown, rather than a zero. A wallet with too little history says so instead of reporting a clean result. A missing transaction is not a provider outage.'
  },
  {
    icon: GaugeIcon,
    title: 'Earn trust through consistency',
    body: 'The same request returns the same shape, the same code returns the same error, and the numbers come from a named source rather than an estimate.'
  }
];

export function About() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="About"
          title="Blockchain analysis that admits its limits"
          description="BlockSense reads public chain data and answers one question well: does this activity look like what this wallet has done before?"
        />
      </Section>

      <Section className="pt-0">
        <div className="mx-auto max-w-3xl space-y-4 text-[15px] leading-relaxed text-muted">
          <p>
            Most tools in this space fall into one of two failures. They show a number with no
            reasoning behind it, or they show a number and let it read like a verdict. Both waste the
            reader’s time, and the second one is actively harmful.
          </p>
          <p>
            BlockSense is built the other way. The interesting signal in an on-chain investigation is
            rarely a single transaction — it is the difference between one transaction and the hundred
            before it. So the product is built around a behavioural baseline, and the score is a
            measure of distance from it. When the baseline is missing, the product says the baseline is
            missing, because a confident zero is worse than no answer.
          </p>
          <p>
            Everything is read live from public infrastructure at the moment of the question. There is
            no pre-built index, no account to create, and no database holding anything about you. That
            is partly a privacy decision and partly an honesty one: a tool that stores what you looked at
            is a tool that has to be trusted with it.
          </p>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 sm:grid-cols-2">
          {principles.map((principle) => (
            <InfoCard key={principle.title} icon={principle.icon} title={principle.title} body={principle.body} />
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <Panel>
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CompassIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Why this exists</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                BlockSense was started as a hackathon project for the Euphoria / HackFusion hackathon at
                Kalasalingam University. The goal was narrow on purpose: prove that behavioural analysis
                across five very different chains can be done live, without a data company, and without
                pretending to know more than it does. The public site and this documentation are part of
                that goal — a tool that hides its limits is not finished.
              </p>
            </div>
          </div>
        </Panel>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="See the roadmap"
          description="What has shipped, what is in progress, and what is deliberately later."
          primary={{ label: 'View roadmap', to: '/roadmap' }}
          secondary={{ label: 'Read about security', to: '/security' }}
        />
      </Section>
    </>
  );
}
