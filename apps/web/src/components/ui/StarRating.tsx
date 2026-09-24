import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showLabel?: boolean;
  label?: string;
  error?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: '1 - Necesita mejorar',
  2: '2 - Aceptable',
  3: '3 - Buena colaboración',
  4: '4 - Muy buen mentor',
  5: '5 - ¡Excelente experiencia!',
};

export function StarRating({
  value,
  onChange,
  maxStars = 5,
  size = 'md',
  readOnly = false,
  showLabel = true,
  label,
  error,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : value;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5"
          onMouseLeave={() => !readOnly && setHoverRating(null)}
          role="radiogroup"
          aria-label={label || 'Calificación en estrellas'}
        >
          {Array.from({ length: maxStars }, (_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= activeRating;

            return (
              <button
                key={starValue}
                type="button"
                role="radio"
                aria-checked={value === starValue}
                disabled={readOnly}
                onClick={() => onChange?.(starValue)}
                onMouseEnter={() => !readOnly && setHoverRating(starValue)}
                onFocus={() => !readOnly && setHoverRating(starValue)}
                onBlur={() => !readOnly && setHoverRating(null)}
                className={cn(
                  'rounded p-1 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
                  readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-115 active:scale-95',
                )}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    'transition-colors duration-200',
                    isFilled
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'fill-transparent text-slate-600 hover:text-slate-400',
                  )}
                />
              </button>
            );
          })}
        </div>

        {showLabel && activeRating > 0 && (
          <span className="text-xs font-medium text-amber-300 animate-fade-in">
            {RATING_LABELS[activeRating] || `${activeRating} / ${maxStars}`}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-400 animate-slide-down">{error}</p>}
    </div>
  );
}
