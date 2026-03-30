import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { JobType, JobLocationType } from '../job.entity';

// ── Company DTOs ──────────────────────────────────────────────

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}

// ── Job DTOs ──────────────────────────────────────────────────

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsEnum(JobLocationType)
  locationType?: JobLocationType;

  @IsOptional()
  @IsString()
  salaryRange?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsEnum(JobLocationType)
  locationType?: JobLocationType;

  @IsOptional()
  @IsString()
  salaryRange?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(['active', 'closed'])
  status?: string;
}
