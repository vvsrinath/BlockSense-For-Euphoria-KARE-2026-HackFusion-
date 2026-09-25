import { ReactNode } from "react";
import { BrandLogo } from "../brand/BrandLogo";
import { cn } from "../../utils/cn";
import { type LucideIcon } from "lucide-react";
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
  className
}: EmptyStateProps) {
  return <div className={cn('mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface shadow-card">
        {Icon ? <Icon className="h-6 w-6 text-primary" aria-hidden="true" /> : <BrandLogo variant="mark" size={28} />}
      </div>
      <h2 className="mt-5 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
      {children && <div className="mt-8 w-full">{children}</div>}
    </div>;
}