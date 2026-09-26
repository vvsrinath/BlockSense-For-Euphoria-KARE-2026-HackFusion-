import { LifeBuoyIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Panel } from '@blocksense/ui';

import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { journeySteps } from '../data/features';
import { TRON_EXAMPLE_TX } from '../data/exampleIdentifiers';

const glossary = [
{ term: 'Transaction hash', definition: 'A unique ID for a single transaction. Paste it into search to see what happened.' },
{ term: 'Wallet address', definition: 'A public identifier that can send and receive assets. It does not reveal who owns it.' },
{ term: 'Anomaly score', definition: 'A 0–100 score showing how much behavior differs from the wallet’s own history. It is not proof of wrongdoing.' },
{ term: 'Token transfer', definition: 'Movement of an asset such as USDC or USDT that lives on top of a blockchain.' },
{ term: 'Network fee', definition: 'What the sender paid the network to process the transaction.' },
{ term: 'Observed connection', definition: 'Two wallets that have transacted with each other. It shows a link, not a relationship between people.' }];

export function Help() {
  return (
    <PageContainer>
      <div className="max-w-4xl">
        <PageHeader title="Help" description="Everything you need to go from a transaction hash to a clear answer." />
        <div className="space-y-4 lg:space-y-6">
          <Panel title="How BlockSense works">
            <ol className="grid gap-6 sm:grid-cols-2">
              {journeySteps.map((step, i) =>
              <li key={step.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{step.description}</p>
                  </div>
                </li>
              )}
            </ol>
            <Button to={`/analyze/tx/${TRON_EXAMPLE_TX}?chain=tron`} variant="soft" className="mt-6">
              Walk through the demo
            </Button>
          </Panel>

          <Panel title="Key terms">
            <dl className="divide-y divide-line">
              {glossary.map((g) =>
              <div key={g.term} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-6">
                  <dt className="text-sm font-medium text-ink">{g.term}</dt>
                  <dd className="text-sm text-muted">{g.definition}</dd>
                </div>
              )}
            </dl>
          </Panel>

          <section className="flex flex-col gap-4 rounded-2xl bg-primary/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="flex items-center gap-3">
              <LifeBuoyIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Still stuck?</p>
                <p className="text-sm text-muted">Our team usually replies within one business day.</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => toast('Support requests open once the backend is connected', { description: 'In the meantime, email support@blocksense.app.' })}>
              
              Contact support
            </Button>
          </section>
        </div>
      </div>
    </PageContainer>);

}