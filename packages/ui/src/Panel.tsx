import { useId, type ReactNode } from 'react';
import { cn } from '@blocksense/shared';

interface PanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headingLevel?: 'h2' | 'h3';
}

export function Panel({ title, description, action, children, className, bodyClassName, headingLevel = 'h2' }: PanelProps) {
  const headingId = useId();
  const Heading = headingLevel;
  return (
    <section aria-labelledby={title ? headingId : undefined} className={cn('rounded-2xl border border-line bg-surface shadow-card', className)}>
      {title &&
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6">
          <div className="min-w-0">
            <Heading id={headingId} className="text-[15px] font-semibold text-ink">
              {title}
            </Heading>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      }
      <div className={cn(title ? 'px-5 pb-5 pt-4 md:px-6 md:pb-6' : 'p-5 md:p-6', bodyClassName)}>{children}</div>
    </section>);

}