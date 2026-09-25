import { ChainCard } from './ChainCard';
import { chains } from '../../data/chains';

export function ChainStatusStrip() {
  return (
    <section aria-labelledby="chain-status-heading" className="rounded-2xl border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 id="chain-status-heading" className="text-sm font-semibold text-ink">
          Supported networks
        </h2>
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-ink">Demo values · not live</span>
      </header>
      <div className="grid grid-cols-2 divide-line sm:grid-cols-3 xl:grid-cols-5 xl:divide-x">
        {chains.map((chain) =>
        <ChainCard key={chain.id} chain={chain} />
        )}
      </div>
    </section>);

}