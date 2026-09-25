import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOutIcon, SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownPanel } from '../common/DropdownPanel';
import { useClickOutside } from '../../hooks/useClickOutside';
const itemClass = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-subtle';
export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  return <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary transition-colors duration-150 ease-out hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        AM
      </button>
      <DropdownPanel open={open} className="w-60" role="menu" label="Account">
        <div className="px-3 py-2.5">
          <p className="text-sm font-medium text-ink">Alex Morgan</p>
          <p className="text-xs text-muted">alex@demo.blocksense.app</p>
        </div>
        <div className="my-1 h-px bg-line" />
        <Link role="menuitem" to="/settings" onClick={close} className={itemClass}>
          <SettingsIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          Settings
        </Link>
        <Link role="menuitem" to="/help" onClick={close} className={itemClass}>
          <div className="h-4 w-4 text-muted" aria-hidden="true" />
          Help
        </Link>
        <div className="my-1 h-px bg-line" />
        <button role="menuitem" type="button" className={itemClass} onClick={() => {
        close();
        toast('Signed out of the demo workspace', {
          description: 'Real accounts arrive with the backend connection.'
        });
        navigate('/');
      }}>
          <LogOutIcon className="h-4 w-4 text-muted" aria-hidden="true" />
          Sign out
        </button>
      </DropdownPanel>
    </div>;
}