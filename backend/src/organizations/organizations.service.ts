import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActive(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!org) {
      throw new BadRequestException('Organización no encontrada');
    }

    return org;
  }

  async update(orgId: string, name: string) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { name },
    });
  }

  async getMembers(orgId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(orgId: string, email: string, role: Role) {
    let user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Crear usuario placeholder para que pueda ingresar
      const tempPass = await bcrypt.hash('QueryLensTempPass123!', 10);
      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: tempPass,
          firstName: email.split('@')[0],
        },
      });
    }

    const existingMember = await this.prisma.membership.findFirst({
      where: { userId: user.id, organizationId: orgId },
    });

    if (existingMember) {
      throw new BadRequestException(
        'El usuario ya pertenece a esta organización.',
      );
    }

    return this.prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async removeMember(
    orgId: string,
    membershipId: string,
    currentUserId: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId: orgId },
    });

    if (!membership) {
      throw new BadRequestException(
        'Miembro no encontrado en esta organización.',
      );
    }

    if (membership.role === 'owner') {
      const ownerCount = await this.prisma.membership.count({
        where: { organizationId: orgId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'No puedes eliminar al único propietario de la organización.',
        );
      }
    }

    await this.prisma.membership.delete({
      where: { id: membershipId },
    });

    return { success: true };
  }

  async createOrg(userId: string, name: string) {
    let slug = this.slugify(name);
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    return this.prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: { name, slug },
      });

      await tx.membership.create({
        data: {
          userId,
          organizationId: newOrg.id,
          role: 'owner',
        },
      });

      return newOrg;
    });
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
