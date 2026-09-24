'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Mail,
  Lock,
  Globe,
  Code2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProficiencyBadge } from '@/components/ui/Badge';
import {
  registerFormSchema,
  RegisterFormData,
  PROGRAMMING_LANGUAGES,
  ProficiencyLevelKey,
} from '@/lib/validations';
import apiClient from '@/lib/api-client';

// Catálogo por defecto de skills para selección rápida
const PRESET_SKILLS = [
  { id: '1a111111-1111-1111-1111-111111111101', name: 'React', category: 'Frontend' },
  { id: '1a111111-1111-1111-1111-111111111102', name: 'Node.js', category: 'Backend' },
  { id: '1a111111-1111-1111-1111-111111111103', name: 'TypeScript', category: 'Language' },
  { id: '1a111111-1111-1111-1111-111111111104', name: 'Python', category: 'Language' },
  { id: '1a111111-1111-1111-1111-111111111105', name: 'MySQL', category: 'Database' },
  { id: '1a111111-1111-1111-1111-111111111106', name: 'PostgreSQL', category: 'Database' },
  { id: '1a111111-1111-1111-1111-111111111107', name: 'JWT & Auth', category: 'Security' },
  { id: '1a111111-1111-1111-1111-111111111108', name: 'SQL', category: 'Database' },
  { id: '1a111111-1111-1111-1111-111111111109', name: 'Docker', category: 'DevOps' },
  { id: '1a111111-1111-1111-1111-111111111110', name: 'Next.js', category: 'Frontend' },
  { id: '1a111111-1111-1111-1111-111111111111', name: 'NestJS', category: 'Backend' },
  { id: '1a111111-1111-1111-1111-111111111112', name: 'Git & GitHub', category: 'Tools' },
];

const COMMON_TIMEZONES = [
  { value: 'America/Mexico_City', label: 'América / Ciudad de México (GMT-6)' },
  { value: 'America/Bogota', label: 'América / Bogotá (GMT-5)' },
  { value: 'America/Lima', label: 'América / Lima (GMT-5)' },
  { value: 'America/Santiago', label: 'América / Santiago (GMT-4 / GMT-3)' },
  { value: 'America/Buenos_Aires', label: 'América / Buenos Aires (GMT-3)' },
  { value: 'America/New_York', label: 'América / New York (GMT-5 / GMT-4)' },
  { value: 'America/Los_Angeles', label: 'América / Los Angeles (GMT-8 / GMT-7)' },
  { value: 'Europe/Madrid', label: 'Europa / Madrid (GMT+1 / GMT+2)' },
  { value: 'UTC', label: 'Tiempo Universal Coordinado (UTC)' },
];

