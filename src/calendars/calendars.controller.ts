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

  @Post('/:id/update')
  @UseGuards(JwtAuthGuard)
  async updateCalendar(
    @Body() dto: CreateCalendarDto,
    @Param('id') slug: string,
    @CurrentUser('id') userId: string
  ) {
    return this.calendarsService.updateCalendar(userId, slug, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findUserCalendars(
    @CurrentUser('id') userId: string,
    @Param('id') profileId: string
  ) {
    const isOwn = userId === profileId;
    return this.calendarsService.findUserCalendars(profileId, isOwn);
  }
}
