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

export function PWAUpdateBanner() {
  const [visible] = useState(false);

  useEffect(() => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener?.('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
    return () => {};
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-line bg-surface px-5 py-3 shadow-card flex items-center gap-3">
      <span className="text-sm font-medium text-ink">A new version is ready</span>
      <Button
        size="sm"
        variant="primary"
        icon={RefreshCwIcon}
        onClick={() => window.location.reload()}
        className="h-8"
      >
        Update
      </Button>
    </div>
  );
}
