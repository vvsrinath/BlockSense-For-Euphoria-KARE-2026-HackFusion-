import { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import { type LucideIcon } from "lucide-react";
type Variant = 'primary' | 'secondary' | 'ghost' | 'soft';
type Size = 'sm' | 'md' | 'lg';
interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  children?: ReactNode;
}
type NativeButtonProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
  to?: undefined;
};
type LinkButtonProps = BaseProps & {
  to: string;
  onClick?: () => void;
  'aria-label'?: string;
  target?: string;
  rel?: string;
};
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-sm hover:opacity-95',
  secondary: 'border border-line bg-surface text-ink hover:bg-subtle',
  ghost: 'text-muted hover:bg-subtle hover:text-ink',
  soft: 'bg-primary/10 text-primary hover:bg-primary/15'
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2'
};
const iconSizes: Record<Size, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-[18px] w-[18px]'
};
const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-[background-color,color,opacity,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50';
function isLink(props: NativeButtonProps | LinkButtonProps): props is LinkButtonProps {
  return typeof (props as LinkButtonProps).to === 'string';
}
export function Button(props: NativeButtonProps | LinkButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    className,
    children
  } = props;
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = <>
      {Icon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      {children}
      {IconRight && <IconRight className={iconSizes[size]} aria-hidden="true" />}
    </>;
  if (isLink(props)) {
    return <Link to={props.to} onClick={props.onClick} aria-label={props['aria-label']} className={classes}>
        {content}
      </Link>;
  }
  const {
    variant: _variant,
    size: _size,
    icon: _icon,
    iconRight: _iconRight,
    className: _className,
    children: _children,
    to: _to,
    ...rest
  } = props;
  return <button type="button" {...rest} className={classes}>
      {content}
    </button>;
}