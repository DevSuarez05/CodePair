-- ============================================================
--  CodePair DB — Migración inicial
--  Motor   : MySQL 8.x
--  ORM     : Prisma 6.x (migration manual complementaria)
--
--  IMPORTANTE: Esta migración es ejecutada por Prisma vía:
--    npx prisma migrate dev --name init_codepair_schema
--
--  Los CHECK constraints para ratings se añaden aquí ya que
--  Prisma no genera CHECK constraints nativos en MySQL.
-- ============================================================

-- ── Extensión: UUID function disponible desde MySQL 8.0 ─────
-- (No requiere extensión; UUID() está built-in en MySQL 8)

-- ────────────────────────────────────────────────────────────
--  TABLE: users
-- ────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id`                   VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  `email`                VARCHAR(255) NOT NULL,
  `username`             VARCHAR(50)  NOT NULL,
  `displayName`          VARCHAR(100) NOT NULL,
  `passwordHash`         VARCHAR(255) NOT NULL,
  `avatarUrl`            VARCHAR(512)          DEFAULT NULL,
  `bio`                  TEXT                  DEFAULT NULL,
  `githubUrl`            VARCHAR(255)          DEFAULT NULL,
  `linkedinUrl`          VARCHAR(255)          DEFAULT NULL,
  `timezone`             VARCHAR(50)  NOT NULL DEFAULT 'UTC',
  `preferredLanguage`    ENUM('JAVASCRIPT','TYPESCRIPT','PYTHON','JAVA','CPP','CSHARP','GO','RUST','RUBY','PHP','KOTLIN','SWIFT','SQL','OTHER') NOT NULL DEFAULT 'JAVASCRIPT',
  `role`                 ENUM('STUDENT','MENTOR','ADMIN') NOT NULL DEFAULT 'STUDENT',
  `status`               ENUM('ACTIVE','INACTIVE','BANNED','PENDING_VERIFICATION') NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `isEmailVerified`      TINYINT(1)   NOT NULL DEFAULT 0,
  `emailVerifyToken`     VARCHAR(255)          DEFAULT NULL,
  `passwordResetToken`   VARCHAR(255)          DEFAULT NULL,
  `passwordResetExpiry`  DATETIME(3)           DEFAULT NULL,
  `lastLoginAt`          DATETIME(3)           DEFAULT NULL,
  `createdAt`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`            DATETIME(3)  NOT NULL,
  `deletedAt`            DATETIME(3)           DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key`    (`email`),
  UNIQUE KEY `users_username_key` (`username`),
  INDEX `users_email_idx`      (`email`),
  INDEX `users_username_idx`   (`username`),
  INDEX `users_role_idx`       (`role`),
  INDEX `users_status_idx`     (`status`),
  INDEX `users_deletedAt_idx`  (`deletedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  TABLE: refresh_tokens
