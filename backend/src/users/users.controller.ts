import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /users/profile — own full profile (with privacy settings)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user);
  }

  // PATCH /users/profile — update profile fields + privacy settings + opt-out
  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user, dto);
  }

  // GET /users/profile/viewers — my viewer count + recent viewers list
  // NOTE: must be declared BEFORE /profile/:id to avoid route conflict
  @Get('profile/viewers')
  getMyViewers(@CurrentUser() user: User) {
    return this.usersService.getMyViewers(user);
  }

  // GET /users/profile/:id — view another user's profile (privacy-filtered)
  @Get('profile/:id')
  getProfileById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.usersService.getProfileById(user, id);
  }
}
