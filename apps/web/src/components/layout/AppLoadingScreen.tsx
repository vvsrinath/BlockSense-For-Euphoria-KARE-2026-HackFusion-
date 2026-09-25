import { BrandLogo } from '@blocksense/ui';

export function AppLoadingScreen() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-bg" role="status" aria-label="Loading BlockSense">
      <BrandLogo size={36} />
      <div className="h-1 w-32 overflow-hidden rounded-full bg-subtle">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
      </div>
    </div>);

}