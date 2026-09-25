import { KeyRoundIcon, MailIcon, ShieldAlertIcon, ShieldCheckIcon } from 'lucide-react';
import { Button, Panel } from '@blocksense/ui';
import { securityLimits, securityModel } from '../../data/marketing';
import { CtaBand, InfoCard, PageIntro, Section, TruthList } from '../../components/public/marketing';

const REPO = 'https://github.com/vvsrinath/BlockSense-For-Euphoria-KARE-2026-HackFusion-';

export function Security() {
  return (
    <>
      <Section>
        <PageIntro
          eyebrow="Security"
          title="Read-only, keyless, and stateless"
          description="BlockSense reads the public ledger and answers questions about it. It has no ability to hold, move, or sign anything, because the code contains no path that could."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {securityModel.map((point) => (
            <InfoCard key={point.title} icon={point.icon} title={point.title} body={point.body} />
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <Panel
          title="What we ask you never to share"
          description="There is no legitimate reason for anyone — including someone claiming to be from this project — to ask for these."
          action={
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <KeyRoundIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          }>
          <ul className="space-y-2.5">
            {[
              'A seed phrase or mnemonic',
              'A private key, for any chain',
              'A password for a wallet or exchange account',
              'A one-time code or recovery phrase'
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Responsible disclosure">
            <p className="text-sm leading-relaxed text-muted">
              If you believe you have found a vulnerability, please report it privately rather than
              opening a public issue. Include what you found, how to reproduce it, and which component
              is affected. Reports are acknowledged, and fixes are published in the changelog once
              they land.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The codebase is open, so the fastest way to check a claim is to read it. The adapter,
              middleware, and intelligence layers are all in one repository with no obfuscation.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                to={REPO}
                target="_blank"
                rel="noreferrer noopener"
                variant="secondary"
                icon={ShieldCheckIcon}>
                Review the source
              </Button>
              <Button to="/contact" variant="soft" icon={MailIcon}>
                Report privately
              </Button>
            </div>
          </Panel>

          <Panel
            title="What this does not protect you from"
            description="Stated plainly, because security claims are only useful when their edges are marked.">
            <TruthList items={securityLimits} tone="no" />
          </Panel>
        </div>
      </Section>

      <Section className="pt-0">
        <Panel className="border-warning/40 bg-warning/[0.06]">
          <div className="flex gap-3">
            <ShieldAlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning-ink" aria-hidden="true" />
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Anomaly scores are not access controls</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                A score is a statistical signal derived from observed history. It can be wrong, and a
                well-behaved wallet can look unusual after a single large transfer. Do not connect it
                directly to an automatic block, a freeze, or a sanction decision without a human in the
                loop. That is not a disclaimer about the implementation; it is a statement about what a
                heuristic can and cannot support.
              </p>
            </div>
          </div>
        </Panel>
      </Section>

      <Section className="pt-0">
        <CtaBand
          title="Verify it yourself"
          description="The architecture page explains how a request flows through the system, and the source is one click away."
          primary={{ label: 'Architecture', to: '/docs/architecture' }}
          secondary={{ label: 'System status', to: '/status' }}
        />
      </Section>
    </>
  );
}
