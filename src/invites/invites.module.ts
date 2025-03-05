import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [InvitesController],
  providers: [InvitesService, PrismaService],
  exports: [InvitesService]
})
export class InvitesModule {}
