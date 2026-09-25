import { Link } from 'react-router-dom';
import { BookOpenIcon, BugIcon, BuildingIcon, LinkedinIcon, MailIcon, RocketIcon, UsersIcon } from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { CtaBand, PageIntro, Section } from '../../components/public/marketing';
import { developer } from '../../data/developer';

const REPO = developer.github;

const routes = [
  {
    icon: MailIcon,
    title: 'Email',
    body: `The fastest way to reach ${developer.shortName} about the project, a bug, or an idea.`,
    cta: { label: developer.email, to: `mailto:${developer.email}` }
  },
  {
    icon: LinkedinIcon,
    title: 'LinkedIn',
    body: 'Professional background, and a reasonable place to start a conversation about the work.',
    cta: { label: 'Connect', to: developer.linkedin }
  },
  {
    icon: RocketIcon,
    title: 'Try it first',
    body: 'Most questions are answered faster by pasting a transaction hash than by writing to us. No account needed.',
    cta: { label: 'Open the analyzer', to: '/analyze' }
  },
  {
    icon: BugIcon,
    title: 'Report a bug',
    body: 'Something wrong, or something that looks wrong? Open an issue. A transaction hash and what you expected makes it far easier to chase.',
    cta: { label: 'Open an issue', to: `${REPO}/BlockSense-For-Euphoria-KARE-2026-HackFusion-/issues` }
  },
  {
    icon: BuildingIcon,
    title: 'Business and enterprise',
    body: 'Monitoring across many wallets, private deployment, or an integration that needs custom limits. Tell us the shape of the problem.',
    cta: { label: 'Read pricing', to: '/pricing' }
  },
  {
    icon: UsersIcon,
    title: 'Contributing',
    body: 'The project is open source and the roadmap is public. Architecture, adapter, or intelligence work all have a clear path in.',
    cta: { label: 'Contributing guide', to: '/docs/contributing' }
  }
];

/**
 * Contact.
 *
 * There is no contact form, because a form needs a mail service and a store of
 * submissions and this project deliberately has neither. A real address and a
 * public repository are more useful than a form that goes nowhere.
 */
export function Contact() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Contact"
          title="How to reach us, honestly"
          description={`There is no contact form behind this page — a form needs a mail service and a store of submissions, and this project has neither. These are the routes that actually work, and ${developer.shortName} reads them.`}
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-2">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Panel key={route.title}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-[15px] font-semibold text-ink">{route.title}</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{route.body}</p>
                {/* An internal route must go through the router, or the click
                    throws away the client state and re-downloads the app. */}
                {route.cta.to.startsWith('http') ? (
                  <a
                    href={route.cta.to}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {route.cta.label}
                  </a>
                ) : route.cta.to.startsWith('mailto:') ? (
                  <a
                    href={route.cta.to}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {route.cta.label}
                  </a>
                ) : (
                  <Link to={route.cta.to} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {route.cta.label}
                  </Link>
                )}
              </Panel>
            );
          })}
        </div>
      </Section>

      <Section className="pt-0">
        <Panel>
          <div className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Built for the Euphoria / HackFusion hackathon</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                BlockSense is a hackathon project by {developer.name} at {developer.location}. It is open
                source, the roadmap is public, and contributions are welcome — particularly on the two
                chains whose address history still needs an explorer key, and on graph expansion beyond
                one hop.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`${REPO}/BlockSense-For-Euphoria-KARE-2026-HackFusion-`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
                  Open the repository
                </a>
                <Link to="/about" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <MailIcon className="h-4 w-4" aria-hidden="true" />
                  About the developer
                </Link>
              </div>
            </div>
          </div>
        </Panel>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Start with the product"
          description="Every feature described on this site can be tried right now, on real chain data, with nothing to sign up for."
          primary={{ label: 'Analyze a transaction', to: '/analyze' }}
          secondary={{ label: 'System status', to: '/status' }}
        />
      </Section>
    </>
  );
}
