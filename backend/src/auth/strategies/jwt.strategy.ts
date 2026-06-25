import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { loadSecurityConfig } from '../../common/config/security-config';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  activeOrgId: string;
  role: string;
  passwordVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const { jwtSecret } = loadSecurityConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        disabledAt: true,
        mustChangePassword: true,
        passwordVersion: true,
      },
    });

    if (
      !user ||
      user.disabledAt ||
      payload.passwordVersion !== user.passwordVersion
    ) {
      throw new UnauthorizedException('Sesión inválida o revocada');
    }

    // Retorna el payload del usuario autenticado que estará disponible en req.user
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      activeOrgId: payload.activeOrgId,
      role: payload.role,
      mustChangePassword: user.mustChangePassword,
      passwordVersion: user.passwordVersion,
    };
  }
}
