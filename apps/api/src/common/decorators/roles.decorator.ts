import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/types/domain.types';

export const ROLES_KEY = 'roles';

/**
 * @decorator Roles
 * Marca un endpoint con los roles permitidos.
 * Usado en conjunto con RolesGuard.
 *
 * @example
 * @Roles('ADMIN', 'MENTOR')
 * @Get('admin-only')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
