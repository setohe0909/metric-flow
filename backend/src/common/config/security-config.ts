export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
}

type SecurityEnvironment = Partial<
  Record<'JWT_SECRET' | 'ENCRYPTION_KEY', string | undefined>
>;

function requireSecret(
  environment: SecurityEnvironment,
  name: keyof SecurityEnvironment,
): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function loadSecurityConfig(
  environment: SecurityEnvironment = process.env,
): SecurityConfig {
  const jwtSecret = requireSecret(environment, 'JWT_SECRET');
  const encryptionKey = requireSecret(environment, 'ENCRYPTION_KEY');

  if (jwtSecret === encryptionKey) {
    throw new Error('JWT_SECRET and ENCRYPTION_KEY must be different');
  }

  return {
    jwtSecret,
    encryptionKey,
  };
}
