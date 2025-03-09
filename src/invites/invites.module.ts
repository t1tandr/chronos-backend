import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';
import { QueueModule } from 'src/queue/queue.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    UserModule,
    QueueModule,
    BullModule.registerQueue({ name: 'emailQueue' })
  ],
  controllers: [InvitesController],
  providers: [InvitesService, PrismaService],
  exports: [InvitesService]
})
export class InvitesModule {}
