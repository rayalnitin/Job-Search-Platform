import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ConfirmAccountDeletionDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register — strict: max 5 per minute
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/verify-otp — strict: max 10 per minute
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyRegistrationOtp(dto);
  }

  // POST /auth/login — strict: max 10 per minute (brute force protection)
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /auth/forgot-password — strict: max 5 per minute
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /auth/reset-password — strict: max 5 per minute
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // POST /auth/request-deletion-otp — strict: max 3 per minute
  @Throttle({ auth: { ttl: 60000, limit: 3 } })
  @Post('request-deletion-otp')
  @UseGuards(JwtAuthGuard)
  requestDeletionOtp(@CurrentUser() user: User) {
    return this.authService.requestAccountDeletionOtp(user);
  }

  // DELETE /auth/delete-account — strict: max 3 per minute
  @Throttle({ auth: { ttl: 60000, limit: 3 } })
  @Delete('delete-account')
  deleteAccount(@Body() dto: ConfirmAccountDeletionDto) {
    return this.authService.confirmAccountDeletion(dto);
  }
}
