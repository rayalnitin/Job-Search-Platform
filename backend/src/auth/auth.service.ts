import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User, UserRole } from '../users/user.entity';
import { Profile } from '../users/profile.entity';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/otp.entity';
import { RegisterDto, LoginDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private otpService: OtpService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await argon2.hash(dto.password);

    // Create user
    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      role: UserRole.USER,
      isVerified: false,
    });
    await this.userRepository.save(user);

    // Create empty profile for user
    const profile = this.profileRepository.create({ user });
    await this.profileRepository.save(profile);

    // Generate and send OTP
    await this.otpService.generateOtp(user, OtpPurpose.REGISTRATION);

    return {
      message:
        'Registration successful. Please verify your email with the OTP.',
      userId: user.id,
    };
  }

  async verifyRegistrationOtp(dto: VerifyOtpDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('User not found');

    const isValid = await this.otpService.verifyOtp(
      user,
      dto.code,
      OtpPurpose.REGISTRATION,
    );
    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    // Mark user as verified
    user.isVerified = true;
    await this.userRepository.save(user);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.isSuspended) throw new UnauthorizedException('Account suspended');

    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email first');

    const isPasswordValid = await argon2.verify(user.password, dto.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
