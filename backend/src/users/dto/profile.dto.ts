import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { FieldPrivacy } from '../profile.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  experience?: string;

  @IsString()
  @IsOptional()
  skills?: string;

  // ── Privacy controls ──────────────────────────────────────────

  @IsEnum(FieldPrivacy)
  @IsOptional()
  headlinePrivacy?: FieldPrivacy;

  @IsEnum(FieldPrivacy)
  @IsOptional()
  locationPrivacy?: FieldPrivacy;

  @IsEnum(FieldPrivacy)
  @IsOptional()
  bioPrivacy?: FieldPrivacy;

  @IsEnum(FieldPrivacy)
  @IsOptional()
  educationPrivacy?: FieldPrivacy;

  @IsEnum(FieldPrivacy)
  @IsOptional()
  experiencePrivacy?: FieldPrivacy;

  @IsEnum(FieldPrivacy)
  @IsOptional()
  skillsPrivacy?: FieldPrivacy;

  // ── Viewer opt-out ────────────────────────────────────────────

  @IsBoolean()
  @IsOptional()
  optOutOfViewers?: boolean;
}
