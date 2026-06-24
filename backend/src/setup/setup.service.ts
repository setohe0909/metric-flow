import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapDto } from './dto/bootstrap.dto';

@Injectable()
export class SetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async status() {
    const installation = await this.prisma.installation.findUnique({
      where: { id: 1 },
      select: { id: true },
    });

    return { initialized: Boolean(installation) };
  }

  async bootstrap(dto: BootstrapDto) {
    const existingInstallation = await this.prisma.installation.findUnique({
      where: { id: 1 },
      select: { id: true },
    });
    if (existingInstallation) {
      throw new ConflictException('La instalación ya fue configurada.');
    }

    const email = dto.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const slug = this.slugify(dto.organizationName);

    try {
      const { user, organization } = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
            },
          });

          const organization = await tx.organization.create({
            data: {
              name: dto.organizationName.trim(),
              slug,
            },
          });

          await tx.membership.create({
            data: {
              userId: user.id,
              organizationId: organization.id,
              role: 'owner',
            },
          });

          await tx.installation.create({
            data: {
              id: 1,
              organizationId: organization.id,
              administratorUserId: user.id,
            },
          });

          return { user, organization };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        activeOrgId: organization.id,
        role: 'owner',
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          role: 'owner',
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      ) {
        throw new ConflictException('La instalación ya fue configurada.');
      }
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const errorCode = String((error as Record<string, unknown>).code);
        if (['P2002', 'P2034'].includes(errorCode)) {
          throw new ConflictException('La instalación ya fue configurada.');
        }
      }
      throw error;
    }
  }

  private slugify(text: string): string {
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    return slug || 'organization';
  }
}
