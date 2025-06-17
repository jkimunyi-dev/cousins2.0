import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../common/enum/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}