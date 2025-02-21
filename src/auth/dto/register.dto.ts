import { IsEmail, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  password: string;
}
