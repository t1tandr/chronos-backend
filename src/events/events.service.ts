import {
  Injectable,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Role } from '@prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, dto: CreateEventDto) {
    await this.checkUserPermission(userId, dto.calendarId);

    const event = await this.prisma.event.create({
      data: {
        ...dto,
        creatorId: userId
      }
    });

    // this.scheduleEmailReminder(event);

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

  // private async scheduleEmailReminder(event: any) {
  //   const { date, calendarId } = event;

  //   const participants = await this.prisma.calendarMember.findMany({
  //     where: { calendarId },
  //     include: { user: true }
  //   });

  //   const emails = participants.map((p) => p.user.email);
  //   const reminderTime = new Date(date.getTime() - 15 * 60000); // за 15 минут до события

  //   setTimeout(() => {
  //     this.sendEmailNotification(emails, event);
  //   }, reminderTime.getTime() - Date.now());
  // }

  // private async sendEmailNotification(emails: string[], event: any) {
  //   const transporter = nodemailer.createTransport({
  //     service: 'Gmail',
  //     auth: {
  //       user: process.env.EMAIL_USER,
  //       pass: process.env.EMAIL_PASS
  //     }
  //   });

  //   const mailOptions = {
  //     from: process.env.EMAIL_USER,
  //     to: emails.join(','),
  //     subject: `Reminder: ${event.name} starts soon`,
  //     text: `Your event "${event.name}" starts in 15 minutes.`
  //   };

  //   await transporter.sendMail(mailOptions);
  // }
}
