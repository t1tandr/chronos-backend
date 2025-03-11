import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  UseGuards
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('invites')
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvite(@Body() dto: CreateInviteDto) {
    return this.invitesService.createInvite(dto);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvite(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.invitesService.acceptInvite(id, userId);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectInvite(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.invitesService.rejectInvite(id, userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getInvitesForUser(@CurrentUser('id') userId: string) {
    return this.invitesService.getInvitesForUser(userId);
  }

  @Get('calendar/:calendarId')
  @UseGuards(JwtAuthGuard)
  async getInvitesForCalendar(
    @Param('calendarId') calendarId: string,
    userId: string
  ) {
    return this.invitesService.getInvitesForCalendar(calendarId, userId);
  }

  @Delete(':id')
  async deleteInvite(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.invitesService.deleteInvite(id, userId);
  }
}
