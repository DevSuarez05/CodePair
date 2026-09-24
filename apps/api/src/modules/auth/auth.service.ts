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
  name: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
  language: string;
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
    // 1. Resolver username único si no se envió explícitamente
    const rawUsername = (input.username || input.email.split('@')[0] || 'dev')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 35);

    // 2. Verificar unicidad de email y username
    const [emailExists, usernameExists] = await Promise.all([
      this.db.user.findUnique({ where: { email: input.email.toLowerCase().trim() }, select: { id: true } }),
      this.db.user.findUnique({ where: { username: rawUsername }, select: { id: true } }),
    ]);

    if (emailExists) {
      throw new ConflictException('Ya existe una cuenta registrada con este correo electrónico institucional.');
    }

    const finalUsername = usernameExists
      ? `${rawUsername}_${Math.random().toString(36).substring(2, 6)}`
      : rawUsername;

    // 3. Proteger autoasignación de rol ADMINISTRADOR
    if ((input.role as string) === 'ADMINISTRADOR' || (input.role as string) === 'ADMIN') {
      throw new BadRequestException('El rol de ADMINISTRADOR no puede ser autoasignado públicamente.');
    }

    // 4. Validar que los skillIds existan si se proporcionaron (filtrar o verificar)
    if (input.skills.length > 0) {
      const skillIds = input.skills.map((s) => s.skillId);
      const foundSkills = await this.db.skill.findMany({
        where: { id: { in: skillIds }, isActive: true },
        select: { id: true },
      });

      const foundIds = new Set(foundSkills.map((s) => s.id));
      const invalidIds = skillIds.filter((id) => !foundIds.has(id));
      if (invalidIds.length > 0) {
        this.logger.warn(`Skills omitidas por no existir en catálogo: ${invalidIds.join(', ')}`);
      }
    }

    // 5. Hashear contraseña con Argon2 (o factor de costo equivalente a bcrypt >= 10)
    const passwordHash = await argon2.hash(input.password, {
      memoryCost: this.config.get<number>('auth.argon2.memoryCost', 65536),
      timeCost:   this.config.get<number>('auth.argon2.timeCost', 3),
      parallelism: this.config.get<number>('auth.argon2.parallelism', 4),
    });

    // 6. Crear usuario + user_skills en una transacción atómica
    const user = await this.db.transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name:              input.name,
          displayName:       input.displayName || input.name,
          username:          finalUsername,
          email:             input.email.toLowerCase().trim(),
          passwordHash,
          timezone:          input.timezone || 'UTC-5',
          language:          (input.language || 'ES') as any,
          preferredLanguage: (input.preferredLanguage || 'TYPESCRIPT') as any,
          role:              input.role as any,
          bio:               input.bio ?? null,
          status:            'ACTIVE',
          isEmailVerified:   false,
        },
        select: userSelectFields,
      });

      // Insertar relaciones de habilidades técnicas seleccionadas
      if (input.skills.length > 0) {
        await tx.userSkill.createMany({
          data: input.skills.map((s) => ({
            userId:           createdUser.id,
            skillId:          s.skillId,
            proficiency:      PROFICIENCY_MAP[s.level] ?? 1,
            proficiencyLevel: s.level as any,
            canMentor:        input.role === 'MENTOR' || s.level === 'ADVANCED',
          })),
          skipDuplicates: true,
        });
      }

      return createdUser;
    });

    this.logger.log(`Nuevo usuario registrado exitosamente: ${user.email} con rol [${user.role}]`);

    // 7. Generar tokens JWT y asignar cookies seguras HttpOnly
    const tokenPair = await this.generateTokens(user.id, user.email, user.role, false);
    this.setAuthCookies(res, tokenPair.accessToken, tokenPair.refreshToken, false);

    // 8. Respuesta sanitizada (sin passwordHash)
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
  id:                true,
  name:              true,
  email:             true,
  username:          true,
  displayName:       true,
  avatarUrl:         true,
  bio:               true,
  role:              true,
  status:            true,
  isEmailVerified:   true,
  language:          true,
  preferredLanguage: true,
  timezone:          true,
  createdAt:         true,
} as const;
