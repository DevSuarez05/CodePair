import {
  Controller, Post, Get, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { FeedbacksService } from './feedbacks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createFeedbackSchema,
  CreateFeedbackInput,
} from '../../common/validation/schemas';
import { JwtPayload } from '../../domain/types/domain.types';

@ApiTags('Feedbacks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions/:sessionId/feedback')
export class FeedbacksController {
  constructor(private readonly service: FeedbacksService) {}

  // ─── POST /api/v1/sessions/:sessionId/feedback ────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HU-05 — Submit feedback for a session participant',
    description:
      'Registers a rating (1–5) and comment. When both participants submit, ' +
      'the session is automatically marked as COMPLETED and the help request as RESOLVED.',
  })
  @ApiResponse({
    status: 201,
    description: 'Feedback submitted. Session closes to COMPLETED when both parties submit.',
  })
  @ApiResponse({ status: 400, description: 'Self-rating or invalid state' })
  @ApiResponse({ status: 403, description: 'Not a session participant' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Feedback already submitted' })
  create(
    @Param('sessionId') sessionId: string,
    @Body(new ZodValidationPipe(createFeedbackSchema)) body: CreateFeedbackInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(sessionId, user.sub, body);
  }

  // ─── GET /api/v1/sessions/:sessionId/feedback ─────────────────

  @Get()
  @ApiOperation({ summary: 'Get all feedbacks for a session (participants only)' })
  @ApiResponse({ status: 200, description: 'List of feedbacks' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  findAll(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findBySession(sessionId, user.sub);
  }
}
