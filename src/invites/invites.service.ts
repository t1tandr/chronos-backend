import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService
  ) {}

  async createInvite(calendarId: string, email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const existing = await this.prisma.invite.findFirst({
      where: {
        calendarId,
        email
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.invite.create({
      data: {
        calendarId,
        email,
        userId: user.id
      }
    });
  }

  async acceptInvite(id: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });

    if (!invite) {
      throw new Error('Invite not found');
    }

    await this.prisma.calendarMember.create({
      data: {
        calendarId: invite.calendarId,
        userId
      }
    });

    return this.prisma.invite.delete({ where: { id } });
  }

  async rejectInvite(id: string) {
    return this.prisma.invite.update({
      where: { id },
      data: {
        status: 'REJECTED'
      }
    });
  }

  async getInvitesForUser(userId: string) {
    return this.prisma.invite.findMany({
      where: {
        userId,
        status: 'PENDING'
      }
    });
  }

  async deleteInvite(id: string) {
    return this.prisma.invite.delete({ where: { id } });
  }

  async getInvitesForCalendar(calendarId: string) {
    return this.prisma.invite.findMany({
      where: {
        calendarId
      },
      include: {
        User: { select: { id: true, name: true } }
      }
    });
  }
}
