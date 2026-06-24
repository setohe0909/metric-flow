import { loadSecurityConfig } from './security-config';

describe('loadSecurityConfig', () => {
  it('rejects a missing JWT secret', () => {
    expect(() =>
      loadSecurityConfig({
        ENCRYPTION_KEY: 'encryption-secret',
      }),
    ).toThrow('JWT_SECRET is required');
  });

  it('rejects a missing encryption key', () => {
    expect(() =>
      loadSecurityConfig({
        JWT_SECRET: 'jwt-secret',
      }),
    ).toThrow('ENCRYPTION_KEY is required');
  });

  it('rejects blank secrets', () => {
    expect(() =>
      loadSecurityConfig({
        JWT_SECRET: '   ',
        ENCRYPTION_KEY: 'encryption-secret',
      }),
    ).toThrow('JWT_SECRET is required');
  });

  it('rejects reusing the JWT secret as the encryption key', () => {
    expect(() =>
      loadSecurityConfig({
        JWT_SECRET: 'shared-secret',
        ENCRYPTION_KEY: 'shared-secret',
      }),
    ).toThrow('JWT_SECRET and ENCRYPTION_KEY must be different');
  });

  it('returns distinct required secrets', () => {
    expect(
      loadSecurityConfig({
        JWT_SECRET: 'jwt-secret',
        ENCRYPTION_KEY: 'encryption-secret',
      }),
    ).toEqual({
      jwtSecret: 'jwt-secret',
      encryptionKey: 'encryption-secret',
    });
  });
});
