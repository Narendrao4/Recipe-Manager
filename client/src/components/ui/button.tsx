import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-terracotta text-white shadow-sm hover:bg-terracotta-dark',
  secondary: 'bg-forest text-cream shadow-sm hover:bg-forest-light dark:bg-cream dark:text-forest dark:hover:bg-cream-dark',
  outline: 'border border-forest/25 bg-white text-forest hover:border-terracotta hover:bg-cream-light dark:border-cream/20 dark:bg-forest-dark dark:text-cream dark:hover:bg-forest-light',
  ghost: 'text-forest hover:bg-cream-dark/60 dark:text-cream dark:hover:bg-forest-light',
  destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-11 px-5 py-2',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-12 px-7',
  icon: 'h-10 w-10',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        'dark:focus-visible:ring-offset-forest',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export default Button;
