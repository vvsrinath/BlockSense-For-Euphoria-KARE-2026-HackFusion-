import { useState, useEffect, useCallback } from 'react';
import { DownloadIcon, XIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@blocksense/ui';
import { cn } from '@blocksense/shared';

let deferredPrompt: Event | null = null;

export function useInstallPrompt(): { isAvailable: boolean; promptInstall: () => Promise<void> } {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsAvailable(true);
    };
    const onInstalled = () => setIsAvailable(false);

    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    const e = deferredPrompt as unknown as { preventDefault: () => void; prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    e.preventDefault();
    await e.prompt();
    const outcome = await e.userChoice;
    deferredPrompt = null;
    setIsAvailable(outcome.outcome === 'accepted');
  }, []);

  return { isAvailable, promptInstall };
}

interface PWAInstallProps {
  className?: string;
}

export function PWAInstall({ className }: PWAInstallProps) {
  const { isAvailable, promptInstall } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAvailable) setVisible(true);
  }, [isAvailable]);

  if (!visible) return null;

  return (
    <div className={cn('flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2', className)}>
      <DownloadIcon className="h-4 w-4 text-brand" aria-hidden="true" />
      <span className="text-xs font-medium text-ink">Install BlockSense</span>
      <Button
        size="sm"
        variant="soft"
        onClick={promptInstall}
        className="h-7 px-2 text-xs"
      >
        Add
      </Button>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss install prompt"
        className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-subtle hover:text-ink"
      >
        <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Offers a reload once a new service worker has taken over.
 *
 * The worker installs with `skipWaiting`, so it claims the page as soon as it
 * is ready and `controllerchange` fires. Reloading from inside that handler
 * pulls the rug out from under whatever the user was doing, so the change is
 * surfaced as a choice instead.
 */
export function PWAUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // Only relevant after the first worker is already in control; the very
    // first `controllerchange` is activation, not an update.
    if (!navigator.serviceWorker.controller) return;

    const onChange = () => setVisible(true);
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-pop sm:inset-x-auto sm:right-6 sm:w-auto"
    >
      <RefreshCwIcon className={cn('h-4 w-4 shrink-0 text-primary', reloading && 'animate-spin')} aria-hidden="true" />
      <span className="flex-1 text-sm font-medium text-ink">A new version is ready</span>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          setReloading(true);
          window.location.reload();
        }}
        className="h-8"
      >
        {reloading ? 'Updating…' : 'Update'}
      </Button>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss update notice"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-subtle hover:text-ink"
      >
        <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
