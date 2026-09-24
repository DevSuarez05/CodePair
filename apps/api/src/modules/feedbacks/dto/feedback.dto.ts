/**
 * @file feedback.dto.ts
 * @description DTOs para el módulo de Feedbacks.
 *
 * El rating principal (1–5) es obligatorio.
 * Los ratings dimensionales (comunicación, conocimiento, puntualidad) son opcionales.
 * TODOS los valores numéricos de rating son validados con @Min(1) @Max(5)
 * para reflejar el CHECK CONSTRAINT de la base de datos.
 */

import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackRating } from '../../domain/types/domain.types';
import { UserResponseDto } from '../../modules/users/dto/user.dto';
import { SessionResponseDto } from '../../modules/sessions/dto/session.dto';

// ─── Request DTOs ─────────────────────────────────────────────

export class CreateFeedbackDto {
  @ApiProperty({ description: 'ID de la sesión que se evalúa' })
  @IsUUID('4', { message: 'sessionId debe ser un UUID v4 válido' })
  sessionId!: string;

  @ApiProperty({ description: 'ID del usuario que recibe la calificación' })
  @IsUUID('4', { message: 'revieweeId debe ser un UUID v4 válido' })
  revieweeId!: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Calificación general: 1=Muy malo · 2=Malo · 3=Regular · 4=Bueno · 5=Excelente',
  })
  @IsInt({ message: 'El rating debe ser un número entero' })
  @Min(1, { message: 'El rating mínimo es 1' })
  @Max(5, { message: 'El rating máximo es 5' })
  rating!: FeedbackRating;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Calificación de comunicación (opcional)',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El rating de comunicación mínimo es 1' })
  @Max(5, { message: 'El rating de comunicación máximo es 5' })
  ratingCommunication?: FeedbackRating;

  @ApiPropertyOptional({
    example: 4,
    minimum: 1,
    maximum: 5,
    description: 'Calificación de conocimiento técnico (opcional)',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El rating de conocimiento mínimo es 1' })
  @Max(5, { message: 'El rating de conocimiento máximo es 5' })
  ratingKnowledge?: FeedbackRating;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Calificación de puntualidad (opcional)',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El rating de puntualidad mínimo es 1' })
  @Max(5, { message: 'El rating de puntualidad máximo es 5' })
  ratingPunctuality?: FeedbackRating;

  @ApiPropertyOptional({
    example: 'Excelente mentor, me explicó el concepto de manera muy clara.',
    description: 'Comentario libre (máximo 2000 caracteres)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'El comentario no puede superar los 2000 caracteres' })
  comment?: string;

  @ApiPropertyOptional({
    default: true,
    description: '¿Recomendarías trabajar con esta persona?',
  })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;
}

export class FeedbackFilterDto {
  @ApiPropertyOptional({ description: 'Filtrar por sessionId' })
  @IsOptional()
  @IsUUID('4')
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Filtrar feedbacks dados por este usuario' })
  @IsOptional()
  @IsUUID('4')
  reviewerId?: string;

  @ApiPropertyOptional({ description: 'Filtrar feedbacks recibidos por este usuario' })
  @IsOptional()
  @IsUUID('4')
  revieweeId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

// ─── Response DTOs ────────────────────────────────────────────

@Exclude()
export class FeedbackResponseDto {
  @Expose() @ApiProperty()         id!: string;
  @Expose() @ApiProperty()         sessionId!: string;
  @Expose() @ApiProperty()         reviewerId!: string;
  @Expose() @ApiProperty()         revieweeId!: string;
  @Expose() @ApiProperty()         rating!: FeedbackRating;
  @Expose() @ApiPropertyOptional() ratingCommunication!: FeedbackRating | null;
  @Expose() @ApiPropertyOptional() ratingKnowledge!: FeedbackRating | null;
  @Expose() @ApiPropertyOptional() ratingPunctuality!: FeedbackRating | null;
  @Expose() @ApiPropertyOptional() comment!: string | null;
  @Expose() @ApiProperty()         wouldRecommend!: boolean;
  @Expose() @ApiProperty()         createdAt!: Date;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({ type: UserResponseDto })
  reviewer?: UserResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({ type: UserResponseDto })
  reviewee?: UserResponseDto;

  @Expose()
  @Type(() => SessionResponseDto)
  @ApiPropertyOptional({ type: SessionResponseDto })
  session?: SessionResponseDto;
}

/** DTO de resumen de ratings para el perfil de un usuario */
@Exclude()
export class UserRatingSummaryDto {
  @Expose() @ApiProperty() userId!: string;
  @Expose() @ApiProperty() totalFeedbacks!: number;
  @Expose() @ApiProperty({ description: 'Promedio general' }) averageRating!: number;
  @Expose() @ApiPropertyOptional() averageCommunication!: number | null;
  @Expose() @ApiPropertyOptional() averageKnowledge!: number | null;
  @Expose() @ApiPropertyOptional() averagePunctuality!: number | null;
  @Expose() @ApiProperty() wouldRecommendPercentage!: number;
}
