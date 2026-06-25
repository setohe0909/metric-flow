import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la organización es obligatorio' })
  name: string;
}

export class UpdateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la organización es obligatorio' })
  name: string;
}

export class InviteMemberDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsEnum(Role, { message: 'El rol debe ser ADMIN, EDITOR o READER' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  role: Role;
}

export class UpdateMemberRoleDto {
  @IsEnum(Role, { message: 'El rol debe ser ADMIN, EDITOR o READER' })
  role: Role;
}

export class UpdateMemberStatusDto {
  @IsBoolean()
  disabled: boolean;
}
