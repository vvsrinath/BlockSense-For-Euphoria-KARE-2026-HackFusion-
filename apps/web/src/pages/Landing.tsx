import { ArrowRightIcon, PlayIcon } from 'lucide-react';
import { Button } from '@blocksense/ui';

import { NetworkIllustration } from '../components/landing/NetworkIllustration';
import { chains } from '@blocksense/blockchain';
import { features, journeySteps } from '../data/features';
import { FEATURED_EXAMPLE_TX } from '../data/examples';

const DEMO_PATH = `/analyze/tx/${FEATURED_EXAMPLE_TX.hash}`;

export function Landing() {
  return (
    <div className="w-full bg-bg text-ink">

      <main>
        <section className="mx-auto grid max-w-content items-center gap-12 px-4 pb-16 pt-10 md:px-8 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
          <div>
            <p className="text-sm font-medium text-primary">Blockchain intelligence made simple</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-[56px] lg:leading-[1.05]">
              See the transaction.
              <br />
              <span className="text-brand-gradient">Understand the behavior.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              BlockSense turns blockchain data into simple, explainable intelligence — what moved, who was involved, and what is unusual.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/home" size="lg" iconRight={ArrowRightIcon}>
                Start Analyzing
              </Button>
              <Button to={DEMO_PATH} size="lg" variant="secondary" icon={PlayIcon}>
                Explore Demo
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span>Works with</span>
              {chains.map((c) =>
              <span key={c.id} className="inline-flex items-center gap-1.5 text-ink">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                  {c.name}
                </span>
              )}
            </div>
          </div>
          <NetworkIllustration />
        </section>

        <section id="features" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-content px-4 py-16 md:px-8 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-ink">Don't just see the transaction. Understand the behavior.</h2>
              <p className="mt-3 text-muted">BlockSense helps you understand what changed, what moved, and what is unusual.</p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) =>
              <li key={f.title} className="flex flex-col rounded-2xl border border-line bg-bg p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.description}</p>
                  <p className="mt-auto pt-5 text-xs text-muted">{f.points.join(' · ')}</p>
                </li>
              )}
            </ul>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-content px-4 py-16 md:px-8 lg:py-24">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">From hash to understanding in seconds</h2>
          <p className="mt-3 max-w-2xl text-muted">No blockchain knowledge needed. BlockSense explains every value and why it matters.</p>
          <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
            {journeySteps.map((step, i) =>
            <li key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">{i + 1}</span>
                  {i < journeySteps.length - 1 && <span className="hidden h-px flex-1 bg-line md:block" aria-hidden="true" />}
                </div>
                <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.description}</p>
              </li>
            )}
          </ol>

          <div className="mt-16 flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 shadow-card md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-sm text-muted">Demo investigation</p>
              <p className="mt-1 text-xl font-semibold text-ink">500 USDC on Ethereum · Anomaly score 87/100</p>
              <p className="mt-1 text-sm text-muted">New receiver · amount 12.5× higher than normal · frequency 8× higher · unusual network connection</p>
            </div>
            <Button to={DEMO_PATH} size="lg" iconRight={ArrowRightIcon}>
              Explore Demo
            </Button>
          </div>
        </section>
      </main>

    </div>);

}