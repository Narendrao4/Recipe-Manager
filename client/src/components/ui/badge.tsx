import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-terracotta text-white',
  secondary: 'bg-forest/10 text-forest dark:bg-cream/10 dark:text-cream',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100',
};

const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
      variants[variant],
      className
    )}
    {...props}
  />
);

export default Badge;
