import {
  Allow,
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class RunQueryDto {
  @IsUUID('4', { message: 'ID de conector inválido' })
  @IsNotEmpty({ message: 'El ID del conector es obligatorio' })
  datasourceId: string;

  @IsString()
  @IsNotEmpty({ message: 'El código SQL es obligatorio' })
  querySql: string;

  @Allow()
  @IsUUID('4', { message: 'ID de ejecución inválido' })
  @IsOptional()
  executionId?: string;
}

export class SaveQueryDto {
  @IsUUID('4', { message: 'ID de conector inválido' })
  @IsNotEmpty({ message: 'El ID del conector es obligatorio' })
  datasourceId: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'El código SQL es obligatorio' })
  querySql: string;
}
