import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Obtener orgId del Header o usar la predeterminada del JWT
    const headerOrgId = request.headers['x-organization-id'] as string;
    const targetOrgId = headerOrgId || user.activeOrgId;

    if (!targetOrgId) {
      throw new ForbiddenException(
        'No se especificó ninguna organización activa',
      );
    }

    // Verificar membresía en la base de datos
    const membership = await this.prisma.membership.findUnique({
      where: {
        unique_user_organization: {
          userId: user.id,
          organizationId: targetOrgId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('No tienes acceso a esta organización');
    }

    // Inyectar contexto tenant en el request para uso en controladores
    request.orgId = targetOrgId;
    request.userRole = membership.role;

    // Sincronizar el user object para que los controladores tengan el rol y org correctos
    request.user.activeOrgId = targetOrgId;
    request.user.role = membership.role;

    return true;
  }
}
