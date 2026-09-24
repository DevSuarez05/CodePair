'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileCode2,
  Calendar,
  Clock,
  Code,
  Terminal,
  Eye,
  PenTool,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PriorityBadge } from '@/components/ui/Badge';
import {
  createHelpRequestSchema,
  CreateHelpRequestFormData,
  PROGRAMMING_LANGUAGES,
  HELP_REQUEST_PRIORITIES,
} from '@/lib/validations';
import apiClient from '@/lib/api-client';

// Catálogo de tecnologías para autocompletado
const AVAILABLE_SKILLS = [
  { id: '1a111111-1111-1111-1111-111111111101', name: 'React', category: 'Frontend', defaultLang: 'JAVASCRIPT' },
  { id: '1a111111-1111-1111-1111-111111111102', name: 'Node.js', category: 'Backend', defaultLang: 'JAVASCRIPT' },
  { id: '1a111111-1111-1111-1111-111111111103', name: 'TypeScript', category: 'Language', defaultLang: 'TYPESCRIPT' },
  { id: '1a111111-1111-1111-1111-111111111104', name: 'Python', category: 'Language', defaultLang: 'PYTHON' },
  { id: '1a111111-1111-1111-1111-111111111105', name: 'MySQL', category: 'Database', defaultLang: 'SQL' },
  { id: '1a111111-1111-1111-1111-111111111106', name: 'PostgreSQL', category: 'Database', defaultLang: 'SQL' },
  { id: '1a111111-1111-1111-1111-111111111107', name: 'JWT & Auth', category: 'Security', defaultLang: 'TYPESCRIPT' },
  { id: '1a111111-1111-1111-1111-111111111108', name: 'SQL', category: 'Database', defaultLang: 'SQL' },
  { id: '1a111111-1111-1111-1111-111111111109', name: 'Docker', category: 'DevOps', defaultLang: 'OTHER' },
  { id: '1a111111-1111-1111-1111-111111111110', name: 'Next.js', category: 'Frontend', defaultLang: 'TYPESCRIPT' },
  { id: '1a111111-1111-1111-1111-111111111111', name: 'NestJS', category: 'Backend', defaultLang: 'TYPESCRIPT' },
  { id: '1a111111-1111-1111-1111-111111111112', name: 'Git & GitHub', category: 'Tools', defaultLang: 'OTHER' },
];

export interface CreateRequestFormProps {
  onSuccess?: (request: unknown) => void;
  onCancel?: () => void;
}

