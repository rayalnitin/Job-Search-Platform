import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /users/profile — own full profile
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user);
  }

  // PATCH /users/profile — update profile + privacy + opt-out
  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user, dto);
  }

  // POST /users/profile/avatar — upload profile picture
  // Send as multipart/form-data with field name "avatar"
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user, file);
  }

  // DELETE /users/profile/avatar — delete own avatar
  @Delete('profile/avatar')
  deleteAvatar(@CurrentUser() user: User) {
    return this.usersService.deleteAvatar(user);
  }

  // GET /users/profile/viewers — my viewer count + recent viewers
  // Must be declared BEFORE /profile/:id to avoid route conflict
  @Get('profile/viewers')
  getMyViewers(@CurrentUser() user: User) {
    return this.usersService.getMyViewers(user);
  }

  // GET /users/profile/:id — view another user's profile (privacy-filtered)
  @Get('profile/:id')
  getProfileById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.usersService.getProfileById(user, id);
  }

  // GET /users/avatar/:id — stream avatar image bytes
  // No auth guard intentionally — avatars are public-facing
  // Separate from profile/:id so it doesn't trigger view logging
  @Get('avatar/:id')
  async getAvatar(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.usersService.getAvatar(id);
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=3600'); // cache 1hr in browser
    res.send(buffer);
  }
}
