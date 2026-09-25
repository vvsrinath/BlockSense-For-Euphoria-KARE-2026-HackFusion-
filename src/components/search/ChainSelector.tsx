import { useCallback, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, LayersIcon } from 'lucide-react';
import { DropdownPanel } from '../common/DropdownPanel';
import { chains } from '../../data/chains';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { ChainFilter } from '../../types/chain';
import { cn } from '../../utils/cn';

interface ChainSelectorProps {
  value: ChainFilter;
  onChange: (value: ChainFilter) => void;
  className?: string;
}

const options: {id: ChainFilter;name: string;color?: string;}[] = [{ id: 'all', name: 'All chains' }, ...chains.map((c) => ({ id: c.id, name: c.name, color: c.color }))];

export function ChainSelector({ value, onChange, className }: ChainSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const current = options.find((o) => o.id === value) ?? options[0];

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Chain: ${current.name}`}
        className="flex h-full items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm text-ink transition-colors duration-150 ease-out hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        
        {current.color ?
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: current.color }} aria-hidden="true" /> :

        <LayersIcon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
        }
        {current.name}
        <ChevronDownIcon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
      </button>
      <DropdownPanel open={open} className="w-48" role="listbox" label="Select chain">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(option.id);
                close();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-subtle">
              
              {option.color ?
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} aria-hidden="true" /> :

              <LayersIcon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              }
              <span className="flex-1">{option.name}</span>
              {selected && <CheckIcon className="h-4 w-4 text-primary" aria-hidden="true" />}
            </button>);

        })}
      </DropdownPanel>
    </div>);

}