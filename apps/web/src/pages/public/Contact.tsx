import { Link } from 'react-router-dom';
import {
  ActivityIcon,
  BookOpenIcon,
  BugIcon,
  BuildingIcon,
  CodeIcon,
  RocketIcon,
  UserIcon,
  UsersIcon
} from 'lucide-react';
import { Panel } from '@blocksense/ui';
import { CtaBand, PageIntro, Section, SectionHeading } from '../../components/public/marketing';
import { ContactDeveloper } from '../../components/public/ContactDeveloper';
import { developer } from '../../data/developer';

const REPO = developer.github;
const REPO_SLUG = 'BlockSense-For-Euphoria-KARE-2026-HackFusion-';

/**
 * Everything that is not a direct message.
 *
 * Email and LinkedIn are intentionally absent: the developer section above owns
 * those two, and repeating the same three links in two places on one page makes
 * the page look busier without making it more useful.
 */
const routes = [
  {
    icon: BugIcon,
    title: 'Report a bug',
    body: 'Something wrong, or something that looks wrong? Open an issue. A transaction hash and what you expected makes it far easier to chase.',
    cta: { label: 'Open an issue', to: `${REPO}/${REPO_SLUG}/issues` }
  },
  {
    icon: RocketIcon,
    title: 'Try it first',
    body: 'Most questions are answered faster by pasting a transaction hash than by writing to us. No account needed.',
    cta: { label: 'Open the analyzer', to: '/analyze' }
  },
  {
    icon: CodeIcon,
    title: 'Read the source',
    body: 'Every route, adapter, and analysis in this project is public, with the reasoning behind the design written down.',
    cta: { label: 'Browse the repository', to: `${REPO}/${REPO_SLUG}` }
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
  },
  {
    icon: ActivityIcon,
    title: 'Something is down',
    body: 'Chain providers rate-limit and occasionally time out. The status page reports what is actually responding right now.',
    cta: { label: 'System status', to: '/status' }
  }
];

/**
 * Contact.
 *
 * The developer section comes first, because "how do I reach the person who made
 * this" is the reason most people open this page. The route cards after it
 * cover everything that is not a direct message: the product, the issue tracker,
 * and pricing.
 *
 * There is no contact form anywhere, because a form needs a mail service and a
 * store of submissions and this project deliberately has neither. A real
 * address and a public repository are more useful than a form that goes
 * nowhere.
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
        <ContactDeveloper />
      </Section>

      <Section className="pt-0">
        <SectionHeading
          title="Other ways to get help"
          description="For anything that is not a direct message to the developer, these routes go straight to the thing you need."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
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
                  href={`${REPO}/${REPO_SLUG}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <BookOpenIcon className="h-4 w-4" aria-hidden="true" />
                  Open the repository
                </a>
                <Link to="/about" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
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
