/**
 * @file user.dto.ts
 * @description DTOs para el módulo de Usuarios.
 *
 * Convenciones:
 * - *RequestDto  → entrada del cliente (validada con class-validator)
 * - *ResponseDto → salida al cliente (serializada con class-transformer)
 * - Decorador @Expose() marca los campos que se incluyen en la respuesta
 * - Decorador @Exclude() oculta campos sensibles (passwordHash, tokens)
 */

import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserRole,
  UserStatus,
  ProgrammingLanguage,
  PROGRAMMING_LANGUAGES,
  ProficiencyLevel,
} from '../../../domain/types/domain.types';

// ─────────────────────────────────────────────────────────────
//  REQUEST DTOs (Entrada del cliente)
// ─────────────────────────────────────────────────────────────

export class RegisterUserDto {
  @ApiProperty({ example: 'alice.johnson@demo.com' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'alice_dev', description: 'Solo letras minúsculas, números, _ y -' })
  @IsString()
  @MinLength(3, { message: 'El username debe tener mínimo 3 caracteres' })
  @MaxLength(50, { message: 'El username debe tener máximo 50 caracteres' })
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'El username solo puede contener letras minúsculas, números, guión y guión bajo',
  })
  username!: string;

  @ApiProperty({ example: 'Alice Johnson' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  @MaxLength(100)
  displayName!: string;

  @ApiProperty({
    example: 'SecureP@ss123!',
    description: 'Mínimo 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 especial',
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/, {
    message:
      'La contraseña debe contener al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial',
  })
  password!: string;
}

export class LoginUserDto {
  @ApiProperty({ example: 'alice.johnson@demo.com' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123!' })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password!: string;

  @ApiPropertyOptional({ default: false, description: 'Mantener sesión activa (refresh token de 30d)' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Alice Johnson Updated' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Senior Full-Stack Developer...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://github.com/alice-dev' })
  @IsOptional()
  @IsUrl({}, { message: 'Debe ser una URL válida' })
  @MaxLength(255)
  githubUrl?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/alice' })
  @IsOptional()
  @IsUrl({}, { message: 'Debe ser una URL válida' })
  @MaxLength(255)
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'America/Mexico_City' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({ enum: PROGRAMMING_LANGUAGES })
  @IsOptional()
  @IsEnum(PROGRAMMING_LANGUAGES, { message: 'Lenguaje no válido' })
  preferredLanguage?: ProgrammingLanguage;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/, {
    message: 'La nueva contraseña debe cumplir los requisitos de seguridad',
  })
  newPassword!: string;
}

// ─────────────────────────────────────────────────────────────
//  RESPONSE DTOs (Salida al cliente)
// ─────────────────────────────────────────────────────────────

/** Respuesta pública de usuario — sin datos sensibles */
@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  email!: string;

  @Expose()
  @ApiProperty()
  username!: string;

  @Expose()
  @ApiProperty()
  displayName!: string;

  @Expose()
  @ApiPropertyOptional()
  avatarUrl!: string | null;

  @Expose()
  @ApiPropertyOptional()
  bio!: string | null;

  @Expose()
  @ApiPropertyOptional()
  githubUrl!: string | null;

  @Expose()
  @ApiPropertyOptional()
  linkedinUrl!: string | null;

  @Expose()
  @ApiProperty({ enum: ['STUDENT', 'MENTOR', 'ADMIN'] })
  role!: UserRole;

  @Expose()
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION'] })
  status!: UserStatus;

  @Expose()
  @ApiProperty()
  isEmailVerified!: boolean;

  @Expose()
  @ApiProperty()
  preferredLanguage!: ProgrammingLanguage;

  @Expose()
  @ApiProperty()
  timezone!: string;

  @Expose()
  @ApiPropertyOptional()
  lastLoginAt!: Date | null;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  // Campos excluidos automáticamente por @Exclude() en la clase:
  // passwordHash, emailVerifyToken, passwordResetToken, passwordResetExpiry, updatedAt, deletedAt
}

/** Respuesta con token pair (retornada en login/register/refresh) */
export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  @ApiProperty({ example: 'eyJhbGc...' })
  accessToken!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;
}

/** Respuesta de skill asociada a usuario */
@Exclude()
export class UserSkillResponseDto {
  @Expose() skillId!: string;
  @Expose() proficiency!: ProficiencyLevel;
  @Expose() yearsOfExperience!: number | null;
  @Expose() canMentor!: boolean;
  @Expose() createdAt!: Date;

  @Expose()
  @Type(() => SkillInUserResponseDto)
  skill?: SkillInUserResponseDto;
}

@Exclude()
class SkillInUserResponseDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() slug!: string;
  @Expose() category!: string;
  @Expose() iconUrl!: string | null;
}
