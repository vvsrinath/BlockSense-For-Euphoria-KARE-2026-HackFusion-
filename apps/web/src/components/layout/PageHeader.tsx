import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { cn } from '@blocksense/shared';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: {to: string;label: string;};
  meta?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, back, meta, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0">
        {back &&
        <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-ink print:hidden">
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            {back.label}
          </Link>
        }
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted md:text-[15px]">{description}</div>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>);

}