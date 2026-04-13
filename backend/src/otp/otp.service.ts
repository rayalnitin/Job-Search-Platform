import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import { Otp, OtpPurpose } from './otp.entity';
import { User } from '../users/user.entity';

@Injectable()
export class OtpService {
  private readonly transporter: Transporter | null;

  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private configService: ConfigService,
  ) {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASS');

    this.transporter =
      emailUser && emailPass
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass,
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
          })
        : null;
  }

  private async sendOtpEmail(
    email: string,
    code: string,
    purpose: OtpPurpose,
    expiresAt: Date,
  ) {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Email delivery is not configured. Set EMAIL_USER and EMAIL_PASS in the backend .env file.',
      );
    }

    const emailUser = this.configService.get<string>('EMAIL_USER');
    if (!emailUser) {
      throw new InternalServerErrorException(
        'Email delivery is not configured. Set EMAIL_USER and EMAIL_PASS in the backend .env file.',
      );
    }

    const purposeLabel =
      purpose === OtpPurpose.REGISTRATION
        ? 'registration verification'
        : purpose === OtpPurpose.PASSWORD_RESET
          ? 'password reset'
          : purpose === OtpPurpose.ACCOUNT_DELETION
            ? 'account deletion'
            : 'verification';

    await this.transporter.sendMail({
      from: emailUser,
      to: email,
      subject: `Your OTP for ${purposeLabel}`,
      text: [
        `Hello ${email},`,
        '',
        `Your OTP code is: ${code}`,
        `Purpose: ${purposeLabel}`,
        `This code expires at: ${expiresAt.toISOString()}`,
        '',
        'If you did not request this code, you can ignore this email.',
      ].join('\n'),
    });
  }

  async generateOtp(email: string, purpose: OtpPurpose): Promise<string>;
  async generateOtp(user: User, purpose: OtpPurpose): Promise<string>;
  async generateOtp(target: User | string, purpose: OtpPurpose): Promise<string> {
    const email = typeof target === 'string' ? target : target.email;
    const user = typeof target === 'string' ? null : target;

    if (user) {
      await this.otpRepository.update(
        { user: { id: user.id }, purpose, isUsed: false },
        { isUsed: true },
      );
    } else {
      await this.otpRepository.update(
        { email, purpose, isUsed: false },
        { isUsed: true },
      );
    }

    // Generate 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = this.otpRepository.create({
      user,
      email,
      code,
      purpose,
      expiresAt,
    });

    await this.otpRepository.save(otp);

    await this.sendOtpEmail(email, code, purpose, expiresAt);

    return code;
  }

  async verifyOtpByEmail(
    email: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        code,
        purpose,
        isUsed: false,
      },
    });

    if (!otp) return false;

    if (new Date() > otp.expiresAt) return false;

    otp.isUsed = true;
    await this.otpRepository.save(otp);

    return true;
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
