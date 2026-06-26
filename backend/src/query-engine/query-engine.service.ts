import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConnectionSettingsDto } from '../datasource/dto/datasource.dto';
import * as pg from 'pg';
import * as mysql from 'mysql2/promise';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { BigQuery } from '@google-cloud/bigquery';
import * as snowflake from 'snowflake-sdk';
import * as mssql from 'mssql';
import { SqlReadOnlyPolicy } from './sql-read-only-policy';

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

interface ActiveExecution {
  organizationId?: string;
  cancel: () => Promise<void> | void;
  cancelRequested: boolean;
  cancelReason?: 'user' | 'timeout';
}

@Injectable()
export class QueryEngineService implements OnModuleDestroy {
  // Caché de pools de conexión en memoria para PostgreSQL y MySQL
  private pgPools = new Map<string, pg.Pool>();
  private mysqlPools = new Map<string, mysql.Pool>();
  private mssqlPools = new Map<string, mssql.ConnectionPool>();
  private activeExecutions = new Map<string, ActiveExecution>();

  constructor(private readonly sqlReadOnlyPolicy: SqlReadOnlyPolicy) {}

  async onModuleDestroy() {
    // Cerrar todos los pools al apagar el módulo
    for (const pool of this.pgPools.values()) {
      await pool.end().catch(() => {});
    }
    for (const pool of this.mysqlPools.values()) {
      await pool.end().catch(() => {});
    }
    for (const pool of this.mssqlPools.values()) {
      await pool.close().catch(() => {});
    }
  }

  // Método principal para ejecutar SQL libre o guardado
  async executeQuery(
    type: string,
    settings: ConnectionSettingsDto,
    sql: string,
    datasourceId?: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    // 1. Validar que la consulta sea de solo lectura y aplicar límites.
    const safeSql = this.sqlReadOnlyPolicy.prepare(type, sql);

    // 2. Ejecutar según el tipo de base de datos con un timeout de 30 segundos
    try {
      return await this.withQueryTimeout(
        this.runRawQuery(
          type,
          settings,
          safeSql,
          datasourceId,
          orgId,
          executionId,
        ),
        30000,
        orgId,
        executionId,
      );
    } catch (error) {
      if (
        executionId &&
        this.activeExecutions.get(executionId)?.cancelReason === 'user'
      ) {
        throw new BadRequestException('La consulta fue cancelada.');
      }
      throw error;
    } finally {
      if (executionId) {
        this.activeExecutions.delete(executionId);
      }
    }
  }

  // Método para probar la conexión
  async testConnection(
    type: string,
    settings: ConnectionSettingsDto,
    orgId?: string,
  ): Promise<boolean> {
    const testSql = 'SELECT 1 as test_val;';
    try {
      const result = await this.executeQuery(
        type,
        settings,
        testSql,
        undefined,
        orgId,
      );
      return result.rows.length > 0;
    } catch (error) {
      throw new BadRequestException(`Conexión fallida: ${error.message}`);
    }
  }

  async getDbSchema(
    type: string,
    settings: ConnectionSettingsDto,
    orgId?: string,
  ) {
    if (type === 'postgres') {
      const sql = `
        SELECT 
          table_name as "tableName", 
          column_name as "columnName" 
        FROM 
          information_schema.columns 
        WHERE 
          table_schema = 'public'
        ORDER BY 
          table_name, ordinal_position;
      `;
      const result = await this.runRawQuery(type, settings, sql);
      return this.formatSchemaResult(result.rows);
    } else if (type === 'mysql') {
      const sql = `
        SELECT 
          table_name as tableName, 
          column_name as columnName 
        FROM 
          information_schema.columns 
        WHERE 
          table_schema = database()
        ORDER BY 
          table_name, ordinal_position;
      `;
      const result = await this.runRawQuery(type, settings, sql);
      return this.formatSchemaResult(result.rows);
    } else if (type === 'sqlserver') {
      const sql = `
        SELECT
          TABLE_NAME as tableName,
          COLUMN_NAME as columnName
        FROM
          INFORMATION_SCHEMA.COLUMNS
        ORDER BY
          TABLE_SCHEMA,
          TABLE_NAME,
          ORDINAL_POSITION;
      `;
      const result = await this.runRawQuery(type, settings, sql);
      return this.formatSchemaResult(result.rows);
    } else if (type === 'sqlite' || type === 'csv') {
      // 1. Obtener todas las tablas
      const sqlTables = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`;
      const tablesResult = await this.runRawQuery(
        type,
        settings,
        sqlTables,
        undefined,
        orgId,
      );

      const schema: Array<{ table: string; columns: string[] }> = [];

      // 2. Obtener columnas para cada tabla
      for (const row of tablesResult.rows) {
        // row.name o row.name (sqlite_master retorna name)
        const tableName = row.name;
        const columnsResult = await this.runRawQuery(
          type,
          settings,
          `PRAGMA table_info("${tableName}");`,
          undefined,
          orgId,
        );
        const columns = columnsResult.rows.map((col: any) => col.name);
        schema.push({ table: tableName, columns });
      }

      return schema;
    } else if (type === 'bigquery') {
      const sql = `
        SELECT table_name AS tableName, column_name AS columnName
        FROM \`${settings.projectId}.${settings.database}.INFORMATION_SCHEMA.COLUMNS\`
        ORDER BY table_name, ordinal_position;
      `;
      try {
        const result = await this.runBigQueryQuery(settings, sql);
        return this.formatSchemaResult(result.rows);
      } catch {
        return [];
      }
    } else if (type === 'snowflake') {
      const sql = `
        SELECT TABLE_NAME AS "tableName", COLUMN_NAME AS "columnName"
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${(settings.schema ?? 'PUBLIC').toUpperCase()}'
        ORDER BY TABLE_NAME, ORDINAL_POSITION;
      `;
      try {
        const result = await this.runSnowflakeQuery(settings, sql);
        return this.formatSchemaResult(result.rows);
      } catch {
        return [];
      }
    }
    return [];
  }

