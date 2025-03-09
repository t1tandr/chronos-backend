import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaService } from 'src/prisma.service';
import { QueueModule } from 'src/queue/queue.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [QueueModule, BullModule.registerQueue({ name: 'emailQueue' })],
  controllers: [EventsController],
  providers: [EventsService, PrismaService],
  exports: [EventsService]
})
export class EventsModule {}
