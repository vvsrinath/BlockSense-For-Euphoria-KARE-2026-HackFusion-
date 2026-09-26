import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageContainer } from './PageContainer';
import { MobileSidebarProvider } from '../../stores/MobileSidebarContext';
import { Skeleton } from '@blocksense/ui';

function PageFallback() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </PageContainer>);

}

export function AppLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <MobileSidebarProvider>
      <div className="flex min-h-screen w-full bg-bg text-ink">
        <a href="#main" className="sr-only z-50 rounded-lg bg-surface px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          Skip to content
        </a>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main" className="flex-1 pb-24 md:pb-0 print:pb-0">
            <Suspense fallback={<PageFallback />}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
                <Outlet />
              </motion.div>
            </Suspense>
          </main>
        </div>
        <MobileNav />
      </div>
    </MobileSidebarProvider>);

}