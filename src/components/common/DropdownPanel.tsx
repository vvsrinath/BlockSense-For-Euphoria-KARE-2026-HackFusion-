import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DropdownPanelProps {
  open: boolean;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  id?: string;
  role?: string;
  label?: string;
}

export function DropdownPanel({ open, children, align = 'right', className, id, role, label }: DropdownPanelProps) {
  return (
    <AnimatePresence>
      {open &&
      <motion.div
        id={id}
        role={role}
        aria-label={label}
        initial={{ opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -4 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
        className={cn(
          'absolute top-full z-50 mt-2 rounded-xl border border-line bg-surface p-1 shadow-pop',
          align === 'right' ? 'right-0' : 'left-0',
          className
        )}>
        
          {children}
        </motion.div>
      }
    </AnimatePresence>);

}