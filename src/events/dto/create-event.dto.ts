import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt
} from 'class-validator';
import { EventCategory } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;

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
