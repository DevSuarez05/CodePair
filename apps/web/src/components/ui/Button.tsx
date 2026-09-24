import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-200 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 focus:ring-brand-500 border border-brand-500/30',
      secondary:
        'bg-surface-50 hover:bg-surface-100 text-slate-200 border border-slate-700/60 focus:ring-slate-400',
      outline:
        'bg-transparent hover:bg-surface-50 text-slate-300 border border-slate-700 focus:ring-slate-500',
      ghost:
        'bg-transparent hover:bg-surface-50/70 text-slate-300 hover:text-white focus:ring-slate-500',
      danger:
        'bg-red-600/90 hover:bg-red-600 text-white shadow-lg shadow-red-600/20 focus:ring-red-500 border border-red-500/30',
      accent:
        'bg-accent-cyan hover:bg-cyan-300 text-surface-300 font-semibold shadow-lg shadow-accent-cyan/20 focus:ring-accent-cyan',
      glow:
        'bg-gradient-to-r from-brand-600 via-accent-purple to-accent-cyan hover:opacity-95 text-white font-semibold shadow-lg shadow-brand-500/30 border border-white/10 animate-pulse-glow',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-6 py-3 gap-2.5 h-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            <span>Cargando...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
