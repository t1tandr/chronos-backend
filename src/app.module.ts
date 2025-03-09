import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CalendarsModule } from './calendars/calendars.module';
import { InvitesModule } from './invites/invites.module';
import { EventsModule } from './events/events.module';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { QueueModule } from './queue/queue.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      }
    }),
    UserModule,
    AuthModule,
    CalendarsModule,
    InvitesModule,
    EventsModule,
    EmailModule,
    QueueModule
  ],
  providers: [EmailService]
})
export class AppModule {}
