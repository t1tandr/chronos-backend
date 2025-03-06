import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Delete,
  Get
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('create')
  async createEvent(
    @Body() dto: CreateEventDto,
    @CurrentUser('id') userId: string
  ) {
    return this.eventsService.createEvent(userId, dto);
  }

  @Put(':id')
  async updateEvent(
    @Param('id') eventId: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser('id') userId: string
  ) {
    return this.eventsService.updateEvent(userId, eventId, dto);
  }

  @Delete(':id')
  async deleteEvent(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.eventsService.deleteEvent(userId, eventId);
  }

  @Get(':id')
  async getEvent(@Param('id') eventId: string) {
    return this.eventsService.getEvent(eventId);
  }
}
