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

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

@Injectable()
export class QueryEngineService implements OnModuleDestroy {
  // Caché de pools de conexión en memoria para PostgreSQL y MySQL
  private pgPools = new Map<string, pg.Pool>();
  private mysqlPools = new Map<string, mysql.Pool>();

  async onModuleDestroy() {
    // Cerrar todos los pools al apagar el módulo
    for (const pool of this.pgPools.values()) {
      await pool.end().catch(() => {});
    }
    for (const pool of this.mysqlPools.values()) {
      await pool.end().catch(() => {});
    }
  }

  // Método principal para ejecutar SQL libre o guardado
  async executeQuery(
    type: string,
    settings: ConnectionSettingsDto,
    sql: string,
    datasourceId?: string,
    orgId?: string,
  ): Promise<QueryResult> {
    // 1. Aplicar límites de seguridad
    const safeSql = this.applySafetyLimits(sql);

    // 2. Ejecutar según el tipo de base de datos con un timeout de 30 segundos
    return Promise.race([
      this.runRawQuery(type, settings, safeSql, datasourceId, orgId),
      this.createQueryTimeout(30000),
    ]) as Promise<QueryResult>;
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
  ): Promise<QueryResult> {
    switch (type) {
      case 'postgres':
        return this.runPostgresQuery(settings, sql, datasourceId);
      case 'mysql':
        return this.runMysqlQuery(settings, sql, datasourceId);
      case 'sqlite':
      case 'csv':
        // Tanto SQLite como CSV (que se importa como SQLite) corren sobre SQLite
        return this.runSqliteQuery(settings, sql, orgId);
      case 'bigquery':
        return this.runBigQueryQuery(settings, sql);
      case 'snowflake':
        return this.runSnowflakeQuery(settings, sql);
      default:
        throw new BadRequestException('Tipo de base de datos no soportado');
    }
  }

  // --- POSTGRES ENGINE ---
  private async runPostgresQuery(
    settings: ConnectionSettingsDto,
    sql: string,
    datasourceId?: string,
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
    try {
      client = await pool.connect();
      const res = await client.query({ text: sql, rowMode: 'array' });

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

    try {
      const [rows, fields] = await pool.query(sql);
      const columns = fields ? fields.map((f) => f.name) : [];

      return {
        columns,
        rows: Array.isArray(rows) ? (rows as any[]) : [],
        rowCount: Array.isArray(rows) ? (rows as any[]).length : 0,
      };
    } catch (error) {
      throw new BadRequestException(`MySQL Error: ${error.message}`);
    } finally {
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
      throw new BadRequestException(
        'serviceAccountJson no es un JSON válido.',
      );
    }

    const bq = new BigQuery({ projectId: settings.projectId, credentials });

    try {
      const [job] = await bq.createQueryJob({ query: sql, useLegacySql: false });
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
            new BadRequestException(`Snowflake Connection Error: ${err.message}`),
          );
        }

        conn.execute({
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
                new BadRequestException(`Snowflake SQL Error: ${execErr.message}`),
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
      });
    });
  }

  // --- UTILS & SAFETY ---

  private applySafetyLimits(sql: string): string {
    const trimmedSql = sql.trim();
    // Expresión regular para buscar SELECT
    const isSelect = /^select\s/i.test(trimmedSql);

    if (isSelect) {
      // Verificar si ya tiene LIMIT o TOP
      const hasLimit = /\slimit\s+\d+/i.test(trimmedSql);
      if (!hasLimit) {
        // Remover punto y coma al final si existe
        const sqlWithoutSemicolon = trimmedSql.replace(/;$/, '');
        return `${sqlWithoutSemicolon} LIMIT 1000;`;
      }
    }
    return sql;
  }

  private createQueryTimeout(ms: number) {
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new InternalServerErrorException(
              'Query Timeout: La consulta superó el límite de 30 segundos.',
            ),
          ),
        ms,
      ),
    );
  }
}
