/**
 * @file domain.types.ts
 * @description Tipos de dominio centrales para CodePair.
 *
 * Estos tipos son la "fuente de verdad" de la aplicación.
 * Son independientes de Prisma y representan el modelo de negocio puro.
 * Los tipos de Prisma se derivan del schema; estos son la interfaz de contrato.
 */

// ─────────────────────────────────────────────────────────────
//  ENUMERATIONS
// ─────────────────────────────────────────────────────────────

export const USER_ROLES = ['STUDENT', 'MENTOR', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const HELP_REQUEST_STATUSES = [
  'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED', 'EXPIRED',
] as const;
export type HelpRequestStatus = (typeof HELP_REQUEST_STATUSES)[number];

export const HELP_REQUEST_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type HelpRequestPriority = (typeof HELP_REQUEST_PRIORITIES)[number];

export const SESSION_STATUSES = ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const PROGRAMMING_LANGUAGES = [
  'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'CSHARP',
  'GO', 'RUST', 'RUBY', 'PHP', 'KOTLIN', 'SWIFT', 'SQL', 'OTHER',
] as const;
export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number];

export const SKILL_CATEGORIES = [
  'Language', 'Framework', 'Database', 'ORM', 'Runtime',
  'Security', 'DevOps', 'Architecture', 'CS Fundamentals',
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/**
 * Nivel de proficiencia (1–5).
 * 1 = Beginner, 2 = Basic, 3 = Intermediate, 4 = Advanced, 5 = Expert
 */
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Rating de feedback (1–5). Coincide con CHECK CONSTRAINT de DB.
 */
export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

// ─────────────────────────────────────────────────────────────
//  DOMAIN INTERFACES
// ─────────────────────────────────────────────────────────────

/** Entidad de usuario completa (incluye campos privados — uso interno) */
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatarUrl: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  timezone: string;
  preferredLanguage: ProgrammingLanguage;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerifyToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Vista pública de usuario (sin campos sensibles) */
export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  githubUrl: string | null;
  role: UserRole;
  preferredLanguage: ProgrammingLanguage;
  createdAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSkill {
  userId: string;
  skillId: string;
  proficiency: ProficiencyLevel;
  yearsOfExperience: number | null;
  canMentor: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Joins opcionales
  skill?: Skill;
  user?: PublicUser;
}

export interface HelpRequest {
  id: string;
  studentId: string;
  mentorId: string | null;
  title: string;
  description: string;
  codeSnippet: string | null;
  errorMessage: string | null;
  language: ProgrammingLanguage;
  status: HelpRequestStatus;
  priority: HelpRequestPriority;
  estimatedMinutes: number | null;
  acceptedAt: Date | null;
  resolvedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joins opcionales
  student?: PublicUser;
  mentor?: PublicUser | null;
  skills?: Skill[];
  session?: Session | null;
}

export interface Session {
  id: string;
  requestId: string | null;
  hostId: string;
  participantId: string | null;
  title: string;
  description: string | null;
  roomCode: string;
  language: ProgrammingLanguage;
  status: SessionStatus;
  isPrivate: boolean;
  initialCode: string | null;
  finalCode: string | null;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Joins opcionales
  host?: PublicUser;
  participant?: PublicUser | null;
  helpRequest?: HelpRequest | null;
  feedbacks?: Feedback[];
}

export interface Feedback {
  id: string;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: FeedbackRating;
  ratingCommunication: FeedbackRating | null;
  ratingKnowledge: FeedbackRating | null;
  ratingPunctuality: FeedbackRating | null;
  comment: string | null;
  wouldRecommend: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Joins opcionales
  session?: Session;
  reviewer?: PublicUser;
  reviewee?: PublicUser;
}

// ─────────────────────────────────────────────────────────────
//  UTILITY TYPES
// ─────────────────────────────────────────────────────────────

/** Genera un tipo sin los campos de auditoría (para creación) */
export type CreateEntity<T, OmitKeys extends keyof T = never> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | OmitKeys
>;

/** Hace todas las propiedades opcionales excepto las especificadas */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** Tipo para paginación */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Tipo base para respuestas de la API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId?: string;
}

/** JWT payload decodificado */
export interface JwtPayload {
  sub: string;      // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** Token de autenticación par (access + refresh) */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos
}
