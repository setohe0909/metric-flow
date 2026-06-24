import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectionSettingsDto {
  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsInt()
  port?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  database?: string;

  @IsOptional()
  @IsBoolean()
  ssl?: boolean;

  @IsOptional()
  @IsString()
  filePath?: string; // Para SQLite y CSV

  // --- BigQuery ---
  @IsOptional()
  @IsString()
  projectId?: string; // GCP project ID

  @IsOptional()
  @IsString()
  serviceAccountJson?: string; // JSON serializado de la service account key

  // --- Snowflake ---
  @IsOptional()
  @IsString()
  account?: string; // ej. "myorg-myaccount"

  @IsOptional()
  @IsString()
  warehouse?: string; // ej. "COMPUTE_WH"

  @IsOptional()
  @IsString()
  schema?: string; // ej. "PUBLIC"
}

export class CreateDatasourceDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsEnum(['postgres', 'mysql', 'sqlite', 'csv', 'bigquery', 'snowflake'], {
    message: 'Tipo de base de datos no soportado',
  })
  type: string;

  @IsObject()
  @IsNotEmpty({ message: 'Los ajustes de conexión son obligatorios' })
  @ValidateNested()
  @Type(() => ConnectionSettingsDto)
  connectionSettings: ConnectionSettingsDto;
}

/** Política de acceso para un rol específico (admin o viewer) */
export class RolePolicyDto {
  /**
   * Lista de columnas permitidas para este rol.
   * null o ausente = sin restricción de columnas.
   */
  @IsOptional()
  @ValidateIf((o) => o.allowedColumns !== null)
  @IsArray()
  @IsString({ each: true })
  allowedColumns?: string[] | null;

  /**
   * Cláusula WHERE SQL inyectada como sub-query wrapper antes de ejecutar.
   * Ej: "region = 'LATAM'" o "deleted_at IS NULL".
   * null o ausente = sin restricción de filas.
   */
  @IsOptional()
  @ValidateIf((o) => o.rowFilter !== null)
  @IsString()
  rowFilter?: string | null;
}

/** DTO para PUT /datasources/:id/policies */
export class UpdateAccessPoliciesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => RolePolicyDto)
  viewer?: RolePolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RolePolicyDto)
  admin?: RolePolicyDto;
}
