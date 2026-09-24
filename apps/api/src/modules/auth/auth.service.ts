import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Response } from 'express';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../../domain/types/domain.types';
import {
  RegisterInput,
  LoginInput,
  PROFICIENCY_MAP,
} from '../../common/validation/schemas';

// ─── Response shapes ──────────────────────────────────────────

export interface AuthUserResponse {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
  preferredLanguage: string;
  timezone: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: AuthUserResponse;
  accessToken: string;
  expiresIn: number;
}

// ─── Cookie helpers ───────────────────────────────────────────

const ACCESS_COOKIE  = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────
  //  REGISTER
  // ──────────────────────────────────────────────────────────────

  async register(input: RegisterInput, res: Response): Promise<AuthResponse> {
    // 1. Verificar unicidad de email y username
    const [emailExists, usernameExists] = await Promise.all([
      this.db.user.findUnique({ where: { email: input.email }, select: { id: true } }),
      this.db.user.findUnique({ where: { username: input.username }, select: { id: true } }),
    ]);

    if (emailExists) {
      throw new ConflictException('An account with this email already exists.');
    }
    if (usernameExists) {
      throw new ConflictException('This username is already taken.');
    }

    // 2. Validar que todos los skillIds existan (si se proveyeron)
    if (input.skills.length > 0) {
      const skillIds = input.skills.map((s) => s.skillId);
      const foundSkills = await this.db.skill.findMany({
        where: { id: { in: skillIds }, isActive: true },
        select: { id: true },
      });

      const foundIds = new Set(foundSkills.map((s) => s.id));
      const invalidIds = skillIds.filter((id) => !foundIds.has(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `The following skill IDs are invalid or inactive: ${invalidIds.join(', ')}`,
        );
      }
    }

    // 3. Hashear contraseña con Argon2
    const passwordHash = await argon2.hash(input.password, {
      memoryCost: this.config.get<number>('auth.argon2.memoryCost', 65536),
      timeCost:   this.config.get<number>('auth.argon2.timeCost', 3),
      parallelism: this.config.get<number>('auth.argon2.parallelism', 4),
    });

    // 4. Crear usuario + skills en una sola transacción
    const user = await this.db.transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email:             input.email,
          username:          input.username,
          displayName:       input.displayName,
          passwordHash,
          timezone:          input.timezone,
          preferredLanguage: input.preferredLanguage,
          role:              'STUDENT',
          status:            'ACTIVE',    // simplificado (sin email verification en este flujo)
          isEmailVerified:   false,
        },
        select: userSelectFields,
      });

      // Insertar skills si se proveyeron
      if (input.skills.length > 0) {
        await tx.userSkill.createMany({
          data: input.skills.map((s) => ({
            userId:      createdUser.id,
            skillId:     s.skillId,
            proficiency: PROFICIENCY_MAP[s.level] ?? 1,
            canMentor:   s.level === 'ADVANCED',
          })),
          skipDuplicates: true,
        });
      }

      return createdUser;
    });

    this.logger.log(`New user registered: ${user.email}`);

    // 5. Generar tokens y fijar cookies
    const tokenPair = await this.generateTokens(user.id, user.email, user.role, false);
    this.setAuthCookies(res, tokenPair.accessToken, tokenPair.refreshToken, false);

    return {
      user: user as AuthUserResponse,
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  LOGIN
  // ──────────────────────────────────────────────────────────────

  async login(input: LoginInput, res: Response): Promise<AuthResponse> {
    // 1. Buscar usuario por email
    const user = await this.db.user.findUnique({
      where: { email: input.email, deletedAt: null },
      select: { ...userSelectFields, passwordHash: true },
    });

    if (!user) {
      // Mensaje genérico para no revelar si el email existe
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 2. Verificar contraseña con Argon2
    const passwordValid = await argon2.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 3. Verificar estado de cuenta
    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Your account has been banned. Contact support.');
    }
    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException('Your account is inactive.');
    }

    // 4. Actualizar lastLoginAt (sin bloquear la respuesta)
    void this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`);

    // 5. Generar tokens y fijar cookies
    const tokenPair = await this.generateTokens(user.id, user.email, user.role, input.rememberMe);
    this.setAuthCookies(res, tokenPair.accessToken, tokenPair.refreshToken, input.rememberMe);

    const { passwordHash: _ph, ...userWithoutHash } = user;

    return {
      user: userWithoutHash as AuthUserResponse,
      accessToken: tokenPair.accessToken,
      expiresIn: tokenPair.expiresIn,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  REFRESH
  // ──────────────────────────────────────────────────────────────

  async refresh(refreshToken: string, res: Response): Promise<{ accessToken: string; expiresIn: number }> {
    // 1. Verificar refresh token en DB
    const stored = await this.db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: userSelectFields } },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token. Please log in again.');
    }

    if (stored.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive.');
    }

    // 2. Rotar refresh token (revocar el actual, crear uno nuevo)
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwt.signAsync({
        sub:   stored.user.id,
        email: stored.user.email,
        role:  stored.user.role,
      }),
      this.generateRefreshTokenString(),
    ]);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    await this.db.transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { isRevoked: true },
      });
      await tx.refreshToken.create({
        data: {
          token:     newRefreshToken,
          userId:    stored.user.id,
          expiresAt: refreshExpiry,
        },
      });
    });

    this.setAuthCookies(res, newAccessToken, newRefreshToken, false);

    return { accessToken: newAccessToken, expiresIn: 15 * 60 };
  }

  // ──────────────────────────────────────────────────────────────
  //  LOGOUT
  // ──────────────────────────────────────────────────────────────

  async logout(refreshToken: string | undefined, res: Response): Promise<void> {
    if (refreshToken) {
      // Revocar token en DB de forma silenciosa (no fallar si no existe)
      await this.db.refreshToken
        .update({
          where: { token: refreshToken },
          data: { isRevoked: true },
        })
        .catch(() => undefined);
    }

    // Limpiar cookies
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
  }

  // ──────────────────────────────────────────────────────────────
  //  HELPERS PRIVADOS
  // ──────────────────────────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    rememberMe: boolean,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const payload: JwtPayload = { sub: userId, email, role: role as JwtPayload['role'] };

    const [accessToken, refreshTokenString] = await Promise.all([
      this.jwt.signAsync(payload),
      this.generateRefreshTokenString(),
    ]);

    // Refresh expiry: 7 días normal, 30 días con rememberMe
    const refreshDays = rememberMe ? 30 : 7;
    const refreshExpiry = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    // Persistir refresh token
    await this.db.refreshToken.create({
      data: {
        token:     refreshTokenString,
        userId,
        expiresAt: refreshExpiry,
      },
    });

    return { accessToken, refreshToken: refreshTokenString, expiresIn: 15 * 60 };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean,
  ): void {
    const isProduction = this.config.get<string>('app.nodeEnv') === 'production';
    const baseOptions = {
      httpOnly: true,
      secure:   isProduction,
      sameSite: 'lax' as const,
      path:     '/',
    };

    res.cookie(ACCESS_COOKIE, accessToken, {
      ...baseOptions,
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...baseOptions,
      maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
      path:   '/api/v1/auth/refresh', // Scope del refresh cookie
    });
  }

  private generateRefreshTokenString(): string {
    // Genera 64 bytes aleatorios en hex
    return [...Array(64)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
  }
}

// ─── Select Fields ─────────────────────────────────────────────

const userSelectFields = {
  id:               true,
  email:            true,
  username:         true,
  displayName:      true,
  avatarUrl:        true,
  role:             true,
  status:           true,
  isEmailVerified:  true,
  preferredLanguage: true,
  timezone:         true,
  createdAt:        true,
} as const;