  private formatSchemaResult(
    rows: any[],
  ): Array<{ table: string; columns: string[] }> {
    const map = new Map<string, string[]>();
    for (const row of rows) {
      const table = row.tableName || row.table_name || '';
      const column = row.columnName || row.column_name || '';
      if (!table) continue;

      if (!map.has(table)) {
        map.set(table, []);
      }
      map.get(table)!.push(column);
    }

    return Array.from(map.entries()).map(([table, columns]) => ({
      table,
      columns,
    }));
  }

  private async runRawQuery(
    type: string,
    settings: ConnectionSettingsDto,
    sql: string,
    datasourceId?: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    switch (type) {
      case 'postgres':
        return this.runPostgresQuery(
          settings,
          sql,
          datasourceId,
          orgId,
          executionId,
        );
      case 'mysql':
        return this.runMysqlQuery(
          settings,
          sql,
          datasourceId,
          orgId,
          executionId,
        );
      case 'sqlserver':
        return this.runSqlServerQuery(
          settings,
          sql,
          datasourceId,
          orgId,
          executionId,
        );
      case 'sqlite':
      case 'csv':
        // Tanto SQLite como CSV (que se importa como SQLite) corren sobre SQLite
        return this.runSqliteQuery(settings, sql, orgId, executionId);
      case 'bigquery':
        return this.runBigQueryQuery(settings, sql, orgId, executionId);
      case 'snowflake':
        return this.runSnowflakeQuery(settings, sql, orgId, executionId);
      default:
        throw new BadRequestException('Tipo de base de datos no soportado');
    }
  }

