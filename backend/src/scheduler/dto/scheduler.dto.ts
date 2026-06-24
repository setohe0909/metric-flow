import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEmail,
  IsEnum,
} from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID de la consulta es obligatorio' })
  queryId: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La expresión cron es obligatoria' })
  cronExpression: string;

  @IsArray()
  @IsEmail(
    {},
    {
      each: true,
      message: 'Todos los destinatarios deben ser correos válidos',
    },
  )
  @IsNotEmpty({ message: 'Debe especificar al menos un destinatario' })
  recipients: string[];

  @IsString()
  @IsOptional()
  subject?: string;

  @IsEnum(['csv', 'html', 'json'], {
    message: 'El formato debe ser csv, html o json',
  })
  @IsOptional()
  format?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cronExpression?: string;

  @IsArray()
  @IsEmail(
    {},
    {
      each: true,
      message: 'Todos los destinatarios deben ser correos válidos',
    },
  )
  @IsOptional()
  recipients?: string[];

  @IsString()
  @IsOptional()
  subject?: string;

  @IsEnum(['csv', 'html', 'json'], {
    message: 'El formato debe ser csv, html o json',
  })
  @IsOptional()
  format?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
