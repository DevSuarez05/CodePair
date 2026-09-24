import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  charCount?: { current: number; max: number };
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      charCount,
      containerClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const textareaId = id || props.name;

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              {label}
              {props.required && <span className="ml-1 text-red-400">*</span>}
            </label>
          )}

          {charCount && (
            <span
              className={cn(
                'text-xs',
                charCount.current > charCount.max
                  ? 'text-red-400 font-medium'
                  : 'text-slate-500',
              )}
            >
              {charCount.current} / {charCount.max}
            </span>
          )}
        </div>

        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'w-full rounded-lg bg-surface-100 border text-slate-100 placeholder-slate-500 text-sm transition-all duration-200 outline-none',
            'py-2.5 px-3.5 min-h-[100px] leading-relaxed',
            error
              ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-800 hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            className,
          )}
          {...props}
        />

        {error ? (
          <div className="flex items-center gap-1.5 text-xs text-red-400 animate-slide-down">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
