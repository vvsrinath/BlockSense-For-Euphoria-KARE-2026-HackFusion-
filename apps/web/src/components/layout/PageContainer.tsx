import { type ReactNode } from 'react';
import { cn } from '@blocksense/shared';

export function PageContainer({ children, className }: {children: ReactNode;className?: string;}) {
  return <div className={cn('mx-auto w-full max-w-content px-4 py-6 md:px-6 lg:px-8 lg:py-8', className)}>{children}</div>;
}