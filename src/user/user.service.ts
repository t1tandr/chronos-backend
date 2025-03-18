import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hash } from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService
  ) {}

  async createUser(dto: RegisterDto) {
    const user = {
      email: dto.email,
      name: dto.name,
      password: await hash(dto.password, 10)
    };

    return this.prisma.user.create({
      data: user
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email
      }
    });
  }

  async findById(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = await this.prisma.user.findUnique({
      where: {
        id: id
      }
    });
    return userData;
  }

  async findUserWithCalendars(id: string) {
    const data = await this.prisma.user.findUnique({
      where: { id },
      include: {
        calendars: true
      }
    });

    if (!data) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        country: data.country
      },
      calendars: data.calendars
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id }
    });
  }

  async getCountryByIP(ip: string): Promise<string | null> {
    try {
      const cleanIP = ip.replace('::ffff:', '');

      if (cleanIP === '127.0.0.1' || cleanIP === 'localhost') {
        return 'UA';
      }

      const url = `https://ipapi.co/${cleanIP}/json/`;
      const response = await lastValueFrom(this.httpService.get(url));

      if (response.data.error || response.data.reserved) {
        console.log(
          'IP lookup error:',
          response.data.reason || 'Unknown error'
        );
        return null;
      }

      return response.data?.country_code || null;
    } catch (e) {
      console.log('Error getting country for IP:', ip, e?.message);
      return null;
    }
  }
}
