-- ============================================================
--  CodePair DB — Migración: Roles, Idiomas y Habilidades de Usuario
--  Motor   : MySQL 8.x
--  ORM     : Prisma 6.x
-- ============================================================

-- 1. Actualizar roles y columnas de la tabla `users`
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('APRENDIZ','MENTOR','ADMINISTRADOR','STUDENT','ADMIN') NOT NULL DEFAULT 'APRENDIZ',
  ADD COLUMN `name` VARCHAR(100) NOT NULL DEFAULT '' AFTER `id`,
  ADD COLUMN `language` ENUM('ES','EN','PT') NOT NULL DEFAULT 'ES' AFTER `timezone`;

-- 2. Asegurar que name tome el valor de displayName para registros existentes
UPDATE `users` SET `name` = `displayName` WHERE `name` = '' OR `name` IS NULL;

-- 3. Actualizar la tabla `user_skills` con la columna proficiency_level
ALTER TABLE `user_skills`
  ADD COLUMN `proficiency_level` ENUM('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL DEFAULT 'BEGINNER' AFTER `proficiency`;

-- 4. Sincronizar proficiency_level inicial a partir de proficiency numérico
UPDATE `user_skills` 
SET `proficiency_level` = CASE 
  WHEN `proficiency` >= 4 THEN 'ADVANCED'
  WHEN `proficiency` >= 2 THEN 'INTERMEDIATE'
  ELSE 'BEGINNER'
END;
