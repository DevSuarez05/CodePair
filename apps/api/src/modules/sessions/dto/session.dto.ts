/**
 * @file session.dto.ts
 * @description DTOs para el módulo de Sesiones.
 */

import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProgrammingLanguage,
  PROGRAMMING_LANGUAGES,
  SessionStatus,
  SESSION_STATUSES,
} from '../../../domain/types/domain.types';
import { UserResponseDto } from '../../users/dto/user.dto';

// ─── Request DTOs ─────────────────────────────────────────────

export class CreateSessionDto {
  @ApiPropertyOptional({ description: 'ID de la HelpRequest que origina esta sesión (UNIQUE)' })
  @IsOptional()
  @IsUUID('4', { message: 'requestId debe ser un UUID v4 válido' })
  requestId?: string;

  @ApiProperty({ example: 'Debugging React useEffect — Alice & Bob' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: PROGRAMMING_LANGUAGES })
  @IsEnum(PROGRAMMING_LANGUAGES, { message: 'Lenguaje no válido' })
  language!: ProgrammingLanguage;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ example: '2026-12-01T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: 'Fecha programada inválida (ISO 8601)' })
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'const x = ...' })
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  initialCode?: string;
}

export class JoinSessionDto {
  @ApiProperty({ example: 'A1B2C3D4', description: 'Código de sala de 8 caracteres (case-insensitive)' })
  @IsString()
  @Length(8, 8, { message: 'El código de sala debe tener exactamente 8 caracteres' })
  roomCode!: string;
}

export class UpdateSessionStatusDto {
  @ApiProperty({ enum: SESSION_STATUSES })
  @IsEnum(SESSION_STATUSES, { message: 'Estado de sesión no válido' })
  status!: SessionStatus;
}

export class SaveSessionCodeDto {
  @ApiProperty({ example: 'const solution = ...' })
  @IsString()
  @MaxLength(500000) // 500KB máximo de código
  finalCode!: string;
}

export class SessionFilterDto {
  @ApiPropertyOptional({ enum: SESSION_STATUSES })
  @IsOptional()
  @IsEnum(SESSION_STATUSES)
  status?: SessionStatus;

  @ApiPropertyOptional({ enum: PROGRAMMING_LANGUAGES })
  @IsOptional()
  @IsEnum(PROGRAMMING_LANGUAGES)
  language?: ProgrammingLanguage;

  @ApiPropertyOptional({ description: 'Filtrar por hostId' })
  @IsOptional()
  @IsUUID('4')
  hostId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  limit?: number;
}

// ─── Response DTOs ────────────────────────────────────────────

@Exclude()
export class SessionResponseDto {
  @Expose() @ApiProperty()         id!: string;
  @Expose() @ApiPropertyOptional() requestId!: string | null;
  @Expose() @ApiProperty()         hostId!: string;
  @Expose() @ApiPropertyOptional() participantId!: string | null;
  @Expose() @ApiProperty()         title!: string;
  @Expose() @ApiPropertyOptional() description!: string | null;
  @Expose() @ApiProperty()         roomCode!: string;
  @Expose() @ApiProperty()         language!: ProgrammingLanguage;
  @Expose() @ApiProperty()         status!: SessionStatus;
  @Expose() @ApiProperty()         isPrivate!: boolean;
  @Expose() @ApiPropertyOptional() scheduledAt!: Date | null;
  @Expose() @ApiPropertyOptional() startedAt!: Date | null;
  @Expose() @ApiPropertyOptional() endedAt!: Date | null;
  @Expose() @ApiPropertyOptional() durationSeconds!: number | null;
  @Expose() @ApiProperty()         createdAt!: Date;
  @Expose() @ApiProperty()         updatedAt!: Date;

  // initialCode y finalCode excluidos por defecto — se exponen en endpoints específicos
  @Expose()
  @ApiPropertyOptional({ description: 'Solo incluido al solicitar detalle de sesión' })
  finalCode?: string | null;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({ type: UserResponseDto })
  host?: UserResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({ type: UserResponseDto })
  participant?: UserResponseDto | null;
}
