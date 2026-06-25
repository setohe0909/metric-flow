import { IsBoolean, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDashboardDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del dashboard es obligatorio' })
  name: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional()
  description?: string;
}

export class UpdateDashboardDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional()
  description?: string;
}

export class SetDashboardPublishedDto {
  @IsBoolean({ message: 'El estado de publicación debe ser booleano' })
  published: boolean;
}
