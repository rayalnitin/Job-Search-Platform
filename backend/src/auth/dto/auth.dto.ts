import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { UserRole } from '../../users/user.entity';

const allowedEmailDomains =
  /@(gmail\.com|googlemail\.com|yahoo\.com|yahoo\.in|outlook\.com|hotmail\.com|live\.com|proton\.me|protonmail\.com)$/i;

const strongPassword = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  @Matches(allowedEmailDomains, {
    message:
      'Use a supported email domain such as gmail.com, yahoo.com, outlook.com, or similar.',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(strongPassword, {
    message:
      'Password must include at least 1 uppercase letter and 1 special character.',
  })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @IsEmail()
  @Matches(allowedEmailDomains, {
    message:
      'Use a supported email domain such as gmail.com, yahoo.com, outlook.com, or similar.',
  })
  email: string;

  @IsString()
  password: string;
}

export class LoginOtpRequestDto {
  @IsEmail()
  @Matches(allowedEmailDomains, {
    message:
      'Use a supported email domain such as gmail.com, yahoo.com, outlook.com, or similar.',
  })
  email: string;
}

export class LoginOtpVerifyDto {
  @IsEmail()
  @Matches(allowedEmailDomains, {
    message:
      'Use a supported email domain such as gmail.com, yahoo.com, outlook.com, or similar.',
  })
  email: string;

  @IsString()
  code: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}

export class CompleteRegistrationDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(strongPassword, {
    message:
      'Password must include at least 1 uppercase letter and 1 special character.',
  })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsString()
  code: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResendRegistrationOtpDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class RequestDeletionOtpDto {
  @IsEmail()
  email: string;
}

export class ConfirmAccountDeletionDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
