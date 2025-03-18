import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

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

  @Post('/:id/update')
  @UseGuards(JwtAuthGuard)
  async updateCalendar(
    @Body() dto: CreateCalendarDto,
    @Param('id') slug: string,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.updateCalendar(userId, slug, dto);
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
}
