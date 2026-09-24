import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * @guard JwtAuthGuard
 * Valida el JWT desde la cookie HttpOnly `access_token`.
 * Extiende el guard estándar de Passport para mejores mensajes de error.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        err?.message ?? 'Authentication required. Please log in.',
      );
    }
    return user;
  }
}
