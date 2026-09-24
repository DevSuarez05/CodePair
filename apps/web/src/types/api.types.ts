/**
 * @file api.types.ts
 * @description Tipos TypeScript para el cliente web (Next.js).
 *
 * Son el equivalente frontend de los domain.types.ts del backend.
 * No dependen de Prisma ni de NestJS — solo TypeScript puro.
 */

// ─── Enums (como const objects para tree-shaking) ─────────────

export const UserRole = {
  APRENDIZ:      'APRENDIZ',
  MENTOR:        'MENTOR',
  ADMINISTRADOR: 'ADMINISTRADOR',
  STUDENT:       'STUDENT',
  ADMIN:         'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserLanguage = {
  ES: 'ES',
  EN: 'EN',
  PT: 'PT',
} as const;
export type UserLanguage = (typeof UserLanguage)[keyof typeof UserLanguage];

export const UserStatus = {
  ACTIVE:               'ACTIVE',
  INACTIVE:             'INACTIVE',
  BANNED:               'BANNED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const HelpRequestStatus = {
  OPEN:        'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED:    'RESOLVED',
  CANCELLED:   'CANCELLED',
  EXPIRED:     'EXPIRED',
} as const;
export type HelpRequestStatus = (typeof HelpRequestStatus)[keyof typeof HelpRequestStatus];

export const HelpRequestPriority = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type HelpRequestPriority = (typeof HelpRequestPriority)[keyof typeof HelpRequestPriority];

export const SessionStatus = {
  PENDING:   'PENDING',
  ACTIVE:    'ACTIVE',
  PAUSED:    'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const ProgrammingLanguage = {
  JAVASCRIPT: 'JAVASCRIPT',
  TYPESCRIPT: 'TYPESCRIPT',
  PYTHON:     'PYTHON',
  JAVA:       'JAVA',
  CPP:        'CPP',
  CSHARP:     'CSHARP',
  GO:         'GO',
  RUST:       'RUST',
  RUBY:       'RUBY',
  PHP:        'PHP',
  KOTLIN:     'KOTLIN',
  SWIFT:      'SWIFT',
  SQL:        'SQL',
  OTHER:      'OTHER',
} as const;
export type ProgrammingLanguage = (typeof ProgrammingLanguage)[keyof typeof ProgrammingLanguage];

export type ProficiencyLevelKey = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;
export type FeedbackRating   = 1 | 2 | 3 | 4 | 5;

// ─── API Entity Types ─────────────────────────────────────────

export interface User {
  id: string;
  name?: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  language?: UserLanguage;
  preferredLanguage: ProgrammingLanguage;
  timezone: string;
  lastLoginAt: string | null;   // ISO string desde la API
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserSkill {
  skillId: string;
  proficiency: ProficiencyLevel;
  proficiencyLevel?: ProficiencyLevelKey;
  yearsOfExperience: number | null;
  canMentor: boolean;
  createdAt: string;
  skill?: Skill;
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
  acceptedAt: string | null;
  resolvedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: User;
  mentor?: User | null;
  skills?: Skill[];
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
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  finalCode?: string | null;
  createdAt: string;
  updatedAt: string;
  host?: User;
  participant?: User | null;
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
  createdAt: string;
  reviewer?: User;
  reviewee?: User;
  session?: Session;
}

export interface UserRatingSummary {
  userId: string;
  totalFeedbacks: number;
  averageRating: number;
  averageCommunication: number | null;
  averageKnowledge: number | null;
  averagePunctuality: number | null;
  wouldRecommendPercentage: number;
}

// ─── Request Payloads (API call shapes) ───────────────────────

export interface RegisterPayload {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface CreateHelpRequestPayload {
  title: string;
  description: string;
  codeSnippet?: string;
  errorMessage?: string;
  language: ProgrammingLanguage;
  priority?: HelpRequestPriority;
  estimatedMinutes?: number;
  expiresAt?: string;
  skillIds?: string[];
}

export interface CreateSessionPayload {
  requestId?: string;
  title: string;
  description?: string;
  language: ProgrammingLanguage;
  isPrivate?: boolean;
  scheduledAt?: string;
  initialCode?: string;
}

export interface CreateFeedbackPayload {
  sessionId: string;
  revieweeId: string;
  rating: FeedbackRating;
  ratingCommunication?: FeedbackRating;
  ratingKnowledge?: FeedbackRating;
  ratingPunctuality?: FeedbackRating;
  comment?: string;
  wouldRecommend?: boolean;
}

// ─── Pagination ───────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── API Response Envelope ────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

// ─── Label Maps (para UI) ─────────────────────────────────────

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  1: 'Beginner',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export const PRIORITY_LABELS: Record<HelpRequestPriority, string> = {
  LOW:      '🟢 Low',
  MEDIUM:   '🟡 Medium',
  HIGH:     '🟠 High',
  CRITICAL: '🔴 Critical',
};

export const STATUS_LABELS: Record<HelpRequestStatus, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
  CANCELLED:   'Cancelled',
  EXPIRED:     'Expired',
};

export const LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON:     'Python',
  JAVA:       'Java',
  CPP:        'C++',
  CSHARP:     'C#',
  GO:         'Go',
  RUST:       'Rust',
  RUBY:       'Ruby',
  PHP:        'PHP',
  KOTLIN:     'Kotlin',
  SWIFT:      'Swift',
  SQL:        'SQL',
  OTHER:      'Other',
};
