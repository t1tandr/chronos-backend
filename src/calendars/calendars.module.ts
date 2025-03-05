import { Module } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { CalendarsController } from './calendars.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [CalendarsController],
  providers: [CalendarsService, PrismaService],
  exports: [CalendarsService]
})
export class CalendarsModule {}
