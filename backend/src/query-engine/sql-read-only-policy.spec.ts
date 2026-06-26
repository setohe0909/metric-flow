import { BadRequestException } from '@nestjs/common';
import { SqlReadOnlyPolicy } from './sql-read-only-policy';

describe('SqlReadOnlyPolicy', () => {
  let policy: SqlReadOnlyPolicy;

  beforeEach(() => {
    policy = new SqlReadOnlyPolicy();
  });

  it.each([
    ['postgres', 'SELECT * FROM users LIMIT 1000;'],
    ['mysql', 'SELECT * FROM users LIMIT 1000;'],
    ['sqlserver', 'SELECT TOP 1000 * FROM [users];'],
  ])(
    'accepts a single SELECT for %s and applies a row limit',
    (dialect, expectedSql) => {
      expect(policy.prepare(dialect, 'SELECT * FROM users')).toBe(expectedSql);
    },
  );

  it.each(['sqlite', 'csv'])(
    'accepts a single SELECT for the read-only %s engine',
    (dialect) => {
      expect(policy.prepare(dialect, 'SELECT * FROM matches')).toBe(
        'SELECT * FROM matches LIMIT 1000;',
      );
    },
  );

  it('accepts a SQLite SELECT preceded by the editor placeholder comment', () => {
    expect(
      policy.prepare(
        'sqlite',
        '-- Escribe tu consulta SQL aquí\nSELECT * FROM matches;',
      ),
    ).toBe(
      '-- Escribe tu consulta SQL aquí\nSELECT * FROM matches LIMIT 1000;',
    );
  });

  it.each(['sqlite', 'csv'])(
    'rejects writes for the read-only %s engine',
    (dialect) => {
      expect(() => policy.prepare(dialect, 'DELETE FROM matches')).toThrow(
        'Solo se permiten consultas SQL de lectura.',
      );
    },
  );

  it('accepts a read-only PostgreSQL CTE', () => {
    const sql =
      'WITH active AS (SELECT * FROM users) SELECT * FROM active LIMIT 25';

    expect(policy.prepare('postgres', sql)).toBe(sql);
  });

  it('preserves an explicit TOP clause for SQL Server', () => {
    const sql = 'SELECT TOP 25 id, email FROM users ORDER BY created_at DESC';

    expect(policy.prepare('sqlserver', sql)).toBe(sql);
  });

  it.each([
    'UPDATE users SET active = true',
    'DELETE FROM users',
    'DROP TABLE users',
  ])('rejects a non-read-only statement: %s', (sql) => {
    expect(() => policy.prepare('postgres', sql)).toThrow(
      new BadRequestException('Solo se permiten consultas SQL de lectura.'),
    );
  });

  it('rejects multiple statements', () => {
    expect(() =>
      policy.prepare('mysql', 'SELECT * FROM users; DELETE FROM users'),
    ).toThrow('Solo se permite una sentencia SQL de lectura.');
  });

  it('rejects a write hidden inside a PostgreSQL CTE', () => {
    const sql =
      'WITH changed AS (UPDATE users SET active = true RETURNING *) SELECT * FROM changed';

    expect(() => policy.prepare('postgres', sql)).toThrow(
      'Solo se permiten consultas SQL de lectura.',
    );
  });

  it('rejects SELECT INTO', () => {
    expect(() =>
      policy.prepare('postgres', 'SELECT * INTO copied_users FROM users'),
    ).toThrow('Solo se permiten consultas SQL de lectura.');
  });

  it('fails closed when the parser cannot classify the SQL', () => {
    expect(() =>
      policy.prepare('postgres', 'SELECT * FROM users FOR UPDATE'),
    ).toThrow('No fue posible validar la consulta SQL de forma segura.');
  });

  it('rejects unsupported datasource dialects', () => {
    expect(() => policy.prepare('bigquery', 'SELECT * FROM users')).toThrow(
      'El tipo de origen de datos no admite ejecución SQL segura.',
    );
  });
});
