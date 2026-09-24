import {
  Controller, Post, Get, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { HelpRequestsService } from './help-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createHelpRequestSchema,
  helpRequestFilterSchema,
  CreateHelpRequestInput,
  HelpRequestFilterInput,
} from '../../common/validation/schemas';
import { JwtPayload } from '../../domain/types/domain.types';

@ApiTags('Help Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class HelpRequestsController {
  constructor(private readonly service: HelpRequestsService) {}

  // ─── POST /api/v1/requests ────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'HU-02 — Create a new technical help request',
    description: 'Student publishes a request linked to a skill. Status starts as OPEN.',
  })
  @ApiResponse({ status: 201, description: 'Request created' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate open request' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  create(
    @Body(new ZodValidationPipe(createHelpRequestSchema)) body: CreateHelpRequestInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(body, user.sub);
  }

  // ─── GET /api/v1/requests ─────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'HU-03 — Get global dynamic feed of help requests',
    description: 'Filterable by skillId, language, status, priority. Paginated.',
  })
  @ApiQuery({ name: 'skillId',  required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'status',   required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'page',     required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit',    required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of help requests' })
  findAll(
    @Query(new ZodValidationPipe(helpRequestFilterSchema)) query: HelpRequestFilterInput,
  ) {
    return this.service.findAll(query);
  }

  // ─── GET /api/v1/requests/:id ─────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single help request with full detail' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ─── PATCH /api/v1/requests/:id/cancel ───────────────────────

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an open help request (student only)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Not your request' })
  @ApiResponse({ status: 400, description: 'Cannot cancel in current state' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cancel(id, user.sub);
  }
}
