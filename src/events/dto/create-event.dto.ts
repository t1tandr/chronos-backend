import { IsString, IsOptional, IsEnum, IsInt, IsDate } from 'class-validator';
import { EventCategory } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsInt()
  duration: number;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsString()
  calendarId: string;

  @IsOptional()
  @IsString()
  color?: string;
}
