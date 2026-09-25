import { InfoIcon } from 'lucide-react';

interface InfoTipProps {
  text: string;
  label?: string;
}

export function InfoTip({ text, label = 'Why this matters' }: InfoTipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted/80 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        
        <InfoIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-normal leading-relaxed text-surface shadow-pop group-focus-within:block group-hover:block">
        
        {text}
      </span>
    </span>);

}