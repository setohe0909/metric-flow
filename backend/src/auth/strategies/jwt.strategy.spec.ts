import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy, type JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const payload: JwtPayload = {
    sub: 'user-1',
    email: 'user@example.com',
    activeOrgId: 'org-1',
    role: 'EDITOR',
    passwordVersion: 2,
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'jwt-secret';
    process.env.ENCRYPTION_KEY = 'encryption-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a disabled user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      disabledAt: new Date(),
      passwordVersion: 2,
    });

    await expect(new JwtStrategy(prisma).validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token issued before session revocation', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      disabledAt: null,
      mustChangePassword: false,
      passwordVersion: 3,
    });

    await expect(new JwtStrategy(prisma).validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns credential state for a current token', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      disabledAt: null,
      mustChangePassword: true,
      passwordVersion: 2,
    });

    await expect(new JwtStrategy(prisma).validate(payload)).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      activeOrgId: 'org-1',
      role: 'EDITOR',
      mustChangePassword: true,
      passwordVersion: 2,
    });
  });
});
