/* eslint-disable prefer-const */
import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
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

  async removeMember(calendarId: string, memberId: string, userId: string) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: calendarId },
      include: {
        members: true
      }
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    if (userId === memberId) {
      const isMember = calendar.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this calendar');
      }
    } else {
      if (calendar.ownerId !== userId) {
        throw new ForbiddenException('Only calendar owner can remove members');
      }
    }

    return this.prisma.calendarMember.delete({
      where: {
        userId_calendarId: {
          userId: memberId,
          calendarId
        }
      }
    });
  }

  async joinPublicCalendar(userId: string, calendarId: string) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: calendarId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    if (!calendar.isPublic) {
      throw new ForbiddenException('This calendar is not public');
    }

    return this.prisma.calendarMember.create({
      data: {
        userId,
        calendarId,
        role: 'VIEWER'
      },
      include: {
        calendar: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async searchCalendars(query: string, limit: number = 10) {
    if (!query?.trim()) {
      return [];
    }

    try {
      const result = await this.prisma.$queryRaw<Array<any>>`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.color,
          c.slug,
          c.owner_id,
          c.is_public,
          ts_rank_cd(to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')), 
            plainto_tsquery('english', ${query})) as rank
        FROM calendars c
        WHERE c.is_public = true
        AND to_tsvector('english', c.name || ' ' || COALESCE(c.description, ''))
          @@ plainto_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT ${limit};
      `;

      return result.map((calendar: any) => ({
        ...calendar,
        ownerId: calendar.owner_id,
        isPublic: calendar.is_public
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async getHolidaysWithGoogleCalendar(countryCode: string, year: number) {
    try {
      const calendarMapping = {
        UA: 'uk.ukrainian#holiday@group.v.calendar.google.com',
        US: 'en.usa#holiday@group.v.calendar.google.com',
        GB: 'en.uk#holiday@group.v.calendar.google.com',
        PL: 'pl.polish#holiday@group.v.calendar.google.com'
      };

      const calendarId =
        calendarMapping[countryCode.toUpperCase()] ||
        `en.${countryCode.toLowerCase()}#holiday@group.v.calendar.google.com`;

      console.log(
        `Fetching holidays for ${countryCode} using calendar ID: ${calendarId}`
      );

      const res = await this.calendar.events.list({
        calendarId,
        timeMin: `${year}-01-01T00:00:00Z`,
        timeMax: `${year}-12-31T23:59:59Z`,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100
      });

      if (!res.data.items || res.data.items.length === 0) {
        console.log(`No holidays found for country: ${countryCode}`);
        return [];
      }

      console.log(
        `Successfully fetched ${res.data.items.length} holidays for ${countryCode}`
      );
      return res.data.items;
    } catch (error) {
      console.error(
        `Error fetching holidays for ${countryCode}:`,
        error.message
      );
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

  async getOwnCalendars(userId: string) {
    return this.prisma.calendar.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async getCalendarEvents(calendarId: string, userId: string) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: calendarId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    if (
      !calendar.isPublic &&
      calendar.ownerId !== userId &&
      !calendar.members.length
    ) {
      throw new ForbiddenException('You do not have access to this calendar');
    }

    const events = await this.prisma.event.findMany({
      where: {
        calendarId
      },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        duration: true,
        category: true,
        color: true,
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });
    console.log(events);

    return events;
  }

  async getParticipantCalendar(userId: string) {
    const participantCalendars = await this.prisma.calendarMember.findMany({
      where: {
        userId,
        role: { in: ['EDITOR', 'VIEWER', 'SELF_EDITOR'] }
      },
      include: {
        calendar: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            members: {
              select: {
                id: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return participantCalendars.map(({ calendar }) => ({
      ...calendar,
      owner: calendar.owner,
      members: calendar.members
    }));
  }

  async getPublicCalendarsByUserId(userId: string) {
    return this.prisma.calendar.findMany({
      where: {
        ownerId: userId,
        isPublic: true
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async updateCalendar(userId: string, id: string, dto: CreateCalendarDto) {
    const calendar = await this.getCalendarById(id, userId);
    const members = await this.prisma.calendarMember.findMany({
      where: {
        calendarId: id,
        userId
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
      newSlug = `${calendar.slug}-${Math.random().toString(36).substring(4, 8)}`;
      existing = await this.prisma.calendar.findUnique({ where: { id } });
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

  async getCalendarById(id: string, userId: string) {
    const publicCalendar = await this.prisma.calendar.findFirst({
      where: {
        id,
        isPublic: true
      }
    });
    if (publicCalendar) {
      return publicCalendar;
    } else {
      const member = await this.prisma.calendarMember.findFirst({
        where: {
          calendarId: id,
          userId
        }
      });
      if (!member) {
        throw new Error('Not a member of this calendar');
      } else {
        return this.prisma.calendar.findUnique({ where: { id } });
      }
    }
  }

  async updateMemberRole(
    calendarId: string,
    memberId: string,
    role: 'EDITOR' | 'VIEWER',
    userId: string
  ) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: calendarId },
      include: { members: true }
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    if (calendar.ownerId !== userId) {
      throw new ForbiddenException('Only owner can update member roles');
    }

    return this.prisma.calendarMember.update({
      where: {
        userId_calendarId: {
          userId: memberId,
          calendarId
        }
      },
      data: { role }
    });
  }

  async deleteCalendar(calendarId: string, userId: string) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { id: calendarId }
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    if (calendar.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete calendar');
    }

    await this.prisma.$transaction([
      this.prisma.event.deleteMany({
        where: { calendarId }
      }),
      this.prisma.invite.deleteMany({
        where: { calendarId }
      }),
      this.prisma.calendarMember.deleteMany({
        where: { calendarId }
      }),
      this.prisma.calendar.delete({
        where: { id: calendarId }
      })
    ]);

    return { message: 'Calendar deleted successfully' };
  }
}
