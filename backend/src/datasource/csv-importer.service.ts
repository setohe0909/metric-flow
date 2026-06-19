import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse';
import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CsvImporterService {
  
  async importCsvToSqlite(
    csvFilePath: string,
    tableName: string,
    sqliteDbPath: string
  ): Promise<{ rowCount: number; columns: string[] }> {
    return new Promise((resolve, reject) => {
      const records: any[][] = [];
      
      // Parsear archivo CSV
      fs.createReadStream(csvFilePath)
        .pipe(
          parse({
            delimiter: ',',
            skip_empty_lines: true,
          })
        )
        .on('data', (row) => {
          records.push(row);
        })
        .on('error', (error) => {
          reject(new BadRequestException(`Fallo al parsear el archivo CSV: ${error.message}`));
        })
        .on('end', async () => {
          if (records.length === 0) {
            return reject(new BadRequestException('El archivo CSV está vacío'));
          }

          // Extraer cabeceras (primera fila) y filas
          const rawHeaders = records[0];
          const rows = records.slice(1);

          // Sanitizar nombres de columnas para que sean válidos en SQL
          const columns = rawHeaders.map((header) =>
            header
              .toString()
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/(^_|_$)+/g, '')
          );

          // Asegurar que no existan duplicados en cabeceras
          const seen = new Set<string>();
          const sanitizedColumns = columns.map((col, idx) => {
            let name = col || `column_${idx + 1}`;
            let count = 1;
            while (seen.has(name)) {
              name = `${col}_${count}`;
              count++;
            }
            seen.add(name);
            return name;
          });

          // Abrir base de datos SQLite de destino
          const db = new sqlite3.Database(sqliteDbPath, (err) => {
            if (err) {
              return reject(new BadRequestException(`Error al abrir base de datos SQLite: ${err.message}`));
            }
          });

          try {
            // Eliminar tabla anterior si existe para sobreescribir los datos
            db.serialize(() => {
              db.run(`DROP TABLE IF EXISTS ${tableName};`);
              
              // Crear tabla dinámica con todas las columnas de tipo TEXT
              const columnsDdl = sanitizedColumns.map((col) => `"${col}" TEXT`).join(', ');
              db.run(`CREATE TABLE ${tableName} (${columnsDdl});`);

              // Preparar inserción masiva
              const placeholders = sanitizedColumns.map(() => '?').join(', ');
              const insertSql = `INSERT INTO ${tableName} (${sanitizedColumns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders});`;
              const stmt = db.prepare(insertSql);

              // Insertar filas en bloque
              for (const row of rows) {
                // Rellenar con nulos si faltan columnas en alguna fila del CSV
                const paddedRow = sanitizedColumns.map((_, idx) => (row[idx] !== undefined ? row[idx] : null));
                stmt.run(paddedRow);
              }

              stmt.finalize((finalizeErr) => {
                db.close();
                if (finalizeErr) {
                  reject(new BadRequestException(`Fallo al insertar registros del CSV: ${finalizeErr.message}`));
                } else {
                  resolve({
                    rowCount: rows.length,
                    columns: sanitizedColumns,
                  });
                }
              });
            });
          } catch (error: any) {
            db.close();
            reject(new BadRequestException(`Fallo en la importación SQL: ${error.message}`));
          }
        });
    });
  }
}
