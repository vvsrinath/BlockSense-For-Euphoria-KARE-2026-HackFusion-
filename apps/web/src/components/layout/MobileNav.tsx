import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRightIcon, EllipsisIcon, SettingsIcon, XIcon, BoxIcon } from "lucide-react";
import { primaryNav } from "../../data/navigation";
import { cn } from '@blocksense/shared';

const mainItems = primaryNav.slice(0, 4);
/**
 * One line under each destination.
 *
 * Icons alone are a memory test: eight destinations with no words on a phone
 * means people open the wrong screen to find out what is inside it.
 */
const HINTS: Record<string, string> = {
  '/assets': 'Balances, prices and allocation',
  '/watchlist': 'Wallets you are tracking',
  '/reports': 'Saved analysis and exports',
  '/alerts': 'Threshold and anomaly notifications',
  '/console': 'Endpoints, keys and usage limits'
};

/** Destinations the bottom bar has no room for. */
const destinations = primaryNav.slice(4).map((item) => ({ ...item, hint: HINTS[item.to] }));

const preferences = [
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', icon: SettingsIcon, hint: 'Theme, chain and display defaults' },
  { to: '/help', label: 'Help', shortLabel: 'Help', icon: BoxIcon, hint: 'Guides, examples and troubleshooting' }
];

interface MoreItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof SettingsIcon;
  hint?: string;
}

/**
 * One row of the More sheet.
 *
 * A bare text list is hard to hit and hard to scan on a phone, so each row is
 * a 56px target with the icon in a chip, the label, and a chevron — the shape
 * people already know from iOS/Android settings screens.
 */
function MoreLink({ item, onNavigate }: { item: MoreItem; onNavigate: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition-colors',
          isActive
            ? 'bg-primary/[0.08] text-primary [&>span:first-child]:bg-primary/15 [&>span:first-child]:text-primary'
            : 'text-ink hover:bg-subtle'
        )
      }>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-subtle text-muted transition-colors">
        <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.hint ? (
          <span className="mt-0.5 block truncate text-[13px] font-normal text-muted">{item.hint}</span>
        ) : null}
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted/60" aria-hidden="true" />
    </NavLink>
  );
}

function GroupLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </p>
  );
}

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const close = () => setMoreOpen(false);

  // The sheet sits over the page, so the page behind it must not scroll with a
  // stray swipe — that is what makes a bottom sheet feel broken on a phone.
  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [moreOpen]);

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
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden">
        <ul className="grid grid-cols-5">
          {mainItems.map((item) => <li key={item.to}>
              <NavLink to={item.to} className={({
            isActive
          }) => cn(
            'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
            // The pill behind the icon marks the tab you are on; colour alone
            // is not enough at arm's length in sunlight.
            isActive ? 'text-primary [&>span]:bg-primary/10' : 'text-muted'
          )}>
                <span className="flex h-7 w-12 items-center justify-center rounded-full transition-colors">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {item.shortLabel}
              </NavLink>
            </li>)}
          <li>
            <button ref={triggerRef} type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} aria-haspopup="dialog" className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted">
              <span className="flex h-7 w-12 items-center justify-center rounded-full">
                <EllipsisIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {moreOpen && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
            <motion.button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 0.2
        }} onClick={() => setMoreOpen(false)} />
            <motion.div ref={dialogRef} className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border-t border-line bg-surface shadow-[0_-18px_48px_-16px_rgba(15,23,42,0.35)]" initial={{
          y: '100%'
        }} animate={{
          y: 0
        }} exit={{
          y: '100%'
        }} transition={{
          duration: 0.28,
          ease: [0.32, 0.72, 0, 1]
        }}>
              {/* Grabber: the visual cue that this is a sheet that can be dismissed. */}
              <div className="flex justify-center pt-2.5" aria-hidden="true">
                <span className="h-1 w-10 rounded-full bg-line-strong" />
              </div>

              <div className="flex items-start justify-between gap-3 px-4 pb-1 pt-3">
                <div>
                  <p className="text-base font-semibold leading-6 text-ink">More</p>
                  <p className="text-xs leading-5 text-muted">Everything else in BlockSense</p>
                </div>
                <button ref={closeRef} type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-subtle text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                  <XIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Scrollable so a short viewport or a large system font can never
                  push the last row (and the close button) off screen. */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1">
                <GroupLabel id="more-group-destinations">Destinations</GroupLabel>
                <ul aria-labelledby="more-group-destinations" className="space-y-1">
                  {destinations.map((item) => <li key={item.to}>
                      <MoreLink item={item} onNavigate={close} />
                    </li>)}
                </ul>

                <div className="mx-3 mt-4 border-t border-line" aria-hidden="true" />
                <GroupLabel id="more-group-preferences">Preferences</GroupLabel>
                <ul aria-labelledby="more-group-preferences" className="space-y-1">
                  {preferences.map((item) => <li key={item.to}>
                      <MoreLink item={item} onNavigate={close} />
                    </li>)}
                </ul>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>
    </>;
}
