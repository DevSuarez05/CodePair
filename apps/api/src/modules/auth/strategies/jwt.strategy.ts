import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../../../domain/types/domain.types';
import { DatabaseService } from '../../../database/database.service';

/**
 * @strategy JwtStrategy
 *
 * Extrae el JWT desde la cookie HttpOnly `access_token`.
 * Valida que el usuario siga activo en la base de datos en cada request.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
  ) {
    super({
      // Extrae el token desde la cookie HttpOnly
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return (req?.cookies as Record<string, string>)?.['access_token'] ?? null;
        },
        // Fallback: Bearer token en Authorization header (para testing con Swagger)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.jwt.accessSecret', ''),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verificar que el usuario siga existiendo y activo
    const user = await this.db.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive or does not exist.');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
