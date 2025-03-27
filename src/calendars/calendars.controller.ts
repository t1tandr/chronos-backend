import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get('/search')
  @UseGuards(JwtAuthGuard)
  async searchCalendars(
    @Query('query') query: string,
    @Query('limit') limit: number = 10
  ) {
    return this.calendarsService.searchCalendars(query, limit);
  }

  @Post('/:id/join')
  @UseGuards(JwtAuthGuard)
  async joinCalendar(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.joinPublicCalendar(userId, id);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createCalendar(
    @Body() dto: CreateCalendarDto,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.createCalendar(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCalendars(@CurrentUser('id') userId: string) {
    return this.calendarsService.getOwnCalendars(userId);
  }

  @Get('/participants')
  @UseGuards(JwtAuthGuard)
  async getParticipants(@CurrentUser('id') userId: string) {
    return this.calendarsService.getParticipantCalendar(userId);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async updateCalendar(
    @Param('id') id: string,
    @Body() dto: CreateCalendarDto,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.updateCalendar(userId, id, dto);
  }

  @Get('/:id/events')
  @UseGuards(JwtAuthGuard)
  async getCalendarEvents(
    @Param('id') calendarId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.getCalendarEvents(calendarId, userId);
  }

  @Get('/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getCalendarsForUser(
    @Param('userId') userIdUrl: string,
    @CurrentUser('id') userId: string
  ) {
    if (userIdUrl !== userId) {
      return this.calendarsService.getPublicCalendarsByUserId(userIdUrl);
    }
    return this.calendarsService.getOwnCalendars(userId);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async getCalendarById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.getCalendarById(id, userId);
  }

  @Patch('/:id/members/:userId/role')
  @UseGuards(JwtAuthGuard)
  async updateMemberRole(
    @Param('id') calendarId: string,
    @Param('userId') memberId: string,
    @Body('role') role: 'EDITOR' | 'VIEWER',
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.updateMemberRole(
      calendarId,
      memberId,
      role,
      userId
    );
  }

  @Delete('/:id/members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param('id') calendarId: string,
    @Param('userId') memberId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.removeMember(calendarId, memberId, userId);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCalendar(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.deleteCalendar(id, userId);
  }
}
