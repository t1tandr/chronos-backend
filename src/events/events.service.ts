import {
  Injectable,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Role } from '@prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('emailQueue') private emailQueue: Queue
  ) {}

  async createEvent(userId: string, dto: CreateEventDto) {
    await this.checkUserPermission(userId, dto.calendarId);

    const event = await this.prisma.event.create({
      data: {
        ...dto,
        creatorId: userId
      }
    });

    const participants = await this.prisma.calendarMember.findMany({
      where: { calendarId: dto.calendarId },
      include: {
        user: true
      }
    });

    const emails = participants.map((p) => p.user.email);
    const reminderTime = new Date(event.date.getTime() - 15 * 60000);

    await this.emailQueue.add(
      'sendEmail',
      {
        to: emails,
        subject: `Reminder: ${event.name} starts soon`,
        template: 'event-reminder',
        context: {
          eventName: event.name,
          eventTime: this.formatDate(event.date)
        }
      },
      { delay: reminderTime.getTime() - Date.now() }
    );

    return event;
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.checkUserPermission(userId, event.calendarId);

    return this.prisma.event.update({
      where: { id: eventId },
      data: dto
    });
  }

  async deleteEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.checkUserPermission(userId, event.calendarId);

    return this.prisma.event.delete({ where: { id: eventId } });
  }

  async getEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  private async checkUserPermission(userId: string, calendarId: string) {
    const membership = await this.prisma.calendarMember.findFirst({
      where: { calendarId, userId, role: { in: [Role.OWNER, Role.EDITOR] } }
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have permission to modify this event'
      );
    }
  }

  private formatDate(date: Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }
}
