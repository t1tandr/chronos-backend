/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { PrismaService } from 'src/prisma.service';
import slugify from 'slugify';

@Injectable()
export class CalendarsService {
  constructor(private prisma: PrismaService) {}

  async createCalendar(userId: string, dto: CreateCalendarDto) {
    let slug = slugify(dto.name, { lower: true, strict: true });
    let existing = await this.prisma.calendar.findUnique({ where: { slug } });

    while (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(4, 8)}`;
      existing = await this.prisma.calendar.findUnique({ where: { slug } });
    }

    const { id, ...rest } = await this.prisma.calendar.create({
      data: {
        ...dto,
        ownerId: userId,
        slug
      }
    });
    await this.prisma.calendarMember.create({
      data: {
        calendarId: id,
        userId,
        role: 'OWNER'
      }
    });
    return { id, ...rest };
  }

  async updateCalendar(userId: string, slug: string, dto: CreateCalendarDto) {
    const { id } = await this.findCalendarBySlug(slug);
    const members = await this.prisma.calendarMember.findMany({
      where: {
        calendarId: id,
        userId
        // role: 'OWNER' || 'EDITOR'
        //TODO - Fix this after end part with invites
      }
    });

    if (!members.length) {
      throw new Error('Not a member of this calendar');
    }

    let newSlug = slugify(dto.name, { lower: true, strict: true });
    let existing = await this.prisma.calendar.findUnique({
      where: { slug: newSlug }
    });

    while (existing) {
      newSlug = `${slug}-${Math.random().toString(36).substring(4, 8)}`;
      existing = await this.prisma.calendar.findUnique({ where: { slug } });
    }

    return this.prisma.calendar.update({
      where: { id },
      data: {
        ...dto,
        slug: newSlug
      }
    });
  }

  async findCalendarBySlug(slug: string) {
    const calendar = await this.prisma.calendar.findUnique({ where: { slug } });
    if (!calendar) {
      throw new Error('Calendar not found');
    }
    return calendar;
  }

  async findUserCalendars(userId: string, ownPage: boolean) {
    if (ownPage) {
      return this.prisma.calendarMember.findMany({
        where: {
          userId
        },
        select: {
          calendar: true
        }
      });
    } else {
      return this.prisma.calendar.findMany({
        where: {
          ownerId: userId,
          isPublic: true
        }
      });
    }
  }
}
