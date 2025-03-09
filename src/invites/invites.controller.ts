import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('invites')
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @Post()
  async createInvite(@Body() dto: CreateInviteDto) {
    return this.invitesService.createInvite(dto);
  }

  @Post(':id/accept')
  async acceptInvite(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.invitesService.acceptInvite(id, userId);
  }

  @Post(':id/reject')
  async rejectInvite(@Param('id') id: string) {
    return this.invitesService.rejectInvite(id);
  }

  @Get('user/:userId')
  async getInvitesForUser(@CurrentUser('id') userId: string) {
    return this.invitesService.getInvitesForUser(userId);
  }

  @Get('calendar/:calendarId')
  async getInvitesForCalendar(@Param('calendarId') calendarId: string) {
    return this.invitesService.getInvitesForCalendar(calendarId);
  }

  @Delete(':id')
  async deleteInvite(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.invitesService.deleteInvite(id, userId);
  }
}
