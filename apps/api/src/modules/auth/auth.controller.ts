import {
  Controller, Post, Get, Body, Res, Req,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  registerSchema, loginSchema,
  RegisterInput, LoginInput,
} from '../../common/validation/schemas';
import { JwtPayload } from '../../domain/types/domain.types';
import { DatabaseService } from '../../database/database.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly db: DatabaseService,
  ) {}

  // ─── POST /api/v1/auth/register ───────────────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'HU-01 — Register a new user account with skills' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(body, res);
  }

  // ─── POST /api/v1/auth/login ──────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'HU-01 — Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful. Tokens set in HttpOnly cookies.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(body, res);
  }

  // ─── POST /api/v1/auth/refresh ────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh_token cookie' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)['refresh_token'];
    return this.authService.refresh(refreshToken, res);
  }

  // ─── POST /api/v1/auth/logout ────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Logout — revoke refresh token and clear cookies' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)['refresh_token'];
    await this.authService.logout(refreshToken, res);
  }

  // ─── GET /api/v1/users/me ─────────────────────────────────────
  // Note: placed here so AuthModule exports it; UsersModule also has /users/:id

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'HU-01 — Get authenticated user profile with skills' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.db.user.findUnique({
      where: { id: user.sub },
      select: {
        id:               true,
        email:            true,
        username:         true,
        displayName:      true,
        avatarUrl:        true,
        bio:              true,
        githubUrl:        true,
        role:             true,
        status:           true,
        isEmailVerified:  true,
        preferredLanguage: true,
        timezone:         true,
        lastLoginAt:      true,
        createdAt:        true,
        userSkills: {
          select: {
            proficiency:       true,
            yearsOfExperience: true,
            canMentor:         true,
            skill: {
              select: { id: true, name: true, slug: true, category: true },
            },
          },
        },
      },
    });
  }
}
