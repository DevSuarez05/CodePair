import { z } from 'zod';

// ─── Constantes compartidas ───────────────────────────────────

const PROGRAMMING_LANGUAGES = [
  'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP',
  'CSHARP', 'GO', 'RUST', 'RUBY', 'PHP', 'KOTLIN', 'SWIFT', 'SQL', 'OTHER',
] as const;

const PROFICIENCY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

const HELP_REQUEST_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED', 'EXPIRED'] as const;

const HELP_REQUEST_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

// Mapa BEGINNER/INTERMEDIATE/ADVANCED → número 1-5 interno
export const PROFICIENCY_MAP: Record<string, number> = {
  BEGINNER:     1,
  INTERMEDIATE: 3,
  ADVANCED:     5,
};

export const USER_LANGUAGES = ['ES', 'EN', 'PT'] as const;

// RFC 5322 official standard email regex
const RFC_5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// ─── Auth Schemas ─────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'El nombre completo es requerido' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(100)
    .optional(),
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, _ and -')
    .optional(),
  email: z
    .string({ required_error: 'El correo electrónico es requerido' })
    .email('Formato de correo electrónico inválido')
    .regex(RFC_5322_EMAIL_REGEX, 'El correo debe cumplir con el estándar RFC 5322')
    .max(255),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un carácter especial (@$!%*?&)'),
  role: z.enum(['APRENDIZ', 'MENTOR'], {
    errorMap: () => ({ message: 'El rol debe ser APRENDIZ o MENTOR (ADMINISTRADOR no es autoasignable)' }),
  }),
  timezone: z
    .string()
    .max(50)
    .optional()
    .default('UTC-5'),
  language: z
    .enum(USER_LANGUAGES, { errorMap: () => ({ message: 'El idioma debe ser ES, EN o PT' }) })
    .optional()
    .default('ES'),
  preferredLanguage: z
    .enum(PROGRAMMING_LANGUAGES, { errorMap: () => ({ message: 'Lenguaje de programación inválido' }) })
    .optional()
    .default('TYPESCRIPT'),
  bio: z
    .string()
    .max(1000, 'La biografía no puede exceder los 1,000 caracteres')
    .optional(),
  // Habilidades técnicas con nivel BEGINNER/INTERMEDIATE/ADVANCED
  skills: z
    .array(
      z.object({
        skillId: z.union([z.string().min(1), z.number()]).transform((val) => String(val)),
        level: z.enum(PROFICIENCY_LEVELS, {
          errorMap: () => ({ message: 'El nivel debe ser BEGINNER, INTERMEDIATE o ADVANCED' }),
        }),
      }),
    )
    .max(20, 'No puedes registrar más de 20 habilidades')
    .optional()
    .default([]),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// ─── Help Request Schemas ─────────────────────────────────────

export const createHelpRequestSchema = z.object({
  skillId: z
    .string({ required_error: 'skillId is required' })
    .uuid('skillId must be a valid UUID'),
  title: z
    .string({ required_error: 'Title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(255),
  description: z
    .string({ required_error: 'Description is required' })
    .min(20, 'Description must be at least 20 characters')
    .max(10000),
  codeSnippet: z.string().max(50000).optional(),
  errorMessage: z.string().max(5000).optional(),
  language: z.enum(PROGRAMMING_LANGUAGES).optional().default('JAVASCRIPT'),
  priority: z.enum(HELP_REQUEST_PRIORITIES).optional().default('MEDIUM'),
  estimatedMinutes: z.number().int().min(5).max(480).optional(),
  // Disponibilidad: cuándo puede el estudiante asistir
  availableFrom: z
    .string()
    .datetime({ message: 'availableFrom must be an ISO 8601 datetime' })
    .optional(),
  availableTo: z
    .string()
    .datetime({ message: 'availableTo must be an ISO 8601 datetime' })
    .optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'expiresAt must be an ISO 8601 datetime' })
    .optional(),
});

export const helpRequestFilterSchema = z.object({
  skillId:  z.string().uuid().optional(),
  language: z.enum(PROGRAMMING_LANGUAGES).optional(),
  status:   z.enum(HELP_REQUEST_STATUSES).optional(),
  priority: z.enum(HELP_REQUEST_PRIORITIES).optional(),
  page:     z.coerce.number().int().min(1).optional().default(1),
  limit:    z.coerce.number().int().min(1).max(50).optional().default(10),
});

// ─── Feedback Schema ──────────────────────────────────────────

export const createFeedbackSchema = z.object({
  revieweeId: z
    .string({ required_error: 'revieweeId is required' })
    .uuid('revieweeId must be a valid UUID'),
  rating: z
    .number({ required_error: 'rating is required' })
    .int()
    .min(1, 'Minimum rating is 1')
    .max(5, 'Maximum rating is 5'),
  ratingCommunication: z.number().int().min(1).max(5).optional(),
  ratingKnowledge:     z.number().int().min(1).max(5).optional(),
  ratingPunctuality:   z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
  wouldRecommend: z.boolean().optional().default(true),
});

// ─── Exported inferred types ──────────────────────────────────

export type RegisterInput   = z.infer<typeof registerSchema>;
export type LoginInput      = z.infer<typeof loginSchema>;
export type CreateHelpRequestInput = z.infer<typeof createHelpRequestSchema>;
export type HelpRequestFilterInput = z.infer<typeof helpRequestFilterSchema>;
export type CreateFeedbackInput    = z.infer<typeof createFeedbackSchema>;
