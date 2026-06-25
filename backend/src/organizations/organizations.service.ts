import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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
                disabledAt: true,
                mustChangePassword: true,
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
            disabledAt: true,
            mustChangePassword: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(orgId: string, email: string, role: Role) {
    let temporaryPassword: string | null = null;
    let user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      temporaryPassword = this.generateTemporaryPassword();
      const tempPass = await bcrypt.hash(temporaryPassword, 12);
      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: tempPass,
          firstName: email.split('@')[0],
          mustChangePassword: true,
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

    const membership = await this.prisma.membership.create({
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
            disabledAt: true,
            mustChangePassword: true,
          },
        },
      },
    });

    return {
      ...membership,
      temporaryPassword,
    };
  }

  async updateMemberRole(
    orgId: string,
    membershipId: string,
    currentUserId: string,
    role: Role,
  ) {
    const membership = await this.findMembership(orgId, membershipId);
    if (membership.userId === currentUserId && role !== 'ADMIN') {
      throw new BadRequestException('No puedes degradar tu propio rol.');
    }
    await this.assertAdminCanBeChanged(orgId, membership, role !== 'ADMIN');

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
      include: { user: true },
    });
  }

  async resetMemberPassword(
    orgId: string,
    membershipId: string,
    currentUserId: string,
  ) {
    const membership = await this.findMembership(orgId, membershipId);
    if (membership.userId === currentUserId) {
      throw new BadRequestException(
        'Usa el cambio de contraseña para tu propia cuenta.',
      );
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    await this.prisma.user.update({
      where: { id: membership.userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordVersion: { increment: 1 },
      },
    });

    return { temporaryPassword };
  }

  async setMemberDisabled(
    orgId: string,
    membershipId: string,
    currentUserId: string,
    disabled: boolean,
  ) {
    const membership = await this.findMembership(orgId, membershipId);
    if (membership.userId === currentUserId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta.');
    }
    await this.assertAdminCanBeChanged(orgId, membership, disabled);

    await this.prisma.user.update({
      where: { id: membership.userId },
      data: {
        disabledAt: disabled ? new Date() : null,
        passwordVersion: { increment: 1 },
      },
    });

    return { disabled };
  }

  async removeMember(
    orgId: string,
    membershipId: string,
    currentUserId: string,
  ) {
    const membership = await this.findMembership(orgId, membershipId);

    if (membership.userId === currentUserId) {
      throw new BadRequestException('No puedes eliminar tu propia membresía.');
    }

    await this.assertAdminCanBeChanged(orgId, membership, true);

    await this.prisma.membership.delete({
      where: { id: membershipId },
    });

    return { success: true };
  }

  private async findMembership(orgId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId: orgId },
    });
    if (!membership) {
      throw new BadRequestException(
        'Miembro no encontrado en esta organización.',
      );
    }
    return membership;
  }

  private async assertAdminCanBeChanged(
    orgId: string,
    membership: { role: Role },
    removesAdminCapability: boolean,
  ) {
    if (membership.role !== 'ADMIN' || !removesAdminCapability) {
      return;
    }
    const adminCount = await this.prisma.membership.count({
      where: {
        organizationId: orgId,
        role: 'ADMIN',
        user: { disabledAt: null },
      },
    });
    if (adminCount <= 1) {
      throw new BadRequestException(
        'Debe permanecer al menos un administrador activo.',
      );
    }
  }

  private generateTemporaryPassword(): string {
    return crypto.randomBytes(18).toString('base64url');
  }
}
