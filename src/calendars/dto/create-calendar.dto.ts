import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
