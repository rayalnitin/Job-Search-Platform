import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User, UserRole } from '../users/user.entity';
import { Profile } from '../users/profile.entity';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/otp.entity';
import {
  RegisterDto,
  LoginDto,
  LoginOtpRequestDto,
  LoginOtpVerifyDto,
  VerifyOtpDto,
  CompleteRegistrationDto,
  ResendRegistrationOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ConfirmAccountDeletionDto,
} from './dto/auth.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private otpService: OtpService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  // ── Register ──────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser?.isVerified) {
      throw new ConflictException('Email already registered');
    }

    if (existingUser && !existingUser.isVerified) {
      await this.userRepository.delete(existingUser.id);
    }

    await this.otpService.generateOtp(dto.email, OtpPurpose.REGISTRATION);

    return {
      message:
        'Registration OTP sent to your email. Complete verification to create your account.',
      email: dto.email,
    };
  }

  // ── Verify Registration OTP ───────────────────────────────────

  async verifyRegistrationOtp(dto: CompleteRegistrationDto) {
    const isValid = await this.otpService.verifyOtpByEmail(
      dto.email,
      dto.code,
      OtpPurpose.REGISTRATION,
    );

    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser?.isVerified) {
      throw new ConflictException('Email already registered');
    }

    if (existingUser && !existingUser.isVerified) {
      await this.userRepository.delete(existingUser.id);
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: dto.role ?? UserRole.USER,
      isVerified: true,
    });
    await this.userRepository.save(user);

    const profile = this.profileRepository.create({
      user,
      name: dto.name,
    });
    await this.profileRepository.save(profile);

    await this.auditService.log(
      AuditAction.USER_REGISTERED,
      user.id,
      user.id,
      'User',
      { email: user.email },
    );

    return { message: 'Email verified successfully. Your account is now created.' };
  }

  async resendRegistrationOtp(dto: ResendRegistrationOtpDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (user?.isVerified) {
      return {
        message:
          'If the account exists and is pending verification, a new OTP has been sent to your email.',
      };
    }

    await this.otpService.generateOtp(dto.email, OtpPurpose.REGISTRATION);

    return {
      message:
        'If the account exists and is pending verification, a new OTP has been sent to your email.',
    };
  }

  // ── Login ─────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isSuspended)
      throw new UnauthorizedException('Your account is suspended');
    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email first');

    const isPasswordValid = await argon2.verify(user.password, dto.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    await this.auditService.log(
      AuditAction.USER_LOGIN,
      user.id,
      user.id,
      'User',
      { email: user.email },
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profile?.name || user.email,
      },
    };
  }

  async requestLoginOtp(dto: LoginOtpRequestDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || user.isSuspended || !user.isVerified) {
      return {
        message: 'If that email is eligible for login, an OTP has been sent.',
      };
    }

    await this.otpService.generateOtp(user, OtpPurpose.LOGIN);

    return {
      message: 'If that email is eligible for login, an OTP has been sent.',
    };
  }

  async verifyLoginOtp(dto: LoginOtpVerifyDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) throw new BadRequestException('Invalid request');
    if (user.isSuspended)
      throw new UnauthorizedException('Your account is suspended');
    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email first');

    const isValid = await this.otpService.verifyOtpByEmail(
      dto.email,
      dto.code,
      OtpPurpose.LOGIN,
    );

    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    await this.auditService.log(
      AuditAction.USER_LOGIN,
      user.id,
      user.id,
      'User',
      { email: user.email, method: 'otp' },
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profile?.name || user.email,
      },
    };
  }

  // ── Forgot Password — step 1: request OTP ────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    // Always return same message to prevent user enumeration
    if (!user || !user.isVerified) {
      return { message: 'If that email exists, an OTP has been sent.' };
    }

    await this.otpService.generateOtp(user, OtpPurpose.PASSWORD_RESET);

    return { message: 'If that email exists, an OTP has been sent.' };
  }

  // ── Reset Password — step 2: verify OTP + set new password ───

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('Invalid request');

    const isValid = await this.otpService.verifyOtp(
      user,
      dto.code,
      OtpPurpose.PASSWORD_RESET,
    );
    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    user.password = await argon2.hash(dto.newPassword);
    await this.userRepository.save(user);

    await this.auditService.log(
      AuditAction.PASSWORD_RESET,
      user.id,
      user.id,
      'User',
      { email: user.email },
    );

    return { message: 'Password reset successfully. You can now log in.' };
  }

  // ── Request Account Deletion OTP — step 1 ────────────────────

  async requestAccountDeletionOtp(user: User) {
    await this.otpService.generateOtp(user, OtpPurpose.ACCOUNT_DELETION);
    return {
      message: 'OTP sent. Confirm with the code to delete your account.',
    };
  }

  // ── Confirm Account Deletion — step 2: verify OTP + delete ───

  async confirmAccountDeletion(dto: ConfirmAccountDeletionDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await this.otpService.verifyOtp(
      user,
      dto.code,
      OtpPurpose.ACCOUNT_DELETION,
    );
    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    await this.auditService.log(
      AuditAction.ACCOUNT_DELETED,
      user.id,
      user.id,
      'User',
      { email: user.email },
    );

    await this.userRepository.remove(user);

    return { message: 'Account deleted successfully.' };
  }
}