export interface RegisterFormProps {
  onSuccess?: (data: unknown) => void;
  onNavigateToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onNavigateToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  // Detección automática del timezone del navegador
  const detectedTimezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      timezone: detectedTimezone || 'UTC',
      preferredLanguage: 'TYPESCRIPT',
      skills: [
        {
          skillId: PRESET_SKILLS[0].id,
          skillName: PRESET_SKILLS[0].name,
          level: 'INTERMEDIATE',
        },
        {
          skillId: PRESET_SKILLS[2].id,
          skillName: PRESET_SKILLS[2].name,
          level: 'ADVANCED',
        },
      ],
    },
  });

  const selectedSkills = watch('skills') || [];

  // Agregar una habilidad
  const handleAddSkill = (preset: { id: string; name: string }) => {
    if (selectedSkills.some((s) => s.skillId === preset.id)) return;
    setValue('skills', [
      ...selectedSkills,
      { skillId: preset.id, skillName: preset.name, level: 'INTERMEDIATE' },
    ], { shouldValidate: true });
    setSkillSearchQuery('');
  };

  // Remover una habilidad
  const handleRemoveSkill = (skillId: string) => {
    setValue(
      'skills',
      selectedSkills.filter((s) => s.skillId !== skillId),
      { shouldValidate: true },
    );
  };

  // Ciclar nivel de habilidad: BEGINNER -> INTERMEDIATE -> ADVANCED -> BEGINNER
  const handleCycleSkillLevel = (skillId: string) => {
    const cycleMap: Record<ProficiencyLevelKey, ProficiencyLevelKey> = {
      BEGINNER: 'INTERMEDIATE',
      INTERMEDIATE: 'ADVANCED',
      ADVANCED: 'BEGINNER',
    };

    const updated = selectedSkills.map((s) => {
      if (s.skillId === skillId) {
        return { ...s, level: cycleMap[s.level] };
      }
      return s;
    });

    setValue('skills', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        displayName: data.displayName,
        username: data.username,
        email: data.email,
        password: data.password,
        timezone: data.timezone,
        preferredLanguage: data.preferredLanguage,
        skills: data.skills.map((s) => ({
          skillId: s.skillId,
          level: s.level,
        })),
      });

      setIsSuccess(true);
      onSuccess?.(response.data);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al crear la cuenta. Inténtalo nuevamente.';
      setServerError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  // Filtrado de habilidades no agregadas aún
  const availableSkills = PRESET_SKILLS.filter(
    (skill) =>
      !selectedSkills.some((s) => s.skillId === skill.id) &&
      skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()),
  );

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-surface-200/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400 mb-3 shadow-inner">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Crea tu Perfil en CodePair
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Únete a la comunidad de Pair Programming colaborativo entre desarrolladores
        </p>
      </div>

      {/* Alerta de error global */}
      {serverError && (
        <div className="mb-6 rounded-lg bg-red-950/60 border border-red-500/40 p-4 text-sm text-red-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Error en el registro</p>
            <p className="text-xs text-red-300/90 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Alerta de éxito */}
      {isSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-950/60 border border-emerald-500/40 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold">¡Cuenta creada con éxito!</p>
            <p className="text-xs text-emerald-300/90">
              Redirigiendo a tu panel de bienvenida...
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Sección: Datos Personales */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
            1. Datos de la Cuenta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre para mostrar"
              placeholder="Ej. Linus Torvalds"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.displayName?.message}
              required
              {...register('displayName')}
            />

            <Input
              label="Nombre de usuario (slug)"
              placeholder="ej. linus_dev"
              leftIcon={<span className="text-xs font-mono font-bold text-slate-500">@</span>}
              error={errors.username?.message}
              required
              {...register('username')}
            />
          </div>

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="desarrollador@ejemplo.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              helperText="Min. 8 caracteres, mayúscula, número y símbolo"
              error={errors.password?.message}
              required
              {...register('password')}
            />

            <Input
              label="Confirmar contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword')}
            />
          </div>
        </div>

        {/* Sección: Preferencias Regionales e Idioma */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
            2. Preferencias & Entorno
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selector de Timezone */}
            <div className="space-y-1.5">
              <label
                htmlFor="timezone"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Zona Horaria <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <select
                  id="timezone"
                  className="w-full rounded-lg bg-surface-100 border border-slate-800 text-slate-100 text-sm py-2.5 pl-10 pr-4 outline-none hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  {...register('timezone')}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-surface-200 text-slate-200">
                      {tz.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-3 text-slate-500 text-xs">
                  ▼
                </div>
              </div>
              {errors.timezone && (
                <p className="text-xs text-red-400">{errors.timezone.message}</p>
              )}
            </div>

            {/* Selector de Lenguaje Principal */}
            <div className="space-y-1.5">
              <label
                htmlFor="preferredLanguage"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Lenguaje Preferido <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Code2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <select
                  id="preferredLanguage"
                  className="w-full rounded-lg bg-surface-100 border border-slate-800 text-slate-100 text-sm py-2.5 pl-10 pr-4 outline-none hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  {...register('preferredLanguage')}
                >
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-surface-200 text-slate-200">
                      {lang}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-3 text-slate-500 text-xs">
                  ▼
                </div>
              </div>
              {errors.preferredLanguage && (
                <p className="text-xs text-red-400">{errors.preferredLanguage.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sección: Selector Dinámico de Skills con Badges Interactivos (HU-01) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                3. Habilidades Técnicas & Nivel
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Haz clic en el badge de nivel para cambiar entre Principiante, Intermedio y Avanzado
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-surface-50 px-2 py-1 rounded-md border border-slate-800">
              {selectedSkills.length} seleccionada(s)
            </span>
          </div>

          {/* Lista de Skills Seleccionadas */}
          <div className="space-y-2">
            {selectedSkills.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                No has añadido ninguna habilidad. Elige de la lista abajo para comenzar.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedSkills.map((skill) => (
                  <div
                    key={skill.skillId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-surface-100/90 px-3.5 py-2 transition-all hover:border-slate-700 shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Code2 className="h-4 w-4 text-brand-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-200 truncate">
                        {skill.skillName || 'Habilidad'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Badge interactivo con selector de nivel */}
                      <ProficiencyBadge
                        level={skill.level}
                        interactive={true}
                        onCycle={() => handleCycleSkillLevel(skill.skillId)}
                      />

                      {/* Botón eliminar habilidad */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill.skillId)}
                        className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-surface-50 transition-colors"
                        title="Eliminar habilidad"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.skills && (
              <p className="text-xs text-red-400 animate-slide-down flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.skills.message}
              </p>
            )}
          </div>

          {/* Buscador y Añadidor de Habilidades Rápidas */}
          <div className="rounded-xl border border-slate-800/70 bg-surface-100/40 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar o añadir tecnología (ej. Docker, React, Python)..."
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                containerClassName="flex-1"
                className="h-9 text-xs"
              />
            </div>

            {availableSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableSkills.slice(0, 8).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAddSkill(preset)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-surface-50 px-2.5 py-1 text-xs text-slate-300 hover:border-brand-500/50 hover:bg-brand-950/40 hover:text-brand-300 transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-slate-500">({preset.category})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botón de Enviar */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="glow"
            size="lg"
            isLoading={isSubmitting}
            className="w-full text-base font-semibold"
          >
            Crear Perfil de Desarrollador
          </Button>

          <p className="mt-4 text-center text-xs text-slate-400">
            ¿Ya tienes una cuenta registrada?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
