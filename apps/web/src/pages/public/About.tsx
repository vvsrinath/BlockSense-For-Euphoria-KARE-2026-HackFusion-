import { QuoteIcon } from 'lucide-react';
import { developer, closing, disciplines, interests, origin, principles } from '../../data/developer';
import { DeveloperCard } from '../../components/public/DeveloperCard';
import { ContactDeveloper } from '../../components/public/ContactDeveloper';
import { CtaBand, InfoCard, PageIntro, Section, SectionHeading } from '../../components/public/marketing';

/** About the project and the person who built it. */
export function About() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="About"
          title="BlockSense, and the person who built it"
          description="A question about behaviour rather than transaction detail turned into a working multi-chain intelligence platform."
        />
      </Section>

      <Section className="pt-0">
        <DeveloperCard />
      </Section>

      <Section className="pt-0">
        <figure className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-7 text-center shadow-card">
          <QuoteIcon className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
          <blockquote className="mt-4 text-lg font-medium leading-relaxed text-ink md:text-xl">
            {origin.question}
          </blockquote>
          <figcaption className="mt-4 text-sm leading-relaxed text-muted">{origin.answer}</figcaption>
        </figure>
      </Section>

      <Section className="pt-0">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
          What the project brings together
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-muted">
          Instead of separate demonstrations for blockchain, machine learning, visualisation, and
          software engineering, BlockSense combines them in one platform. The focus is not displaying
          chain data, but providing context around it.
        </p>
        <ul className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {disciplines.map((discipline) => {
            const Icon = discipline.icon;
            return (
              <li key={discipline.label} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm text-ink">{discipline.label}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section className="pt-0">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
          Development philosophy
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {principles.map((principle) => (
            <InfoCard key={principle.title} icon={principle.icon} title={principle.title} body={principle.body} />
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
          Technology interests
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-muted">
          The areas {developer.shortName} works in. BlockSense is where several of them meet.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {interests.map((interest) => (
            <InfoCard key={interest.title} icon={interest.icon} title={interest.title} body={interest.body} />
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-7 shadow-card">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Why BlockSense was built</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">
            <p>
              BlockSense is an effort to combine these interests in a single project rather than leaving
              them as separate exercises. It is meant to evolve through experimentation, open-source
              development, testing, and feedback — which is why the repository, the architecture, and the
              limits of the product are all published.
            </p>
            <p>
              The long-term goal is {closing.goal} BlockSense is one step in that journey.
            </p>
          </div>
          <p className="mt-6 border-l-2 border-primary pl-4 text-base font-medium italic text-ink">
            “{closing.motto}”
          </p>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionHeading
          title="Get in touch"
          description={`Messages about the project, a bug, or collaboration go straight to ${developer.shortName}.`}
        />
        <div className="mt-8">
          <ContactDeveloper />
        </div>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Interested in BlockSense?"
          description="Contributions, questions, and ideas are all welcome. The source, the API, and the reasoning behind the design are all public."
          primary={{ label: 'Read the docs', to: '/docs' }}
          secondary={{ label: 'Get in touch', to: '/contact' }}
        />
      </Section>
    </>
  );
}
