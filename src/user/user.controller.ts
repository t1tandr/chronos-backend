import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.findById(id);
  }

  @Get('/calendars/:id')
  async getUserWithCalendars(@Param('id') userId: string) {
    return await this.userService.findUserWithCalendars(userId);
  }

  @Post(':id')
  async updateUser(
    @Body() dto: UpdateUserDto,
    @Param('id') id: string,
    @Req() req
  ) {
    if (req.user.id !== id) {
      return {
        message: 'You are not allowed to update this user'
      };
    }
    return await this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(id);
  }
}