export function CreateRequestForm({ onSuccess, onCancel }: CreateRequestFormProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [skillSearch, setSkillSearch] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fechas por defecto: ahora + 2 horas
  const now = new Date();
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const toLocalISO = (d: Date) => d.toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateHelpRequestFormData>({
    resolver: zodResolver(createHelpRequestSchema),
    defaultValues: {
      title: '',
      skillId: AVAILABLE_SKILLS[0].id,
      language: 'TYPESCRIPT',
      description: '',
      codeSnippet: '',
      errorMessage: '',
      priority: 'MEDIUM',
      estimatedMinutes: 30,
      availableFrom: toLocalISO(now),
      availableTo: toLocalISO(later),
    },
  });

  const selectedSkillId = watch('skillId');
  const descriptionText = watch('description') || '';
  const currentPriority = watch('priority');
  const selectedSkill = AVAILABLE_SKILLS.find((s) => s.id === selectedSkillId);

  // Filtrar tecnologías por búsqueda
  const filteredSkills = AVAILABLE_SKILLS.filter(
    (skill) =>
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      skill.category.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const onSubmit = async (data: CreateHelpRequestFormData) => {
    setServerError(null);
    try {
      // Convertir a ISO 8601 strings para el backend
      const payload = {
        skillId: data.skillId,
        title: data.title,
        description: data.description,
        codeSnippet: data.codeSnippet || undefined,
        errorMessage: data.errorMessage || undefined,
        language: data.language,
        priority: data.priority,
        estimatedMinutes: data.estimatedMinutes,
        availableFrom: new Date(data.availableFrom).toISOString(),
        availableTo: new Date(data.availableTo).toISOString(),
      };

      const res = await apiClient.post('/requests', payload);
      setIsSuccess(true);
      onSuccess?.(res.data);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al publicar la solicitud. Verifica los campos e inténtalo de nuevo.';
      setServerError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  // Renderizador simplificado de Markdown para vista previa
  const renderMarkdownPreview = (text: string) => {
    if (!text.trim()) {
      return (
        <p className="text-slate-500 italic">
          No hay descripción para previsualizar. Escribe en la pestaña &quot;Editor&quot;.
        </p>
      );
    }

    return (
      <div className="markdown-preview space-y-3">
        {text.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-brand-300">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-bold text-brand-400">
                {paragraph.replace('## ', '')}
              </h2>
            );
          }
          if (paragraph.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-xl font-bold text-brand-500">
                {paragraph.replace('# ', '')}
              </h1>
            );
          }
          if (paragraph.startsWith('```')) {
            const clean = paragraph.replace(/```[a-z]*\n?/g, '');
            return (
              <pre
                key={idx}
                className="rounded-lg bg-surface-300/80 p-3 text-xs font-mono text-cyan-300 border border-slate-800 overflow-x-auto"
              >
                <code>{clean}</code>
              </pre>
            );
          }
          if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
            return (
              <ul key={idx} className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                {paragraph.split('\n').map((li, liIdx) => (
                  <li key={liIdx}>{li.replace(/^[-*]\s+/, '')}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={idx} className="text-sm text-slate-300 leading-relaxed">
              {paragraph}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-800 bg-surface-200/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Publicar Solicitud de Ayuda</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Describe tu Bloqueo Técnico
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Un compañero mentor se emparejará contigo en una sesión en vivo de Pair Programming
          </p>
        </div>
      </div>

      {/* Alerta de error */}
      {serverError && (
        <div className="mb-6 rounded-lg bg-red-950/60 border border-red-500/40 p-4 text-sm text-red-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Error al publicar solicitud</p>
            <p className="text-xs text-red-300/90 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Alerta de éxito */}
      {isSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-950/60 border border-emerald-500/40 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold">¡Solicitud publicada en el feed!</p>
            <p className="text-xs text-emerald-300/90">
              Pronto un mentor revisará tu solicitud para iniciar el pairing.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Título de la solicitud */}
        <Input
          label="Título conciso del problema"
          placeholder="Ej: Error de hidratación en Next.js al renderizar cookies en SSR"
          leftIcon={<HelpCircle className="h-4 w-4" />}
          error={errors.title?.message}
          helperText="Resume el problema específico y la tecnología involucrada"
          required
          {...register('title')}
        />

        {/* Tecnología con autocompletado + Lenguaje Principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Autocompletado de Tecnología */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tecnología / Skill <span className="text-red-400">*</span>
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                className="w-full flex items-center justify-between rounded-lg bg-surface-100 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode2 className="h-4 w-4 text-brand-400 shrink-0" />
                  <span className="font-medium text-white truncate">
                    {selectedSkill ? selectedSkill.name : 'Selecciona una tecnología...'}
                  </span>
                  {selectedSkill && (
                    <span className="text-xs text-slate-500">({selectedSkill.category})</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              </button>

              {/* Menú desplegable con autocompletado */}
              {isSkillDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-slate-800 bg-surface-100 p-2 shadow-2xl backdrop-blur-xl animate-slide-down">
                  <Input
                    placeholder="Filtrar tecnología..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    autoFocus
                    className="h-8 text-xs mb-2"
                  />

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredSkills.length === 0 ? (
                      <p className="p-2 text-center text-xs text-slate-500">
                        No se encontraron tecnologías
                      </p>
                    ) : (
                      filteredSkills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => {
                            setValue('skillId', skill.id, { shouldValidate: true });
                            setIsSkillDropdownOpen(false);
                            setSkillSearch('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            skill.id === selectedSkillId
                              ? 'bg-brand-600 text-white font-semibold'
                              : 'text-slate-300 hover:bg-surface-50 hover:text-white'
                          }`}
                        >
                          <span>{skill.name}</span>
                          <span className="text-[10px] opacity-75">{skill.category}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.skillId && <p className="text-xs text-red-400">{errors.skillId.message}</p>}
          </div>

          {/* Selector de Lenguaje de Programación */}
          <div className="space-y-1.5">
            <label
              htmlFor="language"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Lenguaje <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                id="language"
                className="w-full rounded-lg bg-surface-100 border border-slate-800 text-slate-100 text-sm py-2.5 px-3.5 outline-none hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer appearance-none"
                {...register('language')}
              >
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang} className="bg-surface-200">
                    {lang}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-3 text-slate-500 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Editor de Descripción con Soporte Markdown y Vista Previa */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Descripción del Bloqueo <span className="text-red-400">*</span>
            </label>

            {/* Pestañas Editor / Vista Previa */}
            <div className="flex items-center rounded-lg bg-surface-100 p-0.5 border border-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition-all ${
                  activeTab === 'write'
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PenTool className="h-3 w-3" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition-all ${
                  activeTab === 'preview'
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Vista Previa</span>
              </button>
            </div>
          </div>

          {activeTab === 'write' ? (
            <Textarea
              placeholder="Explica qué intentas lograr, qué has probado y en qué punto te encuentras bloqueado. Puedes usar formato Markdown (## títulos, `código`, ```bloques```, etc.)..."
              rows={6}
              error={errors.description?.message}
              charCount={{ current: descriptionText.length, max: 10000 }}
              {...register('description')}
            />
          ) : (
            <div className="min-h-[160px] rounded-lg border border-slate-800 bg-surface-100/50 p-4">
              {renderMarkdownPreview(descriptionText)}
            </div>
          )}
        </div>

        {/* Snippets Opcionales: Código y Mensaje de Error */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Code className="h-3.5 w-3.5 text-cyan-400" />
              <span>Snippet de Código Relevante (Opcional)</span>
            </div>
            <textarea
              className="w-full rounded-lg bg-surface-300/80 border border-slate-800 text-cyan-300 font-mono text-xs p-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 h-28"
              placeholder="// Pega aquí las líneas clave de tu código..."
              {...register('codeSnippet')}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Terminal className="h-3.5 w-3.5 text-red-400" />
              <span>Mensaje de Error / Stack Trace (Opcional)</span>
            </div>
            <textarea
              className="w-full rounded-lg bg-surface-300/80 border border-slate-800 text-red-300 font-mono text-xs p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 h-28"
              placeholder="TypeError: Cannot read properties of undefined..."
              {...register('errorMessage')}
            />
          </div>
        </div>

        {/* Prioridad y Tiempo Estimado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Prioridad */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nivel de Prioridad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {HELP_REQUEST_PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setValue('priority', priority)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                    currentPriority === priority
                      ? 'border-brand-500 bg-brand-950/60 text-white shadow-md'
                      : 'border-slate-800 bg-surface-100 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <PriorityBadge priority={priority} />
                </button>
              ))}
            </div>
          </div>

          {/* Tiempo estimado */}
          <div className="space-y-1.5">
            <label
              htmlFor="estimatedMinutes"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Duración Estimada (Minutos)
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                id="estimatedMinutes"
                type="number"
                min={10}
                max={240}
                step={5}
                className="w-full rounded-lg bg-surface-100 border border-slate-800 text-slate-100 text-sm py-2.5 pl-10 pr-4 outline-none hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                {...register('estimatedMinutes', { valueAsNumber: true })}
              />
            </div>
            {errors.estimatedMinutes && (
              <p className="text-xs text-red-400">{errors.estimatedMinutes.message}</p>
            )}
          </div>
        </div>

        {/* Disponibilidad Horaria (availableFrom & availableTo) */}
        <div className="space-y-3 rounded-xl border border-slate-800/80 bg-surface-100/40 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Disponibilidad Horaria para el Pairing
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Define la ventana en la que tienes disponibilidad para conectarte a la sesión
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label
                htmlFor="availableFrom"
                className="block text-[11px] font-semibold text-slate-400"
              >
                Disponible Desde <span className="text-red-400">*</span>
              </label>
              <input
                id="availableFrom"
                type="datetime-local"
                className="w-full rounded-lg bg-surface-200 border border-slate-800 text-slate-200 text-xs py-2 px-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                {...register('availableFrom')}
              />
              {errors.availableFrom && (
                <p className="text-xs text-red-400">{errors.availableFrom.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="availableTo"
                className="block text-[11px] font-semibold text-slate-400"
              >
                Disponible Hasta <span className="text-red-400">*</span>
              </label>
              <input
                id="availableTo"
                type="datetime-local"
                className="w-full rounded-lg bg-surface-200 border border-slate-800 text-slate-200 text-xs py-2 px-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                {...register('availableTo')}
              />
              {errors.availableTo && (
                <p className="text-xs text-red-400">{errors.availableTo.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}

          <Button
            type="submit"
            variant="glow"
            size="lg"
            isLoading={isSubmitting}
            className="font-semibold px-8"
          >
            Publicar Solicitud de Ayuda
          </Button>
        </div>
      </form>
    </div>
  );
}
