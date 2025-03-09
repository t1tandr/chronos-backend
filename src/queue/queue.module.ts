import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { EmailModule } from '../email/email.module';
import { EmailWorker } from './queue.worker';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emailQueue'
    }),
    EmailModule
  ],
  providers: [QueueService, EmailWorker],
  exports: [QueueService]
})
export class QueueModule {}
