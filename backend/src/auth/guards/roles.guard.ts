import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RoleAwareRequest {
  userRole?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RoleAwareRequest>();
    const userRole = request.userRole;
    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción.',
      );
    }

    return true;
  }
}
