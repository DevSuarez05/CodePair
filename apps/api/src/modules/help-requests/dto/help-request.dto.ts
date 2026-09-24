/**
 * @file help-request.dto.ts
 * @description DTOs para el módulo de Solicitudes de Ayuda.
 */

import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  HelpRequestPriority,
  HelpRequestStatus,
  HELP_REQUEST_PRIORITIES,
  HELP_REQUEST_STATUSES,
  PROGRAMMING_LANGUAGES,
  ProgrammingLanguage,
} from '../../domain/types/domain.types';
import { UserResponseDto } from '../../modules/users/dto/user.dto';
import { SkillResponseDto } from '../../modules/users/dto/skill.dto';

// ─── Request DTOs ─────────────────────────────────────────────

export class CreateHelpRequestDto {
  @ApiProperty({ example: 'useEffect se ejecuta infinitamente en loop' })
  @IsString()
  @MinLength(5, { message: 'El título debe tener mínimo 5 caracteres' })
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'Tengo un componente React que...' })
  @IsString()
  @MinLength(20, { message: 'La descripción debe ser más detallada (mínimo 20 caracteres)' })
  @MaxLength(10000)
  description!: string;

  @ApiPropertyOptional({ example: 'const [users, setUsers] = useState([]);...' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  codeSnippet?: string;

  @ApiPropertyOptional({ example: 'Warning: Maximum update depth exceeded...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  errorMessage?: string;

  @ApiProperty({ enum: PROGRAMMING_LANGUAGES, example: 'JAVASCRIPT' })
  @IsEnum(PROGRAMMING_LANGUAGES, { message: 'Lenguaje de programación no válido' })
  language!: ProgrammingLanguage;

  @ApiPropertyOptional({ enum: HELP_REQUEST_PRIORITIES, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(HELP_REQUEST_PRIORITIES)
  priority?: HelpRequestPriority;

  @ApiPropertyOptional({ example: 45, description: 'Duración estimada en minutos' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480) // máx 8 horas
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: 'Fecha de expiración inválida (ISO 8601)' })
  expiresAt?: string;

  @ApiPropertyOptional({ type: [String], example: ['uuid-react', 'uuid-javascript'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada skillId debe ser un UUID v4 válido' })
  skillIds?: string[];
}

export class UpdateHelpRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  codeSnippet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  errorMessage?: string;

  @ApiPropertyOptional({ enum: HELP_REQUEST_PRIORITIES })
  @IsOptional()
  @IsEnum(HELP_REQUEST_PRIORITIES)
  priority?: HelpRequestPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  estimatedMinutes?: number;
}

export class HelpRequestFilterDto {
  @ApiPropertyOptional({ enum: HELP_REQUEST_STATUSES })
  @IsOptional()
  @IsEnum(HELP_REQUEST_STATUSES)
  status?: HelpRequestStatus;

  @ApiPropertyOptional({ enum: HELP_REQUEST_PRIORITIES })
  @IsOptional()
  @IsEnum(HELP_REQUEST_PRIORITIES)
  priority?: HelpRequestPriority;

  @ApiPropertyOptional({ enum: PROGRAMMING_LANGUAGES })
  @IsOptional()
  @IsEnum(PROGRAMMING_LANGUAGES)
  language?: ProgrammingLanguage;

  @ApiPropertyOptional({ example: 'uuid-de-skill' })
  @IsOptional()
  @IsUUID('4')
  skillId?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// ─── Response DTOs ────────────────────────────────────────────

@Exclude()
export class HelpRequestResponseDto {
  @Expose() @ApiProperty()                    id!: string;
  @Expose() @ApiProperty()                    studentId!: string;
  @Expose() @ApiPropertyOptional()            mentorId!: string | null;
  @Expose() @ApiProperty()                    title!: string;
  @Expose() @ApiProperty()                    description!: string;
  @Expose() @ApiPropertyOptional()            codeSnippet!: string | null;
  @Expose() @ApiPropertyOptional()            errorMessage!: string | null;
  @Expose() @ApiProperty()                    language!: ProgrammingLanguage;
  @Expose() @ApiProperty()                    status!: HelpRequestStatus;
  @Expose() @ApiProperty()                    priority!: HelpRequestPriority;
  @Expose() @ApiPropertyOptional()            estimatedMinutes!: number | null;
  @Expose() @ApiPropertyOptional()            acceptedAt!: Date | null;
  @Expose() @ApiPropertyOptional()            resolvedAt!: Date | null;
  @Expose() @ApiPropertyOptional()            expiresAt!: Date | null;
  @Expose() @ApiProperty()                    createdAt!: Date;
  @Expose() @ApiProperty()                    updatedAt!: Date;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({ type: UserResponseDto })
  student?: UserResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({ type: UserResponseDto })
  mentor?: UserResponseDto | null;

  @Expose()
  @Type(() => SkillResponseDto)
  @ApiPropertyOptional({ type: [SkillResponseDto] })
  skills?: SkillResponseDto[];
}
