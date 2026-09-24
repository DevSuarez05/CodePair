import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Zap, Flame, ShieldAlert } from 'lucide-react';
import type { ProficiencyLevelKey } from '@/lib/validations';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'cyan' | 'purple' | 'green' | 'amber' | 'red' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-surface-50 text-slate-300 border-slate-700/60',
    brand: 'bg-brand-950/70 text-brand-300 border-brand-500/30',
    cyan: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-500/30',
    green: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
    red: 'bg-red-950/70 text-red-300 border-red-500/30',
    outline: 'bg-transparent text-slate-400 border-slate-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border transition-colors',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Interactive Proficiency Badge for Skills (HU-01) ─────────

interface ProficiencyBadgeProps {
  level: ProficiencyLevelKey;
  interactive?: boolean;
  onCycle?: () => void;
  className?: string;
}

export function ProficiencyBadge({
  level,
  interactive = false,
  onCycle,
  className,
}: ProficiencyBadgeProps) {
  const configs: Record<
    ProficiencyLevelKey,
    { label: string; icon: React.ReactNode; color: string; hoverColor: string }
  > = {
    BEGINNER: {
      label: 'Principiante',
      icon: <Sparkles className="h-3 w-3" />,
      color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      hoverColor: 'hover:bg-emerald-900/90 hover:border-emerald-400',
    },
    INTERMEDIATE: {
      label: 'Intermedio',
      icon: <Zap className="h-3 w-3" />,
      color: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
      hoverColor: 'hover:bg-cyan-900/90 hover:border-cyan-400',
    },
    ADVANCED: {
      label: 'Avanzado',
      icon: <Flame className="h-3 w-3" />,
      color: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
      hoverColor: 'hover:bg-purple-900/90 hover:border-purple-400',
    },
  };

  const config = configs[level];

  return (
    <button
      type="button"
      onClick={interactive ? onCycle : undefined}
      disabled={!interactive}
      title={interactive ? 'Haz clic para cambiar el nivel de habilidad' : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all duration-150',
        config.color,
        interactive && ['cursor-pointer active:scale-95 shadow-sm', config.hoverColor],
        !interactive && 'cursor-default',
        className,
      )}
    >
      {config.icon}
      <span>{config.label}</span>
      {interactive && <span className="text-[10px] opacity-70">▾</span>}
    </button>
  );
}

// ─── Priority Badge for Requests (HU-02 / HU-03) ──────────────

export function PriorityBadge({ priority }: { priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) {
  const styles = {
    LOW: 'bg-slate-800/80 text-slate-300 border-slate-700',
    MEDIUM: 'bg-blue-950/70 text-blue-300 border-blue-500/40',
    HIGH: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    CRITICAL: 'bg-red-950/80 text-red-300 border-red-500/50 animate-pulse',
  };

  const labels = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        styles[priority],
      )}
    >
      {priority === 'CRITICAL' && <ShieldAlert className="h-3 w-3" />}
      {labels[priority]}
    </span>
  );
}

// ─── Status Badge for Requests ────────────────────────────────

export function StatusBadge({ status }: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | 'EXPIRED' }) {
  const styles = {
    OPEN: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40',
    IN_PROGRESS: 'bg-cyan-950/70 text-cyan-400 border-cyan-500/40',
    RESOLVED: 'bg-slate-800 text-slate-400 border-slate-700',
    CANCELLED: 'bg-red-950/50 text-red-400 border-red-800/40',
    EXPIRED: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  };

  const labels = {
    OPEN: 'Abierta',
    IN_PROGRESS: 'En Sesión',
    RESOLVED: 'Resuelta',
    CANCELLED: 'Cancelada',
    EXPIRED: 'Expirada',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
