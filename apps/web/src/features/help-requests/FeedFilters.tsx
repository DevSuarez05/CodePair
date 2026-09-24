'use client';

import React from 'react';
import { Search, Filter, X, Code2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PROGRAMMING_LANGUAGES } from '@/lib/validations';

export interface FeedFilterState {
  search: string;
  skillId: string;
  language: string;
  status: string;
}

export interface FeedFiltersProps {
  filters: FeedFilterState;
  onChange: (filters: FeedFilterState) => void;
  availableSkills?: Array<{ id: string; name: string; category: string }>;
  totalCount?: number;
}

export function FeedFilters({
  filters,
  onChange,
  availableSkills = [],
  totalCount,
}: FeedFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.skillId) ||
    Boolean(filters.language) ||
    Boolean(filters.status);

  const handleClearFilters = () => {
    onChange({
      search: '',
      skillId: '',
      language: '',
      status: '',
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-surface-100/90 p-4 shadow-lg backdrop-blur-md space-y-3">
      {/* Barra Superior: Búsqueda y Contador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Input
            placeholder="Buscar por título, problema o tecnología..."
            leftIcon={<Search className="h-4 w-4" />}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {typeof totalCount === 'number' && (
            <span className="text-xs font-semibold text-slate-400 bg-surface-50 px-3 py-1.5 rounded-lg border border-slate-800">
              {totalCount} solicitud{totalCount === 1 ? '' : 'es'}
            </span>
          )}

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<X className="h-3.5 w-3.5" />}
              className="text-xs text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-950/30"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Barra Inferior: Selectores Reactivos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
        {/* Filtro por Tecnología */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Filter className="h-3 w-3 text-brand-400" />
            <span>Tecnología</span>
          </label>
          <div className="relative">
            <select
              value={filters.skillId}
              onChange={(e) => onChange({ ...filters, skillId: e.target.value })}
              className="w-full rounded-lg bg-surface-200 border border-slate-800 text-slate-200 text-xs py-2 px-3 outline-none hover:border-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer"
            >
              <option value="">Todas las tecnologías</option>
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.id} className="bg-surface-200 text-slate-200">
                  {skill.name} ({skill.category})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-2.5 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Filtro por Lenguaje */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Code2 className="h-3 w-3 text-cyan-400" />
            <span>Lenguaje</span>
          </label>
          <div className="relative">
            <select
              value={filters.language}
              onChange={(e) => onChange({ ...filters, language: e.target.value })}
              className="w-full rounded-lg bg-surface-200 border border-slate-800 text-slate-200 text-xs py-2 px-3 outline-none hover:border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none cursor-pointer"
            >
              <option value="">Todos los lenguajes</option>
              {PROGRAMMING_LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-surface-200 text-slate-200">
                  {lang}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-2.5 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Filtro por Estado */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Estado</span>
          </label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
              className="w-full rounded-lg bg-surface-200 border border-slate-800 text-slate-200 text-xs py-2 px-3 outline-none hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="OPEN" className="bg-surface-200 text-emerald-400">
                🟢 Abierta (Listo para pairing)
              </option>
              <option value="IN_PROGRESS" className="bg-surface-200 text-cyan-400">
                🔵 En progreso
              </option>
              <option value="RESOLVED" className="bg-surface-200 text-slate-400">
                ⚪ Resuelta
              </option>
            </select>
            <div className="pointer-events-none absolute right-3 top-2.5 text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
