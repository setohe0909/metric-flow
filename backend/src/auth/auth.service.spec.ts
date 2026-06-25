import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService credential lifecycle', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;
  const jwtService = {
    sign: jest.fn(),
  } as unknown as JwtService;
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwtService);
  });

  it('rejects login for disabled users before comparing passwords', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      disabledAt: new Date(),
    });

    await expect(
      service.login({ email: 'USER@example.com', password: 'secret' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('changes the password and revokes existing sessions', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'old-hash',
      passwordVersion: 2,
      disabledAt: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordVersion: 3,
      mustChangePassword: false,
    });
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
      role: 'EDITOR',
      organization: {
        id: 'org-1',
        name: 'Analytics',
        slug: 'analytics',
      },
    });
    (jwtService.sign as jest.Mock).mockReturnValue('new-token');

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      }),
    ).resolves.toMatchObject({
      token: 'new-token',
      mustChangePassword: false,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: 'new-hash',
        mustChangePassword: false,
        passwordVersion: { increment: 1 },
      },
    });
  });
});
