import { Link } from 'react-router-dom';
import { SearchBox } from '../search/SearchBox';
import { searchExamples } from '../../data/examples';
import { getChain } from '../../utils/chains';

interface QuickAnalyzeProps {
  title?: string;
  description?: string;
  autoFocus?: boolean;
}

export function QuickAnalyze({
  title = 'Analyze anything on-chain',
  description = 'Paste a transaction hash, wallet address or contract. BlockSense detects the chain for you.',
  autoFocus
}: QuickAnalyzeProps) {
  return (
    <section aria-labelledby="quick-analyze-heading" className="rounded-2xl border border-line bg-surface p-5 shadow-card md:p-8">
      <h2 id="quick-analyze-heading" className="text-xl font-semibold tracking-tight text-ink md:text-2xl">
        {title}
      </h2>
      <p className="mt-1.5 text-sm text-muted md:text-[15px]">{description}</p>
      <SearchBox size="lg" className="mt-5" placeholder="Enter transaction hash, wallet address or contract" autoFocus={autoFocus} />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted">Try an example</span>
        {searchExamples.map((ex) =>
        <Link
          key={ex.label}
          to={ex.to}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getChain(ex.chain).color }} aria-hidden="true" />
            {ex.label}
          </Link>
        )}
      </div>
    </section>);

}