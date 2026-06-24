import { BadRequestException, Injectable } from '@nestjs/common';
import { Parser } from 'node-sql-parser';

type SqlAst = {
  type?: string;
  limit?: {
    value?: unknown[];
  } | null;
  into?: {
    position?: string | null;
  } | null;
  locking_read?: unknown;
  [key: string]: unknown;
};

const DIALECTS: Record<string, string> = {
  postgres: 'Postgresql',
  mysql: 'MySQL',
};

const FORBIDDEN_STATEMENT_TYPES = new Set([
  'alter',
  'call',
  'commit',
  'create',
  'delete',
  'drop',
  'grant',
  'insert',
  'merge',
  'rename',
  'replace',
  'revoke',
  'rollback',
  'set',
  'transaction',
  'truncate',
  'update',
  'use',
]);

@Injectable()
export class SqlReadOnlyPolicy {
  private readonly parser = new Parser();

  prepare(datasourceType: string, sql: string): string {
    const database = DIALECTS[datasourceType];
    if (!database) {
      throw new BadRequestException(
        'Solo PostgreSQL y MySQL están habilitados para ejecutar consultas.',
      );
    }

    let ast: SqlAst | SqlAst[];
    try {
      ast = this.parser.astify(sql, { database }) as unknown as
        | SqlAst
        | SqlAst[];
    } catch {
      throw new BadRequestException(
        'No fue posible validar la consulta SQL de forma segura.',
      );
    }

    if (Array.isArray(ast)) {
      throw new BadRequestException(
        'Solo se permite una sentencia SQL de lectura.',
      );
    }

    if (
      ast.type !== 'select' ||
      this.containsForbiddenStatement(ast) ||
      Boolean(ast.into?.position) ||
      Boolean(ast.locking_read)
    ) {
      throw new BadRequestException(
        'Solo se permiten consultas SQL de lectura.',
      );
    }

    if (ast.limit?.value?.length) {
      return sql;
    }

    const sqlWithoutSemicolon = sql.trim().replace(/;$/, '');
    return `${sqlWithoutSemicolon} LIMIT 1000;`;
  }

  private containsForbiddenStatement(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.some((item) => this.containsForbiddenStatement(item));
    }

    if (!value || typeof value !== 'object') {
      return false;
    }

    const node = value as Record<string, unknown>;
    if (
      typeof node.type === 'string' &&
      FORBIDDEN_STATEMENT_TYPES.has(node.type.toLowerCase())
    ) {
      return true;
    }

    return Object.values(node).some((child) =>
      this.containsForbiddenStatement(child),
    );
  }
}
