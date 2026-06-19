import { IsString, IsEnum, IsNotEmpty, IsObject, IsOptional, ValidateNested, IsInt, IsBoolean } from 'class-validator';
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
}

export class CreateDatasourceDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsEnum(['postgres', 'mysql', 'sqlite', 'csv'], { message: 'Tipo de base de datos no soportado' })
  type: string;

  @IsObject()
  @IsNotEmpty({ message: 'Los ajustes de conexión son obligatorios' })
  @ValidateNested()
  @Type(() => ConnectionSettingsDto)
  connectionSettings: ConnectionSettingsDto;
}
