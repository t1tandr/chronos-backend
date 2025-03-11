import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    @InjectQueue('emailQueue') private emailQueue: Queue
  ) {}

  async createInvite(dto: CreateInviteDto) {
    const { email, calendarId } = dto;
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

    const invite = await this.prisma.invite.create({
      data: {
        calendarId,
        email,
        userId: user.id
      }
    });

    const link = `${process.env.FRONTEND_URL}/invites/`;

    await this.emailQueue.add('sendEmail', {
      to: email,
      subject: 'You have been invited to a calendar',
      template: 'invite',
      context: {
        link
      }
    });

    return invite;
  }

  async acceptInvite(id: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });

    if (invite.userId !== userId) {
      throw new Error('You do not have permission to accept this invite');
    }

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

  async rejectInvite(id: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });

    if (invite.userId !== userId) {
      throw new Error('You do not have permission to reject this invite');
    }

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

  async deleteInvite(id: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (invite.userId !== userId) {
      throw new Error('You do not have permission to delete this invite');
    }
    return this.prisma.invite.delete({ where: { id } });
  }

  async getInvitesForCalendar(calendarId: string, userId: string) {
    const member = await this.prisma.calendarMember.findFirst({
      where: {
        calendarId,
        userId
      }
    });
    if (!member) {
      throw new Error('You are not a member of this calendar');
    }

    if (member.role !== 'OWNER') {
      throw new Error(
        'You do not have permission to view invites for this calendar'
      );
    }
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
