-- ============================================================
--  Migración: 20260924000001_add_meet_link_to_sessions
--  Agrega el campo meetLink a la tabla sessions
--  para almacenar el enlace Jitsi Meet generado en aceptación.
-- ============================================================

ALTER TABLE `sessions`
  ADD COLUMN `meetLink` VARCHAR(512) NULL
  AFTER `roomCode`;

CREATE INDEX `sessions_meetLink_idx` ON `sessions` (`meetLink`(255));
