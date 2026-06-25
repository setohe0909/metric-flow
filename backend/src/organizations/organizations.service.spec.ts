import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from './organizations.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('OrganizationsService user lifecycle', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  let service: OrganizationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizationsService(prisma);
  });

  it('creates a user with a unique temporary password and mandatory change', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('temporary-hash');
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-2',
      email: 'editor@example.com',
      firstName: 'editor',
      lastName: null,
      disabledAt: null,
      mustChangePassword: true,
    });
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.membership.create as jest.Mock).mockResolvedValue({
      id: 'membership-2',
      userId: 'user-2',
      role: 'EDITOR',
      user: { id: 'user-2', email: 'editor@example.com' },
    });

    const result = await service.inviteMember(
      'org-1',
      'EDITOR@example.com',
      'EDITOR',
    );

    expect(result.temporaryPassword).toEqual(expect.any(String));
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(16);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'editor@example.com',
        passwordHash: 'temporary-hash',
        mustChangePassword: true,
      }),
    });
  });

  it('prevents demoting the last administrator', async () => {
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
      id: 'membership-1',
      userId: 'admin-1',
      role: 'ADMIN',
    });
    (prisma.membership.count as jest.Mock).mockResolvedValue(1);

    await expect(
      service.updateMemberRole(
        'org-1',
        'membership-1',
        'admin-2',
        'EDITOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('resets a password and increments the session version', async () => {
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
      id: 'membership-2',
      userId: 'user-2',
      role: 'EDITOR',
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-temporary-hash');
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const result = await service.resetMemberPassword(
      'org-1',
      'membership-2',
      'admin-1',
    );

    expect(result.temporaryPassword).toEqual(expect.any(String));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: {
        passwordHash: 'new-temporary-hash',
        mustChangePassword: true,
        passwordVersion: { increment: 1 },
      },
    });
  });
});
