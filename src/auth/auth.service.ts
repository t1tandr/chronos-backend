import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  readonly REFRESH_TOKEN_NAME = 'refreshToken';
  private readonly EXPIRE_DAY_REFRESH_TOKEN = 1;

  constructor(
    private userService: UserService,
    private jwt: JwtService
  ) {}

  private issueTokens(userId: number) {
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

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.userService.createUser(dto);

    const tokens = this.issueTokens(user.id);

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

  // async refreshToken(user: any) {
  //   const payload = { email: user.email, sub: user.id };
  //   return {
  //     backendTokens: {
  //       accessToken: await this.jwtService.signAsync(payload, {
  //         expiresIn: '1h',
  //         secret: process.env.JWT_SECRET
  //       }),
  //       refreshToken: await this.jwtService.signAsync(payload, {
  //         expiresIn: '7d',
  //         secret: process.env.JWT_REFRESH_TOKEN
  //       })
  //     }
  //   };
  // }
}
