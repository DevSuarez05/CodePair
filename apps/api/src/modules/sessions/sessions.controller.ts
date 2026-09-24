import {
  Controller, Post, Get, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../domain/types/domain.types';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  // ─── POST /api/v1/requests/:id/accept ────────────────────────

  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('MENTOR', 'ADMIN')
  @ApiOperation({
    summary: 'HU-04 — Mentor accepts a help request (ACID, race-condition safe)',
    description:
      'Creates a session with a unique Jitsi Meet link. Uses SELECT FOR UPDATE with ' +
      'SERIALIZABLE isolation to prevent two mentors from accepting simultaneously.',
  })
  @ApiResponse({
    status: 201,
    description: 'Session created. Response includes meetLink (https://meet.jit.si/codepair-{uuid})',
  })
  @ApiResponse({ status: 403, description: 'Only MENTOR or ADMIN can accept requests' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({
    status: 409,
    description: 'Request already accepted by another mentor (race condition caught)',
  })
  acceptRequest(
    @Param('id') requestId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.acceptRequest(requestId, user.sub);
  }

  // ─── GET /api/v1/sessions ─────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: 'Get all sessions for the authenticated user' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of sessions' })
  findMySessions(
    @CurrentUser() user: JwtPayload,
    @Query('page')  page:  string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.service.findMySessions(user.sub, +page, +limit);
  }

  // ─── GET /api/v1/sessions/:id ─────────────────────────────────

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session detail (participant only)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user.sub);
  }
}
