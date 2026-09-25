import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from 'lucide-react';
import { DropdownPanel, IconButton } from '@blocksense/ui';

import { useClickOutside } from '../../hooks/useClickOutside';
import { levelStyles } from '@blocksense/ui';
import { cn, type AppNotification } from '@blocksense/shared';

/**
 * Notifications are driven by the user's watchlist, not by sample content.
 *
 * There is no alert backend yet, so this renders an honest empty state rather
 * than fabricated alerts. A seeded list here would look like real findings
 * about real wallets, which is the one thing this panel must never do.
 */
export interface NotificationsMenuProps {
  /** Supplied by the watchlist layer once alerting exists. */
  notifications?: AppNotification[];
}

export function NotificationsMenu({ notifications = [] }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const unread = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <div ref={ref} className="relative">
      <IconButton icon={BellIcon} label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} onClick={() => setOpen((o) => !o)} />
      {unread > 0 && <span className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-bg" aria-hidden="true" />}
      <DropdownPanel open={open} className="w-[min(88vw,360px)]" label="Notifications">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={() => setReadIds(notifications.map((n) => n.id))} className="text-xs font-medium text-primary hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        {notifications.length === 0 ?
        <p className="px-3 pb-4 pt-1 text-sm leading-relaxed text-muted">
          No notifications yet. Add a wallet to your watchlist and alerts about changes in its
          behaviour will appear here.
        </p> :
        <ul>
          {notifications.map((n) => {
            const meta = levelStyles[n.level];
            const Icon = meta.icon;
            const read = readIds.includes(n.id);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    setReadIds((ids) => [...ids, n.id]);
                    setOpen(false);
                    navigate(n.to);
                  }}
                  className="flex w-full gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-subtle">

                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.badge)}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-sm', read ? 'text-muted' : 'font-medium text-ink')}>{n.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{n.body}</span>
                    <span className="mt-1 block text-[11px] text-muted">{n.minutesAgo < 60 ? `${n.minutesAgo} min ago` : `${Math.round(n.minutesAgo / 60)} h ago`}</span>
                  </span>
                </button>
              </li>);

          })}
        </ul>
        }
      </DropdownPanel>
    </div>);

}
