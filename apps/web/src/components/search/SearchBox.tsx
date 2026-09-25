import { useCallback, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRightIcon, ArrowRightIcon, BoxIcon, InfoIcon, LoaderCircleIcon, ScanSearchIcon, SearchIcon, TriangleAlertIcon, WalletIcon } from 'lucide-react';
import { ChainSelector } from './ChainSelector';
import { useSettings } from '../../stores/SettingsContext';
import { DEMO_TX_HASH } from '../../mock/mockAddresses';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useSearchSubmit, type SearchFeedback } from '../../hooks/useSearchSubmit';
import { cn, truncateMiddle } from '@blocksense/shared';
import type { ChainFilter } from '@blocksense/shared';
import { detectInput } from '@blocksense/blockchain';

interface SearchBoxProps {
  size?: 'md' | 'lg';
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBox({ size = 'md', placeholder = 'Search transaction hash, wallet address or domain…', autoFocus, className }: SearchBoxProps) {
  const { settings } = useSettings();
  const [value, setValue] = useState('');
  const [chain, setChain] = useState<ChainFilter>(settings.defaultChain);
  const [focused, setFocused] = useState(false);
  const [feedback, setFeedback] = useState<SearchFeedback | null>(null);
  const { submit, pending } = useSearchSubmit();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const close = useCallback(() => setFocused(false), []);
  useClickOutside(containerRef, close, focused);

  const trimmed = value.trim();
  const detection = useMemo(() => trimmed ? detectInput(trimmed, chain) : null, [trimmed, chain]);
  const lg = size === 'lg';

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const result = await submit(value, chain);
    setFeedback(result);
    setFocused(true);
    if (!result) {
      setValue('');
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = focused && (feedback !== null || trimmed.length > 0 || !lg);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form
        role="search"
        onSubmit={handleSubmit}
        className={cn(
          'flex items-center gap-1 rounded-xl border bg-surface transition-[border-color,box-shadow] duration-150 ease-out',
          focused ? 'border-primary/60 ring-4 ring-primary/10' : 'border-line',
          lg ? 'h-14 pl-4 pr-1.5 md:h-16 md:pl-5 md:pr-2' : 'h-11 pl-3 pr-1'
        )}>
        
        <SearchIcon className={cn('shrink-0 text-muted', lg ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden="true" />
        <input
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setFeedback(null);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          aria-label="Search by transaction hash, wallet address or contract"
          aria-describedby={showPanel ? panelId : undefined}
          spellCheck={false}
          autoComplete="off"
          className={cn('min-w-0 flex-1 bg-transparent px-2 text-ink placeholder:text-muted/80 focus:outline-none', lg ? 'text-base md:text-[17px]' : 'text-sm')} />
        
        <div className={cn('hidden h-9 border-l border-line pl-1 sm:block', lg && 'h-10')}>
          <ChainSelector value={chain} onChange={setChain} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-brand font-medium text-white transition-[opacity,transform] duration-150 ease-out hover:opacity-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-70',
            lg ? 'h-11 px-4 text-[15px] md:h-12 md:px-5' : 'h-9 px-3 text-sm'
          )}>
          
          {pending ? <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Analyze
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      <AnimatePresence>
        {showPanel &&
        <motion.div
          id={panelId}
          aria-live="polite"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          
            {feedback ?
          <div className="flex gap-3 rounded-lg px-3 py-2.5" role={feedback.tone === 'error' ? 'alert' : undefined}>
                {feedback.tone === 'error' ?
            <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" aria-hidden="true" /> :

            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            }
                <div>
                  <p className="text-sm font-medium text-ink">{feedback.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{feedback.message}</p>
                </div>
              </div> :
          detection ?
          <DetectionRow detection={detection} value={trimmed} onSubmit={() => handleSubmit()} /> :

          <div className="px-1 py-1">
                <Link
              to={`/analyze/tx/${DEMO_TX_HASH}`}
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink hover:bg-subtle">
              
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <ScanSearchIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">Try the demo transaction</span>
                    <span className="block text-xs text-muted">500 USDC on Ethereum · Anomaly score 87</span>
                  </span>
                  <ArrowRightIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                </Link>
                <p className="px-2.5 pb-1 pt-2 text-xs text-muted">
                  Examples: <span className="font-mono">0xA83...91F</span> · <span className="font-mono">TQ8...K2L</span> · <span className="font-mono">bc1q...5mdq</span>
                </p>
              </div>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

interface DetectionRowProps {
  detection: ReturnType<typeof detectInput>;
  value: string;
  onSubmit: () => void;
}

function DetectionRow({ detection, value, onSubmit }: DetectionRowProps) {
  if (detection.kind === 'unknown') {
    if (value.length < 6) return <p className="px-3 py-2.5 text-[13px] text-muted">Keep typing — paste a full address or transaction hash.</p>;
    return (
      <div className="flex gap-3 px-3 py-2.5">
        <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning-ink" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-ink">We couldn't identify this input.</p>
          <p className="mt-0.5 text-[13px] text-muted">Check the address or transaction hash and try again.</p>
        </div>
      </div>);

  }

  const Icon = detection.kind === 'address' ? WalletIcon : detection.kind === 'transaction' ? ArrowLeftRightIcon : detection.kind === 'block' ? BoxIcon : SearchIcon;
  const actionLabel =
  detection.action === 'wallet' ? 'Analyze wallet' : detection.action === 'transaction' ? 'Analyze transaction' : detection.kind === 'shortened' ? 'Find match' : 'Check block';
  const sub =
  detection.kind === 'block' ?
  'Block lookups activate once the backend is connected.' :
  detection.kind === 'shortened' ?
  "We'll look for a match in the demo data." :
  truncateMiddle(value, 10, 8);

  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onSubmit} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-subtle">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{detection.label}</span>
        <span className={cn('block truncate text-xs text-muted', detection.kind !== 'block' && detection.kind !== 'shortened' && 'font-mono')}>{sub}</span>
      </span>
      <span className="hidden items-center gap-1 whitespace-nowrap text-[13px] font-medium text-primary sm:inline-flex">
        {actionLabel}
        <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>);

}