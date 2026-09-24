/**
 * @file skill.dto.ts
 * @description DTOs para el módulo de Skills.
 */

import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SKILL_CATEGORIES, SkillCategory, ProficiencyLevel } from '../../domain/types/domain.types';

// ─── Request DTOs ─────────────────────────────────────────────

export class CreateSkillDto {
  @ApiProperty({ example: 'GraphQL' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: SKILL_CATEGORIES, example: 'Framework' })
  @IsEnum(SKILL_CATEGORIES, { message: 'Categoría no válida' })
  category!: SkillCategory;

  @ApiPropertyOptional({ example: 'Lenguaje de consulta para APIs...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.icons.com/graphql.svg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  iconUrl?: string;
}

export class UpdateSkillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: SKILL_CATEGORIES })
  @IsOptional()
  @IsEnum(SKILL_CATEGORIES)
  category?: SkillCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** DTO para asignar/actualizar una skill al usuario autenticado */
export class UpsertUserSkillDto {
  @ApiProperty({ example: 'uuid-de-la-skill' })
  @IsString()
  skillId!: string;

  @ApiProperty({
    example: 3,
    description: '1=Beginner · 2=Basic · 3=Intermediate · 4=Advanced · 5=Expert',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: 'La proficiencia mínima es 1 (Beginner)' })
  @Max(5, { message: 'La proficiencia máxima es 5 (Expert)' })
  proficiency!: ProficiencyLevel;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canMentor?: boolean;
}

export class SkillFilterDto {
  @ApiPropertyOptional({ enum: SKILL_CATEGORIES })
  @IsOptional()
  @IsEnum(SKILL_CATEGORIES)
  category?: SkillCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Response DTOs ────────────────────────────────────────────

@Exclude()
export class SkillResponseDto {
  @Expose() @ApiProperty() id!: string;
  @Expose() @ApiProperty() name!: string;
  @Expose() @ApiProperty() slug!: string;
  @Expose() @ApiProperty() category!: string;
  @Expose() @ApiPropertyOptional() description!: string | null;
  @Expose() @ApiPropertyOptional() iconUrl!: string | null;
  @Expose() @ApiProperty() isActive!: boolean;
  @Expose() @ApiProperty() createdAt!: Date;
}
