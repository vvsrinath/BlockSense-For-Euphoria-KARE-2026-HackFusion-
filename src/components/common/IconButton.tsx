import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { type LucideIcon } from "lucide-react";
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: 'xs' | 'sm' | 'md';
}
const sizes = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10'
};
const iconSizes = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-[18px] w-[18px]'
};
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({
  icon: Icon,
  label,
  size = 'md',
  className,
  ...rest
}, ref) {
  return <button ref={ref} type="button" aria-label={label} title={label} {...rest} className={cn('inline-flex shrink-0 items-center justify-center rounded-lg text-muted transition-[background-color,color] duration-150 ease-out hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50', sizes[size], className)}>
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </button>;
});