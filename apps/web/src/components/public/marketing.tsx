import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, MinusIcon, type LucideIcon } from 'lucide-react';
import { Button } from '@blocksense/ui';
import { cn } from '@blocksense/shared';

/** Centred page heading used by every public page. */
export function PageIntro({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
      )}
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-[40px] md:leading-[1.1]">
        {title}
      </h1>
      {description && <p className="mt-4 text-[15px] leading-relaxed text-muted">{description}</p>}
      {children && <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}

/** Consistent vertical rhythm between page sections. */
export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('mx-auto w-full max-w-content px-4 py-14 md:px-6 md:py-20 lg:px-8', className)}>{children}</section>;
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">{title}</h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

/** A card with an icon, used for features, use cases, and security points. */
export function InfoCard({
  icon: Icon,
  title,
  body,
  className
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-5 shadow-card', className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

/** Closing call to action. */
export function CtaBand({
  title,
  description,
  primary,
  secondary
}: {
  title: string;
  description: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <div className="rounded-2xl border border-line bg-gradient-to-br from-primary/[0.08] to-transparent p-8 text-center md:p-10">
      <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button to={primary.to} iconRight={ArrowRightIcon} size="lg">
          {primary.label}
        </Button>
        {secondary && (
          <Button to={secondary.to} variant="secondary" size="lg">
            {secondary.label}
          </Button>
        )}
      </div>
    </div>
  );
}

/** A yes/no list, used by the Scope page. */
export function TruthList({ items, tone }: { items: string[]; tone: 'yes' | 'no' }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = tone === 'yes' ? CheckIcon : MinusIcon;
        return (
          <li key={item} className="flex gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                tone === 'yes' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning-ink'
              )}>
              <Icon className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className="text-sm leading-relaxed text-muted">{item}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Text link with a trailing arrow, for "read more" affordances. */
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-150 hover:underline">
      {children}
      <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}
