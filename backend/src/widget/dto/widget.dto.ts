import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';

export class CreateWidgetDto {
  @IsUUID('4', { message: 'El ID del dashboard debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del dashboard es obligatorio' })
  dashboardId: string;

  @IsUUID('4', { message: 'El ID de la consulta debe ser un UUID válido' })
  @IsOptional()
  queryId?: string;

  @IsUUID('4', { message: 'El ID de la página debe ser un UUID válido' })
  @IsOptional()
  pageId?: string;

  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título del widget es obligatorio' })
  title: string;

  @IsString({ message: 'El tipo debe ser un texto' })
  @IsNotEmpty({ message: 'El tipo de widget es obligatorio' })
  type: string; // table, bar, line, kpi, pie

  @IsObject({ message: 'La configuración del gráfico debe ser un objeto' })
  @IsNotEmpty({ message: 'La configuración del gráfico es obligatoria' })
  chartConfig: Record<string, any>;

  @IsInt({ message: 'La versión de configuración debe ser un entero' })
  @Min(1)
  @IsOptional()
  configVersion?: number;

  @IsObject({ message: 'La configuración de datos debe ser un objeto' })
  @IsOptional()
  dataConfig?: Record<string, any>;

  @IsObject({ message: 'La configuración visual debe ser un objeto' })
  @IsOptional()
  visualConfig?: Record<string, any>;

  @IsObject({ message: 'La configuración de interacción debe ser un objeto' })
  @IsOptional()
  interactionConfig?: Record<string, any>;

  @IsInt({ message: 'La coordenada layoutX debe ser un número entero' })
  @Min(0)
  @IsOptional()
  layoutX?: number;

  @IsInt({ message: 'La coordenada layoutY debe ser un número entero' })
  @Min(0)
  @IsOptional()
  layoutY?: number;

  @IsInt({ message: 'El ancho layoutW debe ser un número entero' })
  @Min(1)
  @IsOptional()
  layoutW?: number;

  @IsInt({ message: 'El alto layoutH debe ser un número entero' })
  @Min(1)
  @IsOptional()
  layoutH?: number;
}

export class UpdateWidgetDto {
  @IsString({ message: 'El título debe ser un texto' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'El tipo debe ser un texto' })
  @IsOptional()
  type?: string;

  @IsUUID('4', { message: 'El ID de la página debe ser un UUID válido' })
  @IsOptional()
  pageId?: string;

  @IsObject({ message: 'La configuración del gráfico debe ser un objeto' })
  @IsOptional()
  chartConfig?: Record<string, any>;

  @IsInt({ message: 'La versión de configuración debe ser un entero' })
  @Min(1)
  @IsOptional()
  configVersion?: number;

  @IsObject({ message: 'La configuración de datos debe ser un objeto' })
  @IsOptional()
  dataConfig?: Record<string, any>;

  @IsObject({ message: 'La configuración visual debe ser un objeto' })
  @IsOptional()
  visualConfig?: Record<string, any>;

  @IsObject({ message: 'La configuración de interacción debe ser un objeto' })
  @IsOptional()
  interactionConfig?: Record<string, any>;

  @IsInt({ message: 'La coordenada layoutX debe ser un número entero' })
  @Min(0)
  @IsOptional()
  layoutX?: number;

  @IsInt({ message: 'La coordenada layoutY debe ser un número entero' })
  @Min(0)
  @IsOptional()
  layoutY?: number;

  @IsInt({ message: 'El ancho layoutW debe ser un número entero' })
  @Min(1)
  @IsOptional()
  layoutW?: number;

  @IsInt({ message: 'El alto layoutH debe ser un número entero' })
  @Min(1)
  @IsOptional()
  layoutH?: number;
}
