/**
 * @file index.ts
 * @description Single Source of Truth para tipos y contratos compartidos en CodePair (API y Web).
 */

// ─── Enums y Roles ───────────────────────────────────────────

export const UserRole = {
  APRENDIZ: 'APRENDIZ',
  MENTOR: 'MENTOR',
  ADMINISTRADOR: 'ADMINISTRADOR',
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserLanguage = {
  ES: 'ES',
  EN: 'EN',
  PT: 'PT',
} as const;
export type UserLanguage = (typeof UserLanguage)[keyof typeof UserLanguage];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const HelpRequestStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;
export type HelpRequestStatus = (typeof HelpRequestStatus)[keyof typeof HelpRequestStatus];

export const HelpRequestPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type HelpRequestPriority = (typeof HelpRequestPriority)[keyof typeof HelpRequestPriority];

export const SessionStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const ProgrammingLanguage = {
  JAVASCRIPT: 'JAVASCRIPT',
  TYPESCRIPT: 'TYPESCRIPT',
  PYTHON: 'PYTHON',
  JAVA: 'JAVA',
  CPP: 'CPP',
  CSHARP: 'CSHARP',
  GO: 'GO',
  RUST: 'RUST',
  RUBY: 'RUBY',
  PHP: 'PHP',
  KOTLIN: 'KOTLIN',
  SWIFT: 'SWIFT',
  SQL: 'SQL',
  OTHER: 'OTHER',
} as const;
export type ProgrammingLanguage = (typeof ProgrammingLanguage)[keyof typeof ProgrammingLanguage];

export const ProficiencyLevel = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;
export type ProficiencyLevel = (typeof ProficiencyLevel)[keyof typeof ProficiencyLevel];

// ─── Interfaces de Dominio Compartidas ────────────────────────

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  language: UserLanguage;
  preferredLanguage: ProgrammingLanguage;
  timezone: string;
}

export interface SkillSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive: boolean;
}

export interface HelpRequestSummary {
  id: string;
  studentId: string;
  mentorId: string | null;
  title: string;
  description: string;
  codeSnippet?: string | null;
  errorMessage?: string | null;
  language: ProgrammingLanguage;
  status: HelpRequestStatus;
  priority: HelpRequestPriority;
  estimatedMinutes?: number | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: UserSummary;
  mentor?: UserSummary | null;
  skills?: SkillSummary[];
}

export interface SessionSummary {
  id: string;
  requestId?: string | null;
  hostId: string;
  participantId?: string | null;
  title: string;
  description?: string | null;
  roomCode: string;
  meetLink?: string | null;
  language: ProgrammingLanguage;
  status: SessionStatus;
  isPrivate: boolean;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  updatedAt: string;
  host?: UserSummary;
  participant?: UserSummary | null;
}

export interface FeedbackSummary {
  id: string;
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  ratingCommunication?: number | null;
  ratingKnowledge?: number | null;
  ratingPunctuality?: number | null;
  comment?: string | null;
  wouldRecommend: boolean;
  createdAt: string;
}

// ─── Eventos WebSocket (Socket.IO) ───────────────────────────

export interface SocketEventsMap {
  new_help_request: HelpRequestSummary;
  request_status_updated: {
    requestId: string;
    status: HelpRequestStatus;
    session?: SessionSummary;
    timestamp: string;
  };
  peer_joined: {
    user: { id: string; name?: string };
    timestamp: string;
  };
  peer_left: {
    user: { id: string };
    timestamp: string;
  };
  session_completed: {
    sessionId: string;
    timestamp: string;
  };
}
