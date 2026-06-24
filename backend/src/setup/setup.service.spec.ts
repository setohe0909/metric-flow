import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SetupService } from './setup.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('SetupService', () => {
  const transactionClient = {
    user: { create: jest.fn() },
    organization: { create: jest.fn() },
    membership: { create: jest.fn() },
    installation: { create: jest.fn() },
  };

  const prisma = {
    installation: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const jwtService = {
    sign: jest.fn(),
  } as unknown as JwtService;

  let service: SetupService;

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.installation.findUnique as jest.Mock).mockResolvedValue(null);
    service = new SetupService(prisma, jwtService);
  });

  it('reports an uninitialized installation when the singleton is absent', async () => {
    (prisma.installation.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.status()).resolves.toEqual({ initialized: false });
  });

  it('reports an initialized installation when the singleton exists', async () => {
    (prisma.installation.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

    await expect(service.status()).resolves.toEqual({ initialized: true });
  });

  it('creates the first owner and organization atomically', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('password-hash');
    transactionClient.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    transactionClient.organization.create.mockResolvedValue({
      id: 'org-1',
      name: 'Analytics Team',
      slug: 'analytics-team',
    });
    (prisma.$transaction as jest.Mock).mockImplementation(
      (callback: (tx: typeof transactionClient) => unknown) =>
        Promise.resolve(callback(transactionClient)),
    );
    (jwtService.sign as jest.Mock).mockReturnValue('signed-token');

    await expect(
      service.bootstrap({
        email: ' ADMIN@Example.com ',
        password: 'safe-password',
        firstName: 'Ada',
        lastName: 'Lovelace',
        organizationName: 'Analytics Team',
      }),
    ).resolves.toEqual({
      token: 'signed-token',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
      organization: {
        id: 'org-1',
        name: 'Analytics Team',
        slug: 'analytics-team',
        role: 'owner',
      },
    });

    expect(transactionClient.installation.create).toHaveBeenCalledWith({
      data: {
        id: 1,
        organizationId: 'org-1',
        administratorUserId: 'user-1',
      },
    });
  });

  it('maps the singleton conflict to an already initialized response', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('password-hash');
    (prisma.$transaction as jest.Mock).mockRejectedValue({ code: 'P2002' });

    await expect(
      service.bootstrap({
        email: 'admin@example.com',
        password: 'safe-password',
        firstName: 'Ada',
        lastName: 'Lovelace',
        organizationName: 'Analytics Team',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
