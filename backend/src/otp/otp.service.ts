import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp, OtpPurpose } from './otp.entity';
import { User } from '../users/user.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async generateOtp(user: User, purpose: OtpPurpose): Promise<string> {
    // Invalidate any existing unused OTPs for same purpose
    await this.otpRepository.update(
      { user: { id: user.id }, purpose, isUsed: false },
      { isUsed: true },
    );

    // Generate 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      user,
      code,
      purpose,
      expiresAt,
    });

    await this.otpRepository.save(otp);

    // Simulate sending — later replace this block with real email/SMS service
    console.log(`
    ==========================================
    OTP for ${user.email}
    Purpose: ${purpose}
    Code: ${code}
    Expires at: ${expiresAt.toISOString()}
    ==========================================
    `);

    return code;
  }

  async verifyOtp(
    user: User,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        user: { id: user.id },
        code,
        purpose,
        isUsed: false,
      },
    });

    if (!otp) return false;

    // Check expiry
    if (new Date() > otp.expiresAt) return false;

    // Mark as used
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    return true;
  }
}
