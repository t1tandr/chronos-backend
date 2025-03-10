/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { PrismaService } from 'src/prisma.service';
import slugify from 'slugify';
import { google } from 'googleapis';

@Injectable()
export class CalendarsService {
  private calendar;

  constructor(private prisma: PrismaService) {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'src/config/calendar-credentials.json',
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async getHolidaysWithGoogleCalendar(countryCode: string, year: number) {
    try {
      // Map of country codes to their specific calendar IDs
      const calendarMapping = {
        UA: 'uk.ukrainian#holiday@group.v.calendar.google.com',
        US: 'en.usa#holiday@group.v.calendar.google.com',
        GB: 'en.uk#holiday@group.v.calendar.google.com',
        PL: 'pl.polish#holiday@group.v.calendar.google.com'
      };

      // Get calendar ID from mapping or construct a default one
      const calendarId =
        calendarMapping[countryCode.toUpperCase()] ||
        `en.${countryCode.toLowerCase()}#holiday@group.v.calendar.google.com`;

      console.log(
        `Attempting to fetch holidays with Calendar ID: ${calendarId}`
      );

      const res = await this.calendar.events.list({
        calendarId,
        timeMin: `${year}-01-01T00:00:00Z`,
        timeMax: `${year}-12-31T23:59:59Z`,
        singleEvents: true,
        orderBy: 'startTime'
      });

      if (!res.data.items) {
        console.log(`No holidays found for country: ${countryCode}`);
        return [];
      }

      console.log(`Fetched ${res.data.items.length} holidays`);

      return res.data.items;
    } catch (error) {
      console.error('Error fetching holidays:', error.message);
      // Return empty array instead of throwing error
      return [];
    }
  }

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
