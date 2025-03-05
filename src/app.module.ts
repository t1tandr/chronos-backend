import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CalendarsModule } from './calendars/calendars.module';
import { InvitesModule } from './invites/invites.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [ConfigModule.forRoot(), UserModule, AuthModule, CalendarsModule, InvitesModule, EventsModule]
})
export class AppModule {}
