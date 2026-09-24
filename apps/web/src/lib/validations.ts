import { z } from 'zod';

// ─── Enums & Constants ────────────────────────────────────────

export const PROGRAMMING_LANGUAGES = [
  'JAVASCRIPT',
  'TYPESCRIPT',
  'PYTHON',
  'JAVA',
  'CPP',
  'CSHARP',
  'GO',
  'RUST',
  'RUBY',
  'PHP',
  'KOTLIN',
  'SWIFT',
  'SQL',
  'OTHER',
] as const;

export const PROFICIENCY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type ProficiencyLevelKey = (typeof PROFICIENCY_LEVELS)[number];

export const HELP_REQUEST_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const HELP_REQUEST_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED', 'EXPIRED'] as const;

export const USER_APP_ROLES = ['APRENDIZ', 'MENTOR'] as const;
export type UserAppRole = (typeof USER_APP_ROLES)[number];

export const USER_LANGUAGES_LIST = [
  { code: 'ES', label: 'Español (ES)', flag: '🇪🇸' },
  { code: 'EN', label: 'English (EN)', flag: '🇺🇸' },
  { code: 'PT', label: 'Português (PT)', flag: '🇧🇷' },
] as const;

// RFC 5322 standard email regex
export const RFC_5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// ─── HU-01: Registro & Configuración de Perfil ────────────────

export const skillSelectionItemSchema = z.object({
  skillId: z.string().min(1, 'ID de habilidad inválido'),
  skillName: z.string().optional(),
  level: z.enum(PROFICIENCY_LEVELS, {
    errorMap: () => ({ message: 'El nivel debe ser BEGINNER, INTERMEDIATE o ADVANCED' }),
  }),
});

export const registerFormSchema = z
  .object({
    name: z
      .string({ required_error: 'El nombre completo es requerido' })
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres'),
    username: z
      .string()
      .trim()
      .min(3, 'El username debe tener al menos 3 caracteres')
      .max(50, 'El username no puede superar los 50 caracteres')
      .regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, guiones y guiones bajos')
      .optional()
      .or(z.literal('')),
    email: z
      .string({ required_error: 'El correo electrónico es requerido' })
      .email('Ingresa un correo electrónico válido')
      .regex(RFC_5322_EMAIL_REGEX, 'El correo debe cumplir con el formato RFC 5322')
      .max(255),
    password: z
      .string({ required_error: 'La contraseña es requerida' })
      .min(8, 'Debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número')
      .regex(/[^a-zA-Z0-9]/, 'Debe incluir al menos un carácter especial (@$!%*?&)'),
    confirmPassword: z.string({ required_error: 'Confirma tu contraseña' }),
    role: z.enum(['APRENDIZ', 'MENTOR'], {
      required_error: 'Selecciona si deseas aprender o enseñar',
    }),
    timezone: z.string().min(1, 'Selecciona una zona horaria').default('UTC-5'),
    language: z.enum(['ES', 'EN', 'PT']).default('ES'),
    preferredLanguage: z.enum(PROGRAMMING_LANGUAGES).default('TYPESCRIPT'),
    bio: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
    skills: z
      .array(skillSelectionItemSchema)
      .max(20, 'Puedes añadir hasta 20 habilidades')
      .default([]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerFormSchema>;

// ─── HU-02: Publicación de Solicitud de Ayuda ─────────────────

export const createHelpRequestSchema = z
  .object({
    title: z
      .string({ required_error: 'El título de la solicitud es obligatorio' })
      .min(5, 'El título debe tener al menos 5 caracteres descriptivos')
      .max(255, 'El título no puede exceder los 255 caracteres'),
    skillId: z
      .string({ required_error: 'Selecciona una tecnología para catalogar tu solicitud' })
      .min(1, 'Por favor elige una tecnología o habilidad'),
    language: z.enum(PROGRAMMING_LANGUAGES, {
      required_error: 'Selecciona el lenguaje principal',
    }).default('TYPESCRIPT'),
    description: z
      .string({ required_error: 'La descripción del bloqueo es obligatoria' })
      .min(20, 'Describe tu bloqueo con al menos 20 caracteres para que los mentores puedan ayudarte')
      .max(10000, 'La descripción no puede superar los 10,000 caracteres'),
    codeSnippet: z.string().max(50000, 'El snippet no puede superar 50,000 caracteres').optional(),
    errorMessage: z.string().max(5000, 'El mensaje de error no puede superar 5,000 caracteres').optional(),
    priority: z.enum(HELP_REQUEST_PRIORITIES).default('MEDIUM'),
    estimatedMinutes: z
      .number({ coerce: true })
      .min(10, 'Mínimo 10 minutos')
      .max(240, 'Máximo 240 minutos (4 horas)')
      .default(30),
    availableFrom: z.string().min(1, 'Especifica la fecha y hora de inicio de disponibilidad'),
    availableTo: z.string().min(1, 'Especifica la fecha y hora de fin de disponibilidad'),
  })
  .refine(
    (data) => {
      if (!data.availableFrom || !data.availableTo) return true;
      return new Date(data.availableTo) > new Date(data.availableFrom);
    },
    {
      message: 'La hora de fin debe ser posterior a la de inicio',
      path: ['availableTo'],
    },
  );

export type CreateHelpRequestFormData = z.infer<typeof createHelpRequestSchema>;

// ─── HU-03: Filtros de Solicitudes ────────────────────────────

export const feedFilterSchema = z.object({
  search: z.string().optional(),
  skillId: z.string().optional(),
  language: z.string().optional(),
  status: z.enum(HELP_REQUEST_STATUSES).optional(),
  priority: z.enum(HELP_REQUEST_PRIORITIES).optional(),
});

export type FeedFilterData = z.infer<typeof feedFilterSchema>;

// ─── HU-05: Modal de Calificación y Feedback ──────────────────

export const createFeedbackSchema = z.object({
  sessionId: z.string().min(1, 'ID de sesión requerido'),
  revieweeId: z.string().min(1, 'ID de usuario a calificar requerido'),
  rating: z
    .number({ required_error: 'Por favor asigna una puntuación general' })
    .int()
    .min(1, 'Mínimo 1 estrella')
    .max(5, 'Máximo 5 estrellas'),
  ratingCommunication: z.number().int().min(1).max(5).optional(),
  ratingKnowledge: z.number().int().min(1).max(5).optional(),
  ratingPunctuality: z.number().int().min(1).max(5).optional(),
  comment: z
    .string()
    .min(5, 'El comentario debe tener al menos 5 caracteres')
    .max(2000, 'El comentario no puede exceder los 2,000 caracteres'),
  wouldRecommend: z.boolean().default(true),
});

export type CreateFeedbackFormData = z.infer<typeof createFeedbackSchema>;
