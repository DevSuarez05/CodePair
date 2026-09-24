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
  GraduationCap,
  Award,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle,
  Search,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProficiencyBadge } from '@/components/ui/Badge';
import {
  registerFormSchema,
  RegisterFormData,
  PROGRAMMING_LANGUAGES,
  ProficiencyLevelKey,
  USER_LANGUAGES_LIST,
} from '@/lib/validations';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Catálogo enriquecido de skills para selección rápida
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
  { value: 'UTC-5', label: 'UTC-5 (Bogotá, Lima, Quito, Panamá, Kingston)' },
  { value: 'UTC-6', label: 'UTC-6 (Ciudad de México, Guadalajara, San José)' },
  { value: 'UTC-4', label: 'UTC-4 (Santiago, La Paz, Asunción, Caracas)' },
  { value: 'UTC-3', label: 'UTC-3 (Buenos Aires, Montevideo, São Paulo, Brasilia)' },
  { value: 'UTC-7', label: 'UTC-7 (Tijuana, Phoenix, Denver)' },
  { value: 'UTC-8', label: 'UTC-8 (Los Ángeles, San Francisco, Vancouver)' },
  { value: 'UTC+1', label: 'UTC+1 (Madrid, Barcelona, París, Berlín)' },
  { value: 'UTC', label: 'UTC+0 (Tiempo Universal Coordinado / Londres)' },
];

