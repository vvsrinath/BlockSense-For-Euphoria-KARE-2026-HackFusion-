import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { EllipsisIcon, SettingsIcon, XIcon, BoxIcon } from "lucide-react";
import { primaryNav } from "../../data/navigation";
import { cn } from '@blocksense/shared';
const mainItems = primaryNav.slice(0, 4);
const moreItems = [...primaryNav.slice(4), {
  to: '/settings',
  label: 'Settings',
  shortLabel: 'Settings',
  icon: SettingsIcon
}, {
  to: '/help',
  label: 'Help',
  shortLabel: 'Help',
  icon: BoxIcon
}];
export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // The drawer is a dialog: it takes focus when it opens, keeps Tab inside it,
  // closes on Escape, and hands focus back to the button that opened it.
  // Without this a keyboard user is left focused on the page behind an overlay.
  useEffect(() => {
    if (!moreOpen) {
      if (wasOpen.current) triggerRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = dialogRef.current
        ? [...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
        : [];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active ? dialogRef.current?.contains(active) : false;
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  return <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden print:hidden">
        <ul className="grid grid-cols-5">
          {mainItems.map((item) => <li key={item.to}>
              <NavLink to={item.to} className={({
            isActive
          }) => cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-primary' : 'text-muted')}>
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.shortLabel}
              </NavLink>
            </li>)}
          <li>
            <button ref={triggerRef} type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} aria-haspopup="dialog" className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted">
              <EllipsisIcon className="h-5 w-5" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {moreOpen && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
            <motion.button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/30" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 0.2
        }} onClick={() => setMoreOpen(false)} />
            <motion.div ref={dialogRef} className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-4 pb-8" initial={{
          y: '100%'
        }} animate={{
          y: 0
        }} exit={{
          y: '100%'
        }} transition={{
          duration: 0.25,
          ease: [0.32, 0.72, 0, 1]
        }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">More</p>
                <button ref={closeRef} type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-subtle">
                  <XIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ul className="space-y-0.5">
                {moreItems.map((item) => <li key={item.to}>
                    <NavLink to={item.to} onClick={() => setMoreOpen(false)} className={({
                isActive
              }) => cn('flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium', isActive ? 'bg-primary/[0.08] text-primary' : 'text-ink hover:bg-subtle')}>
                      <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  </li>)}
              </ul>
            </motion.div>
          </div>}
      </AnimatePresence>
    </>;
}