-- ────────────────────────────────────────────────────────────
CREATE TABLE `refresh_tokens` (
  `id`          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  `token`       VARCHAR(512) NOT NULL,
  `userId`      VARCHAR(36)  NOT NULL,
  `expiresAt`   DATETIME(3)  NOT NULL,
  `isRevoked`   TINYINT(1)   NOT NULL DEFAULT 0,
  `userAgent`   VARCHAR(512)          DEFAULT NULL,
  `ipAddress`   VARCHAR(45)           DEFAULT NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_key` (`token`),
  INDEX `refresh_tokens_userId_idx`    (`userId`),
  INDEX `refresh_tokens_token_idx`     (`token`),
  INDEX `refresh_tokens_expiresAt_idx` (`expiresAt`),

  CONSTRAINT `refresh_tokens_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  TABLE: skills
-- ────────────────────────────────────────────────────────────
CREATE TABLE `skills` (
  `id`          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL,
  `category`    VARCHAR(50)  NOT NULL,
  `description` TEXT                  DEFAULT NULL,
  `iconUrl`     VARCHAR(255)          DEFAULT NULL,
  `isActive`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `skills_name_key`     (`name`),
  UNIQUE KEY `skills_slug_key`     (`slug`),
  INDEX `skills_category_idx`  (`category`),
  INDEX `skills_slug_idx`      (`slug`),
  INDEX `skills_isActive_idx`  (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  TABLE: user_skills
--  UNIQUE CONSTRAINT: unique_user_skill (userId, skillId)
--  CHECK: proficiency BETWEEN 1 AND 5
-- ────────────────────────────────────────────────────────────
CREATE TABLE `user_skills` (
  `userId`            VARCHAR(36)   NOT NULL,
  `skillId`           VARCHAR(36)   NOT NULL,
  `proficiency`       TINYINT       NOT NULL DEFAULT 1,
  `yearsOfExperience` FLOAT                  DEFAULT NULL,
  `canMentor`         TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)   NOT NULL,

  PRIMARY KEY (`userId`, `skillId`),
  -- UNIQUE con nombre explícito para cumplir requisito del enunciado
  UNIQUE KEY `unique_user_skill` (`userId`, `skillId`),
  INDEX `user_skills_userId_idx`       (`userId`),
  INDEX `user_skills_skillId_idx`      (`skillId`),
  INDEX `user_skills_proficiency_idx`  (`proficiency`),
  INDEX `user_skills_canMentor_idx`    (`canMentor`),

  -- CHECK CONSTRAINT: rating de proficiency 1–5
  CONSTRAINT `chk_user_skills_proficiency`
    CHECK (`proficiency` >= 1 AND `proficiency` <= 5),

  CONSTRAINT `user_skills_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_skills_skillId_fkey`
    FOREIGN KEY (`skillId`) REFERENCES `skills` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  TABLE: help_requests
-- ────────────────────────────────────────────────────────────
CREATE TABLE `help_requests` (
  `id`               VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  `studentId`        VARCHAR(36)   NOT NULL,
  `mentorId`         VARCHAR(36)             DEFAULT NULL,
  `title`            VARCHAR(255)  NOT NULL,
  `description`      TEXT          NOT NULL,
  `codeSnippet`      LONGTEXT               DEFAULT NULL,
  `errorMessage`     TEXT                   DEFAULT NULL,
  `language`         ENUM('JAVASCRIPT','TYPESCRIPT','PYTHON','JAVA','CPP','CSHARP','GO','RUST','RUBY','PHP','KOTLIN','SWIFT','SQL','OTHER') NOT NULL DEFAULT 'JAVASCRIPT',
  `status`           ENUM('OPEN','IN_PROGRESS','RESOLVED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'OPEN',
  `priority`         ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `estimatedMinutes` SMALLINT               DEFAULT NULL,
  `acceptedAt`       DATETIME(3)            DEFAULT NULL,
  `resolvedAt`       DATETIME(3)            DEFAULT NULL,
  `expiresAt`        DATETIME(3)            DEFAULT NULL,
  `createdAt`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)   NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `help_requests_studentId_idx`  (`studentId`),
  INDEX `help_requests_mentorId_idx`   (`mentorId`),
  INDEX `help_requests_status_idx`     (`status`),
  INDEX `help_requests_priority_idx`   (`priority`),
  INDEX `help_requests_language_idx`   (`language`),
  INDEX `help_requests_createdAt_idx`  (`createdAt`),
  INDEX `help_requests_expiresAt_idx`  (`expiresAt`),

  CONSTRAINT `help_requests_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `help_requests_mentorId_fkey`
    FOREIGN KEY (`mentorId`)  REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  TABLE: help_request_skills  (junction table)
-- ────────────────────────────────────────────────────────────
CREATE TABLE `help_request_skills` (
  `helpRequestId` VARCHAR(36) NOT NULL,
  `skillId`       VARCHAR(36) NOT NULL,
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`helpRequestId`, `skillId`),
  INDEX `help_request_skills_helpRequestId_idx` (`helpRequestId`),
  INDEX `help_request_skills_skillId_idx`       (`skillId`),

  CONSTRAINT `help_request_skills_helpRequestId_fkey`
    FOREIGN KEY (`helpRequestId`) REFERENCES `help_requests` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `help_request_skills_skillId_fkey`
    FOREIGN KEY (`skillId`) REFERENCES `skills` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  TABLE: sessions
--  UNIQUE: unique_request_session (requestId)
--          → Garantiza que una HelpRequest genere max 1 sesión
-- ────────────────────────────────────────────────────────────
CREATE TABLE `sessions` (
  `id`              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  `requestId`       VARCHAR(36)            DEFAULT NULL,  -- nullable: sesiones ad-hoc
  `hostId`          VARCHAR(36)   NOT NULL,
  `participantId`   VARCHAR(36)            DEFAULT NULL,
  `title`           VARCHAR(255)  NOT NULL,
  `description`     TEXT                   DEFAULT NULL,
  `roomCode`        VARCHAR(8)    NOT NULL,
  `language`        ENUM('JAVASCRIPT','TYPESCRIPT','PYTHON','JAVA','CPP','CSHARP','GO','RUST','RUBY','PHP','KOTLIN','SWIFT','SQL','OTHER') NOT NULL DEFAULT 'JAVASCRIPT',
  `status`          ENUM('PENDING','ACTIVE','PAUSED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `isPrivate`       TINYINT(1)    NOT NULL DEFAULT 0,
  `initialCode`     LONGTEXT               DEFAULT NULL,
  `finalCode`       LONGTEXT               DEFAULT NULL,
  `scheduledAt`     DATETIME(3)            DEFAULT NULL,
  `startedAt`       DATETIME(3)            DEFAULT NULL,
  `endedAt`         DATETIME(3)            DEFAULT NULL,
  `durationSeconds` INT                    DEFAULT NULL,
  `createdAt`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)   NOT NULL,

  PRIMARY KEY (`id`),
  -- UNIQUE con nombre explícito para cumplir requisito del enunciado
  UNIQUE KEY `unique_request_session` (`requestId`),
  UNIQUE KEY `sessions_roomCode_key`  (`roomCode`),
  INDEX `sessions_requestId_idx`     (`requestId`),
  INDEX `sessions_hostId_idx`        (`hostId`),
  INDEX `sessions_participantId_idx` (`participantId`),
  INDEX `sessions_status_idx`        (`status`),
  INDEX `sessions_language_idx`      (`language`),
  INDEX `sessions_scheduledAt_idx`   (`scheduledAt`),
  INDEX `sessions_createdAt_idx`     (`createdAt`),

  CONSTRAINT `sessions_requestId_fkey`
    FOREIGN KEY (`requestId`)     REFERENCES `help_requests` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `sessions_hostId_fkey`
    FOREIGN KEY (`hostId`)        REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `sessions_participantId_fkey`
    FOREIGN KEY (`participantId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
--  TABLE: feedbacks
--  CHECK: rating BETWEEN 1 AND 5 (+ dimensionales)
-- ────────────────────────────────────────────────────────────
CREATE TABLE `feedbacks` (
  `id`                    VARCHAR(36) NOT NULL DEFAULT (UUID()),
  `sessionId`             VARCHAR(36) NOT NULL,
  `reviewerId`            VARCHAR(36) NOT NULL,
  `revieweeId`            VARCHAR(36) NOT NULL,
  `rating`                TINYINT     NOT NULL,
  `ratingCommunication`   TINYINT              DEFAULT NULL,
  `ratingKnowledge`       TINYINT              DEFAULT NULL,
  `ratingPunctuality`     TINYINT              DEFAULT NULL,
  `comment`               TEXT                 DEFAULT NULL,
  `wouldRecommend`        TINYINT(1)  NOT NULL DEFAULT 1,
  `createdAt`             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session_feedback` (`sessionId`, `reviewerId`, `revieweeId`),
  INDEX `feedbacks_sessionId_idx`   (`sessionId`),
  INDEX `feedbacks_reviewerId_idx`  (`reviewerId`),
  INDEX `feedbacks_revieweeId_idx`  (`revieweeId`),
  INDEX `feedbacks_rating_idx`      (`rating`),
  INDEX `feedbacks_createdAt_idx`   (`createdAt`),

  -- CHECK CONSTRAINTS — rating general y por dimensión
  CONSTRAINT `chk_feedbacks_rating`
    CHECK (`rating` >= 1 AND `rating` <= 5),
  CONSTRAINT `chk_feedbacks_ratingCommunication`
    CHECK (`ratingCommunication` IS NULL OR (`ratingCommunication` >= 1 AND `ratingCommunication` <= 5)),
  CONSTRAINT `chk_feedbacks_ratingKnowledge`
    CHECK (`ratingKnowledge` IS NULL OR (`ratingKnowledge` >= 1 AND `ratingKnowledge` <= 5)),
  CONSTRAINT `chk_feedbacks_ratingPunctuality`
    CHECK (`ratingPunctuality` IS NULL OR (`ratingPunctuality` >= 1 AND `ratingPunctuality` <= 5)),

  CONSTRAINT `feedbacks_sessionId_fkey`
    FOREIGN KEY (`sessionId`)   REFERENCES `sessions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `feedbacks_reviewerId_fkey`
    FOREIGN KEY (`reviewerId`)  REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `feedbacks_revieweeId_fkey`
    FOREIGN KEY (`revieweeId`)  REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
