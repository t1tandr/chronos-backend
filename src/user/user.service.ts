import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { hash } from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

  async findById(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = await this.prisma.user.findUnique({
      where: {
        id: id
      }
    });
    return userData;
  }
}
