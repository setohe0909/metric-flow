import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class BootstrapDto {
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la organización es obligatorio' })
  organizationName: string;
}
