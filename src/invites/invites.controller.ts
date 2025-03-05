import { Controller, Get, Param, Post } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get()
  getInvitesForUser(@CurrentUser('id') userId: string) {
    return this.invitesService.getInvitesForUser(userId);
  }

  @Post()
  createInvite(
    @CurrentUser('id') userId: string
  ) {
    return this.invitesService.createInvite(calendarId, userId);
  }

  @Post('accept/:id')
  
}