  // --- SQL SERVER ENGINE ---
  private async runSqlServerQuery(
    settings: ConnectionSettingsDto,
    sql: string,
    datasourceId?: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    let pool: mssql.ConnectionPool;

    if (datasourceId && this.mssqlPools.has(datasourceId)) {
      pool = this.mssqlPools.get(datasourceId)!;
    } else {
      pool = new mssql.ConnectionPool({
        server: settings.host ?? '',
        port: settings.port || 1433,
        user: settings.username,
        password: settings.password,
        database: settings.database,
        options: {
          encrypt: settings.ssl ?? false,
          trustServerCertificate: !settings.ssl,
          enableArithAbort: true,
        },
        pool: {
          max: 5,
          min: 0,
          idleTimeoutMillis: 30000,
        },
        connectionTimeout: 5000,
      });

      await pool.connect();

      if (datasourceId) {
        this.mssqlPools.set(datasourceId, pool);
      }
    }

    const transaction = new mssql.Transaction(pool);
    let transactionStarted = false;

    try {
      await transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED);
      transactionStarted = true;

      const request = new mssql.Request(transaction);
      if (executionId) {
        this.activeExecutions.set(executionId, {
          organizationId: orgId,
          cancelRequested: false,
          cancel: () => request.cancel(),
        });
      }

      const result = await request.query(sql);
      await transaction.rollback();
      transactionStarted = false;

      const rows = result.recordset ?? [];
      const columns =
        rows.length > 0
          ? Object.keys(rows[0] as Record<string, unknown>)
          : Object.keys(result.recordset?.columns ?? {});

      return {
        columns,
        rows,
        rowCount: rows.length,
      };
    } catch (error) {
      if (transactionStarted) {
        await transaction.rollback().catch(() => {});
      }

      throw new BadRequestException(`SQL Server Error: ${error.message}`);
    } finally {
      if (!datasourceId) {
        await pool.close().catch(() => {});
      }
    }
  }

  // --- POSTGRES ENGINE ---
  private async runPostgresQuery(
    settings: ConnectionSettingsDto,
    sql: string,
    datasourceId?: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    let pool: pg.Pool;

    if (datasourceId && this.pgPools.has(datasourceId)) {
      pool = this.pgPools.get(datasourceId)!;
    } else {
      pool = new pg.Pool({
        host: settings.host,
        port: settings.port || 5432,
        user: settings.username,
        password: settings.password,
        database: settings.database,
        ssl: settings.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
        max: 5, // Límite de conexiones por pool de cliente
      });

      if (datasourceId) {
        this.pgPools.set(datasourceId, pool);
      }
    }

    let client: pg.PoolClient | null = null;
    let transactionStarted = false;
    try {
      client = await pool.connect();
      if (executionId) {
        this.activeExecutions.set(executionId, {
          organizationId: orgId,
          cancelRequested: false,
          cancel: () => {
            client?.release(new Error('Query cancelled'));
          },
        });
      }
      await client.query('BEGIN READ ONLY');
      transactionStarted = true;
      const res = await client.query({ text: sql, rowMode: 'array' });
      await client.query('COMMIT');
      transactionStarted = false;

      const columns = res.fields.map((f) => f.name);

      // Transformar filas de array a objeto JSON key-value
      const rows = res.rows.map((row) => {
        const rowObj: Record<string, any> = {};
        columns.forEach((col, idx) => {
          rowObj[col] = row[idx];
        });
        return rowObj;
      });

      return {
        columns,
        rows,
        rowCount: rows.length,
      };
    } catch (error) {
      if (client && transactionStarted) {
        await client.query('ROLLBACK').catch(() => {});
      }
      throw new BadRequestException(`PostgreSQL Error: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
      // Si no hay id de origen de datos, cerramos el pool de inmediato (ej: test connection)
      if (!datasourceId) {
        await pool.end().catch(() => {});
      }
    }
  }

  // --- MYSQL ENGINE ---
  private async runMysqlQuery(
    settings: ConnectionSettingsDto,
    sql: string,
    datasourceId?: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    let pool: mysql.Pool;

    if (datasourceId && this.mysqlPools.has(datasourceId)) {
      pool = this.mysqlPools.get(datasourceId)!;
    } else {
      pool = mysql.createPool({
        host: settings.host,
        port: settings.port || 3306,
        user: settings.username,
        password: settings.password,
        database: settings.database,
        ssl: settings.ssl ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
      });

      if (datasourceId) {
        this.mysqlPools.set(datasourceId, pool);
      }
    }

    let connection: mysql.PoolConnection | null = null;
    let transactionStarted = false;
    try {
      connection = await pool.getConnection();
      if (executionId) {
        this.activeExecutions.set(executionId, {
          organizationId: orgId,
          cancelRequested: false,
          cancel: () => {
            connection?.destroy();
          },
        });
      }
      await connection.query('START TRANSACTION READ ONLY');
      transactionStarted = true;
      const [rows, fields] = await connection.query(sql);
      await connection.query('COMMIT');
      transactionStarted = false;
      const columns = fields ? fields.map((f) => f.name) : [];

      return {
        columns,
        rows: Array.isArray(rows) ? (rows as any[]) : [],
        rowCount: Array.isArray(rows) ? (rows as any[]).length : 0,
      };
    } catch (error) {
      if (connection && transactionStarted) {
        await connection.query('ROLLBACK').catch(() => {});
      }
      throw new BadRequestException(`MySQL Error: ${error.message}`);
    } finally {
      connection?.release();
      if (!datasourceId) {
        await pool.end().catch(() => {});
      }
    }
  }

  // --- SQLITE / CSV ENGINE ---
  private async runSqliteQuery(
    settings: ConnectionSettingsDto,
    sql: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    if (!orgId) {
      throw new BadRequestException(
        'Se requiere el contexto de la organización para consultar SQLite/CSV',
      );
    }

    if (!settings.filePath) {
      throw new BadRequestException(
        'No se especificó la ruta del archivo SQLite/CSV',
      );
    }

    // Resolver ruta absoluta en storage/org_<id>/filename
    const storageDir = path.resolve(
      __dirname,
      '../../..',
      'storage',
      `org_${orgId}`,
    );
    const absolutePath = path.resolve(storageDir, settings.filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new BadRequestException(
        'El archivo de base de datos no existe en el servidor',
      );
    }

    return new Promise((resolve, reject) => {
      // Abrir en modo lectura únicamente para evitar inyecciones destructivas
      const db = new sqlite3.Database(
        absolutePath,
        sqlite3.OPEN_READONLY,
        (err) => {
          if (err) {
            return reject(
              new BadRequestException(
                `SQLite Connection Error: ${err.message}`,
              ),
            );
          }
        },
      );

      if (executionId) {
        this.activeExecutions.set(executionId, {
          organizationId: orgId,
          cancelRequested: false,
          cancel: () => db.interrupt(),
        });
      }

      db.all(sql, [], (err, rows: any[]) => {
        if (err) {
          db.close();
          return reject(
            new BadRequestException(`SQLite SQL Error: ${err.message}`),
          );
        }

        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        db.close();
        resolve({
          columns,
          rows,
          rowCount: rows.length,
        });
      });
    });
  }

  // --- BIGQUERY ENGINE ---
  private async runBigQueryQuery(
    settings: ConnectionSettingsDto,
    sql: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    if (!settings.projectId || !settings.serviceAccountJson) {
      throw new BadRequestException(
        'BigQuery requiere projectId y serviceAccountJson.',
      );
    }

    let credentials: Record<string, any>;
    try {
      credentials = JSON.parse(settings.serviceAccountJson);
    } catch {
      throw new BadRequestException('serviceAccountJson no es un JSON válido.');
    }

    const bq = new BigQuery({ projectId: settings.projectId, credentials });

    try {
      const [job] = await bq.createQueryJob({
        query: sql,
        useLegacySql: false,
      });
      if (executionId) {
        this.activeExecutions.set(executionId, {
          organizationId: orgId,
          cancelRequested: false,
          cancel: async () => {
            await job.cancel();
          },
        });
      }
      const [rows] = await job.getQueryResults();

      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        columns,
        rows,
        rowCount: rows.length,
      };
    } catch (error) {
      throw new BadRequestException(`BigQuery Error: ${error.message}`);
    }
  }

  // --- SNOWFLAKE ENGINE ---
  private async runSnowflakeQuery(
    settings: ConnectionSettingsDto,
    sql: string,
    orgId?: string,
    executionId?: string,
  ): Promise<QueryResult> {
    if (!settings.account || !settings.username || !settings.password) {
      throw new BadRequestException(
        'Snowflake requiere account, username y password.',
      );
    }

    return new Promise((resolve, reject) => {
      const connection = snowflake.createConnection({
        account: settings.account!,
        username: settings.username!,
        password: settings.password!,
        database: settings.database,
        warehouse: settings.warehouse,
        schema: settings.schema ?? 'PUBLIC',
      });

      connection.connect((err, conn) => {
        if (err) {
          return reject(
            new BadRequestException(
              `Snowflake Connection Error: ${err.message}`,
            ),
          );
        }

        const statement = conn.execute({
          sqlText: sql,
          complete: (execErr, _stmt, rows) => {
            // Destroy the connection regardless of outcome
            conn.destroy((destroyErr) => {
              if (destroyErr) {
                console.error('Snowflake destroy error:', destroyErr);
              }
            });

            if (execErr) {
              return reject(
                new BadRequestException(
                  `Snowflake SQL Error: ${execErr.message}`,
                ),
              );
            }

            const safeRows = rows ?? [];
            const columns = safeRows.length > 0 ? Object.keys(safeRows[0]) : [];

            resolve({
              columns,
              rows: safeRows,
              rowCount: safeRows.length,
            });
          },
        });

        if (executionId) {
          this.activeExecutions.set(executionId, {
            organizationId: orgId,
            cancelRequested: false,
            cancel: () =>
              new Promise<void>((resolveCancel) => {
                statement.cancel(() => resolveCancel());
              }),
          });
        }
      });
    });
  }

  // --- UTILS & SAFETY ---

  private async withQueryTimeout<T>(
    operation: Promise<T>,
    ms: number,
    orgId?: string,
    executionId?: string,
  ): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          timeout = setTimeout(async () => {
            if (orgId && executionId) {
              await this.cancelExecution(orgId, executionId, 'timeout').catch(
                () => {},
              );
            }
            reject(
              new InternalServerErrorException(
                'Query Timeout: La consulta superó el límite de 30 segundos.',
              ),
            );
          }, ms);
        }),
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  async cancelExecution(
    orgId: string,
    executionId: string,
    reason: 'user' | 'timeout' = 'user',
  ) {
    const active = this.activeExecutions.get(executionId);

    if (!active || active.organizationId !== orgId) {
      throw new BadRequestException('No hay una consulta activa con ese ID.');
    }

    if (!active.cancelRequested) {
      active.cancelRequested = true;
      active.cancelReason = reason;
      await Promise.resolve(active.cancel());
    }

    return {
      executionId,
      status: 'cancel-requested' as const,
    };
  }
}
