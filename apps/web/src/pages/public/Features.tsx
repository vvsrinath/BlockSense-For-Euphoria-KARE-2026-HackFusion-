import {
  ClockIcon,
  CoinsIcon,
  FileSearchIcon,
  GaugeIcon,
  NetworkIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon
} from 'lucide-react';
import { chains } from '../../data/marketing';
import { CtaBand, InfoCard, PageIntro, Section, SectionHeading } from '../../components/public/marketing';

const features = [
  {
    icon: WalletIcon,
    title: 'Behavioural wallet profiles',
    body: 'Typical transfer size, how often the wallet acts, which hours it is active, and how many counterparties it deals with — all derived from observed history rather than assumed.'
  },
  {
    icon: GaugeIcon,
    title: 'Anomaly scoring with confidence',
    body: 'A 0–100 score from a weighted blend of independent signals, and a separate confidence based on how many distinct signals agreed. One signal never reads as high confidence.'
  },
  {
    icon: FileSearchIcon,
    title: 'Explanations, not just a number',
    body: 'Every score lists the signals that fired, what differed, and by how much. A score you cannot interrogate is not worth much.'
  },
  {
    icon: NetworkIcon,
    title: 'Counterparty graph',
    body: 'See who a wallet has actually transacted with. A one-hop graph today, with deeper expansion accepted and capped.'
  },
  {
    icon: CoinsIcon,
    title: 'Token metadata that is actually read',
    body: 'Token names and scales come from the token contract or a price feed. When a token cannot be priced, it is left unpriced instead of being given a zero.'
  },
  {
    icon: ClockIcon,
    title: 'Resilient under load',
    body: 'A throttled provider is retried with backoff, and a recent answer is served rather than replaced with an error. The page retries on its own before it gives up.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Read-only, keyless, stateless',
    body: 'No seed phrase, no private key, no signing, no account. Your watchlist lives in your own browser and there is no database behind the product.'
  },
  {
    icon: SparklesIcon,
    title: 'One documented API',
    body: 'Every view in the product is one HTTP call away, with a consistent envelope and error codes. No key needed to start.'
  }
];

export function Features() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Features"
          title="What BlockSense actually does"
          description="Eight capabilities, each one describing what the software does rather than what it might do someday."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <InfoCard key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} />
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          title="Five chains, read live"
          description="Every chain is read from a public node at request time. Nothing is indexed ahead of the question."
        />
        <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chains.map((chain) => (
            <div key={chain.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${chain.accent}`} aria-hidden="true" />
                <h3 className="text-sm font-semibold text-ink">{chain.name}</h3>
                <span className="ml-auto text-xs text-muted">{chain.nativeSymbol}</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                History: {chain.history} · USD pricing: {chain.pricing ? 'yes' : 'no'}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Try it on a real transaction"
          description="No sign-up, no key, no data collected. Paste a transaction hash from any of the five chains."
          primary={{ label: 'Analyze now', to: '/analyze' }}
          secondary={{ label: 'See supported chains', to: '/chains' }}
        />
      </Section>
    </>
  );
}