export interface RegisterFormProps {
  onSuccess?: (data: unknown) => void;
  onNavigateToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onNavigateToLogin }: RegisterFormProps) {
  // Manejo de paso en el wizard: 1 = Datos de cuenta & Rol, 2 = Preferencias & Habilidades
  const [step, setStep] = useState<1 | 2>(1);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  // Detección automática del timezone del navegador
  const detectedTimezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC-5';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'APRENDIZ',
      timezone: 'UTC-5',
      language: 'ES',
      preferredLanguage: 'TYPESCRIPT',
      bio: '',
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

  const selectedRole = watch('role');
  const selectedLanguage = watch('language');
  const selectedSkills = watch('skills') || [];
  const currentPassword = watch('password') || '';

  // Validación de seguridad de contraseña para feedback visual
  const passwordCriteria = {
    length: currentPassword.length >= 8,
    hasUpper: /[A-Z]/.test(currentPassword),
    hasNumber: /[0-9]/.test(currentPassword),
    hasSpecial: /[^a-zA-Z0-9]/.test(currentPassword),
  };

  // Avanzar al Paso 2 validando primero los campos del Paso 1
  const handleProceedToStep2 = async () => {
    setServerError(null);
    const isStep1Valid = await trigger([
      'name',
      'email',
      'password',
      'confirmPassword',
      'role',
      'username',
    ]);

    if (isStep1Valid) {
      setStep(2);
      toast.info('Paso 1 completado. Ahora configura tus habilidades y preferencias.');
    } else {
      toast.error('Por favor corrige los campos indicados antes de continuar.');
    }
  };

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

  // Autodetectar timezone local del usuario
  const handleAutoDetectTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setValue('timezone', tz, { shouldValidate: true });
        toast.success(`Zona horaria detectada: ${tz}`);
      }
    } catch {
      toast.error('No se pudo detectar automáticamente la zona horaria.');
    }
  };

  // Envío final del formulario
  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        name: data.name.trim(),
        displayName: data.name.trim(),
        username: data.username?.trim() || undefined,
        email: data.email.toLowerCase().trim(),
        password: data.password,
        role: data.role,
        timezone: data.timezone,
        language: data.language,
        preferredLanguage: data.preferredLanguage,
        bio: data.bio || undefined,
        skills: data.skills.map((s) => ({
          skillId: s.skillId,
          level: s.level,
        })),
      });

      setIsSuccess(true);
      toast.success('¡Registro exitoso! Sesión iniciada con cookie segura.');
      onSuccess?.(response.data);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al crear la cuenta. Inténtalo nuevamente.';
      const formattedMsg = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
      setServerError(formattedMsg);
      toast.error(formattedMsg);
    }
  };

  // Filtrado de habilidades no agregadas aún
  const availableSkills = PRESET_SKILLS.filter(
    (skill) =>
      !selectedSkills.some((s) => s.skillId === skill.id) &&
      skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()),
  );

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl border border-slate-800 bg-surface-200/95 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      {/* Header & Stepper */}
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan text-white mb-3 shadow-lg shadow-brand-500/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Crea tu Perfil en CodePair
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Plataforma colaborativa de Pair Programming entre pares y mentorías técnicas
        </p>

        {/* Wizard Stepper Progress Bar */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span
              className={`flex items-center gap-1.5 transition-colors ${
                step === 1 ? 'text-brand-400' : 'text-emerald-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  step === 1
                    ? 'bg-brand-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {step > 1 ? <Check className="h-3 w-3" /> : '1'}
              </span>
              Paso 1: Cuenta y Rol
            </span>

            <span
              className={`flex items-center gap-1.5 transition-colors ${
                step === 2 ? 'text-brand-400' : 'text-slate-500'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  step === 2
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                2
              </span>
              Paso 2: Preferencias y Habilidades
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-surface-100 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-accent-cyan to-brand-400 transition-all duration-300 ease-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Alerta de error global */}
      {serverError && (
        <div className="mb-6 rounded-xl bg-red-950/60 border border-red-500/40 p-4 text-sm text-red-300 flex items-start gap-3 animate-slide-down">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Error al registrar</p>
            <p className="text-xs text-red-300/90 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Alerta de éxito */}
      {isSuccess && (
        <div className="mb-6 rounded-xl bg-emerald-950/60 border border-emerald-500/40 p-4 text-sm text-emerald-300 flex items-center gap-3 animate-slide-down">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold">¡Cuenta registrada con éxito!</p>
            <p className="text-xs text-emerald-300/90">
              Bienvenido a CodePair. Tu sesión ha sido iniciada automáticamente con token seguro HttpOnly.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ============================================================ */}
        {/* PASO 1: DATOS DE CUENTA Y SELECTOR DE ROL                    */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Selector Visual de Rol mediante Cards Interactivas */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  ¿Deseas aprender (Aprendiz) o enseñar/guiar (Mentor)? <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Elige tu objetivo principal en CodePair. Podrás ajustar tus preferencias en cualquier momento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Card 1: APRENDIZ */}
                <button
                  type="button"
                  onClick={() => setValue('role', 'APRENDIZ', { shouldValidate: true })}
                  className={`group relative text-left rounded-2xl p-5 border transition-all duration-200 cursor-pointer ${
                    selectedRole === 'APRENDIZ'
                      ? 'border-brand-500 bg-brand-950/40 shadow-lg shadow-brand-500/10 ring-2 ring-brand-500/30'
                      : 'border-slate-800 bg-surface-100/70 hover:border-slate-700 hover:bg-surface-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                        selectedRole === 'APRENDIZ'
                          ? 'border-brand-500/40 bg-brand-500/20 text-brand-300'
                          : 'border-slate-700 bg-surface-200 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <GraduationCap className="h-6 w-6" />
                    </div>

                    {selectedRole === 'APRENDIZ' ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="h-5 w-5 rounded-full border border-slate-700" />
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Aprendiz</h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                        Learner
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      Quiero publicar solicitudes de ayuda técnica, resolver bloqueos de código y aprender mediante Pair Programming 1 a 1.
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 text-brand-400" />
                      <span>Sesiones guiadas por mentores en vivo</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 text-brand-400" />
                      <span>Salas de Jitsi Meet con videollamada y editor</span>
                    </div>
                  </div>
                </button>

                {/* Card 2: MENTOR */}
                <button
                  type="button"
                  onClick={() => setValue('role', 'MENTOR', { shouldValidate: true })}
                  className={`group relative text-left rounded-2xl p-5 border transition-all duration-200 cursor-pointer ${
                    selectedRole === 'MENTOR'
                      ? 'border-accent-cyan bg-accent-cyan/10 shadow-lg shadow-accent-cyan/10 ring-2 ring-accent-cyan/30'
                      : 'border-slate-800 bg-surface-100/70 hover:border-slate-700 hover:bg-surface-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                        selectedRole === 'MENTOR'
                          ? 'border-accent-cyan/40 bg-accent-cyan/20 text-accent-cyan'
                          : 'border-slate-700 bg-surface-200 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <Award className="h-6 w-6" />
                    </div>

                    {selectedRole === 'MENTOR' ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-cyan text-surface-300 shadow-sm font-bold">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="h-5 w-5 rounded-full border border-slate-700" />
                    )}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">Mentor</h3>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                        Tutor / Guía
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      Quiero compartir mi experiencia, ayudar a otros programadores a superar obstáculos y construir reputación en la comunidad.
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 text-accent-cyan" />
                      <span>Acepta solicitudes y lidera pair sessions</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <CheckCircle className="h-3.5 w-3.5 text-accent-cyan" />
                      <span>Gana calificaciones y feedback 5 estrellas</span>
                    </div>
                  </div>
                </button>
              </div>

              {errors.role && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Inputs de cuenta */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
                Datos Personales y Acceso
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  placeholder="Ej. Linus Torvalds"
                  leftIcon={<User className="h-4 w-4" />}
                  helperText="Mínimo 3 caracteres"
                  error={errors.name?.message}
                  required
                  {...register('name')}
                />

                <Input
                  label="Nombre de usuario (opcional)"
                  placeholder="ej. linus_dev"
                  leftIcon={<span className="text-xs font-mono font-bold text-slate-500">@</span>}
                  helperText="Solo minúsculas, números y guiones"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>

              <Input
                label="Correo Institucional o Profesional"
                type="email"
                placeholder="desarrollador@institucion.edu o correo@dev.com"
                leftIcon={<Mail className="h-4 w-4" />}
                helperText="Formato RFC 5322 válido"
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
                      className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
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

              {/* Indicador visual de robustez de contraseña */}
              {currentPassword.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-surface-100/50 p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400">Requisitos de contraseña:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <span
                      className={`flex items-center gap-1 ${
                        passwordCriteria.length ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mínimo 8 car.
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        passwordCriteria.hasUpper ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> 1 Mayúscula
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> 1 Número
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        passwordCriteria.hasSpecial ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> 1 Símbolo (@$!%*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Botón hacia Paso 2 */}
            <div className="pt-2">
              <Button
                type="button"
                variant="glow"
                size="lg"
                onClick={handleProceedToStep2}
                className="w-full text-base font-semibold group"
              >
                <span>Continuar a Preferencias y Habilidades</span>
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>

              <p className="mt-4 text-center text-xs text-slate-400">
                ¿Ya tienes una cuenta en CodePair?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Inicia sesión aquí
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 2: PREFERENCIAS REGIONALES Y HABILIDADES                */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Preferencias de Idioma y Zona Horaria */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
                Preferencias Regionales y de Idioma
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selector de Idioma preferido */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Idioma de Comunicación <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {USER_LANGUAGES_LIST.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setValue('language', lang.code as 'ES' | 'EN' | 'PT')}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          selectedLanguage === lang.code
                            ? 'border-brand-500 bg-brand-950/40 text-brand-300 font-semibold shadow-sm ring-1 ring-brand-500/30'
                            : 'border-slate-800 bg-surface-100 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-lg mb-1">{lang.flag}</span>
                        <span>{lang.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                  {errors.language && (
                    <p className="text-xs text-red-400">{errors.language.message}</p>
                  )}
                </div>

                {/* Selector de Timezone con Autocompletado / Detección */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="timezone"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Zona Horaria <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoDetectTimezone}
                      className="text-[11px] text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                      title="Detectar zona horaria automáticamente desde tu navegador"
                    >
                      <Clock className="h-3 w-3" />
                      Auto-detectar
                    </button>
                  </div>

                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <select
                      id="timezone"
                      className="w-full rounded-lg bg-surface-100 border border-slate-800 text-slate-100 text-sm py-2.5 pl-10 pr-8 outline-none hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                      {...register('timezone')}
                    >
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value} className="bg-surface-200 text-slate-200">
                          {tz.label}
                        </option>
                      ))}
                      {/* Si el navegador detectó un timezone que no está en la lista común */}
                      {!COMMON_TIMEZONES.some((tz) => tz.value === detectedTimezone) && (
                        <option value={detectedTimezone} className="bg-surface-200 text-slate-200">
                          {detectedTimezone} (Detectado)
                        </option>
                      )}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-3 text-slate-500 text-xs">
                      ▼
                    </div>
                  </div>
                  {errors.timezone && (
                    <p className="text-xs text-red-400">{errors.timezone.message}</p>
                  )}
                </div>
              </div>

              {/* Lenguaje Principal de Programación */}
              <div className="space-y-1.5">
                <label
                  htmlFor="preferredLanguage"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Stack / Lenguaje de Programación Predilecto
                </label>
                <div className="relative">
                  <Code2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <select
                    id="preferredLanguage"
                    className="w-full rounded-lg bg-surface-100 border border-slate-800 text-slate-100 text-sm py-2.5 pl-10 pr-8 outline-none hover:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
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
              </div>
            </div>

            {/* Selector Dinámico de Habilidades con Badges Interactivos */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Habilidades Técnicas y Nivel de Dominio
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Haz clic sobre cada badge para alternar entre Principiante, Intermedio o Avanzado
                  </p>
                </div>
                <span className="text-xs font-mono font-medium text-slate-300 bg-surface-50 px-2.5 py-1 rounded-md border border-slate-800">
                  {selectedSkills.length} seleccionada(s)
                </span>
              </div>

              {/* Lista de Skills Seleccionadas con Badges Interactivos */}
              <div className="space-y-2">
                {selectedSkills.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400 bg-surface-100/30">
                    No has añadido habilidades técnicas todavía. Selecciona de las tecnologías recomendadas abajo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedSkills.map((skill) => (
                      <div
                        key={skill.skillId}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-surface-100/90 px-3.5 py-2.5 transition-all hover:border-slate-700 shadow-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Code2 className="h-4 w-4 text-brand-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-200 truncate">
                            {skill.skillName || 'Habilidad'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Badge Interactivo de Nivel de Dominio */}
                          <ProficiencyBadge
                            level={skill.level}
                            interactive={true}
                            onCycle={() => handleCycleSkillLevel(skill.skillId)}
                          />

                          {/* Botón eliminar habilidad */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill.skillId)}
                            className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-surface-50 transition-colors cursor-pointer"
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
                  <p className="text-xs text-red-400 flex items-center gap-1 pt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.skills.message}
                  </p>
                )}
              </div>

              {/* Catálogo de Tecnologías y Buscador Rápido */}
              <div className="rounded-2xl border border-slate-800/80 bg-surface-100/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar tecnologías (React, Node.js, Python, SQL, Docker)..."
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      className="w-full rounded-lg bg-surface-200 border border-slate-800 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 outline-none hover:border-slate-700 focus:border-brand-500"
                    />
                  </div>
                </div>

                {availableSkills.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                      Sugerencias de tecnologías (haz clic para añadir):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSkills.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleAddSkill(preset)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-surface-50 px-3 py-1 text-xs text-slate-300 hover:border-brand-500/60 hover:bg-brand-950/40 hover:text-brand-300 transition-all cursor-pointer shadow-sm"
                        >
                          <Plus className="h-3 w-3 text-brand-400" />
                          <span className="font-medium">{preset.name}</span>
                          <span className="text-[10px] text-slate-500">({preset.category})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Navegación: Volver y Completar Registro */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                className="w-full sm:w-1/3 text-sm font-semibold border-slate-700 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Volver al Paso 1</span>
              </Button>

              <Button
                type="submit"
                variant="glow"
                size="lg"
                isLoading={isSubmitting}
                className="w-full sm:w-2/3 text-base font-bold"
              >
                {isSubmitting ? 'Creando Perfil...' : 'Completar Registro en CodePair'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
