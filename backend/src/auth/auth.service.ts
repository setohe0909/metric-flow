import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || user.disabledAt) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Buscar organizaciones y membresía del usuario
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (memberships.length === 0) {
      throw new BadRequestException(
        'El usuario no pertenece a ninguna organización',
      );
    }

    // Usar la primera membresía como default activeOrgId
    const defaultMembership = memberships[0];
    const organization = defaultMembership.organization;

    // Firmar token JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      activeOrgId: organization.id,
      role: defaultMembership.role,
      passwordVersion: user.passwordVersion,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mustChangePassword: user.mustChangePassword,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: defaultMembership.role,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mustChangePassword: true,
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mustChangePassword: user.mustChangePassword,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.disabledAt) {
      throw new UnauthorizedException('Usuario no disponible');
    }

    const currentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordVersion: { increment: 1 },
      },
    });

    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!membership) {
      throw new BadRequestException(
        'El usuario no pertenece a ninguna organización',
      );
    }

    const token = this.jwtService.sign({
      sub: updatedUser.id,
      email: updatedUser.email,
      activeOrgId: membership.organization.id,
      role: membership.role,
      passwordVersion: updatedUser.passwordVersion,
    });

    return {
      token,
      mustChangePassword: updatedUser.mustChangePassword,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      },
    };
  }
}
