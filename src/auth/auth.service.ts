import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CalendarsService } from 'src/calendars/calendars.service';
import { EventsService } from 'src/events/events.service';

@Injectable()
export class AuthService {
  readonly REFRESH_TOKEN_NAME = 'refreshToken';
  private readonly EXPIRE_DAY_REFRESH_TOKEN = 1;

  constructor(
    private userService: UserService,
    private jwt: JwtService,
    private calendarService: CalendarsService,
    private eventService: EventsService,
    @InjectQueue('emailQueue') private emailQueue: Queue
  ) {}

  private issueTokens(userId: string) {
    const data = { id: userId };

    const accessToken = this.jwt.sign(data, {
      expiresIn: '1h'
    });

    const refreshToken = this.jwt.sign(data, {
      expiresIn: '7d'
    });

    return {
      accessToken,
      refreshToken
    };
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user && (await compare(dto.password, user.password))) {
      return user;
    } else {
      throw new UnauthorizedException('Invalid password or email ');
    }
  }

  async login(dto: AuthDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.validateUser(dto);
    const tokens = this.issueTokens(user.id);

    return {
      user,
      ...tokens
    };
  }

  async register(dto: RegisterDto, req: Request) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.userService.createUser(dto);

    const tokens = this.issueTokens(user.id);

    await this.emailQueue.add('sendEmail', {
      to: user.email,
      subject: 'You have been invited to a calendar',
      template: 'welcome',
      context: {
        name: user.name
      }
    });

    // Get country code
    const countryCode =
      dto.country || (await this.userService.getCountryByIP(req.ip));
    console.log('Creating calendar for country:', countryCode);

    try {
      const calendar = await this.calendarService.createCalendar(user.id, {
        name: 'Personal Calendar',
        description: 'Your personal calendar with holidays',
        color: '#3788d8',
        isPublic: false
      });

      const currentYear = new Date().getFullYear();
      const holidays = await this.calendarService.getHolidaysWithGoogleCalendar(
        countryCode,
        currentYear
      );

      console.log(`Found ${holidays.length} holidays for ${countryCode}`);

      for (const holiday of holidays) {
        try {
          const startDate = holiday.start.dateTime
            ? new Date(holiday.start.dateTime)
            : new Date(`${holiday.start.date}T00:00:00`);

          await this.eventService.createEvent(user.id, {
            name: holiday.summary,
            description: holiday.description || '',
            date: startDate,
            duration: 1440,
            calendarId: calendar.id,
            color: '#ff4444',
            category: 'REMINDER'
          });
        } catch (error) {
          console.error('Error creating holiday event:', error);
        }
      }
    } catch (error) {
      console.error('Error setting up calendar:', error);
    }

    return {
      user,
      ...tokens
    };
  }

  addRefreshTokenToResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN);

    res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      domain: 'localhost',
      expires: expiresIn,
      secure: true,
      sameSite: 'none'
    });
  }

  removeRefreshTokenFromResponse(res: Response) {
    res.cookie(this.REFRESH_TOKEN_NAME, '', {
      httpOnly: true,
      domain: 'localhost',
      expires: new Date(0),
      secure: true,
      sameSite: 'none'
    });
  }

  async getNewTokens(refreshToken: string) {
    const result = await this.jwt.verifyAsync(refreshToken);

    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const user = await this.userService.findById(result.id);

    const tokens = this.issueTokens(user.id);

    return {
      user,
      ...tokens
    };
  }
}
