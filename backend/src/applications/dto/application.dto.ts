import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApplicationStatus } from '../application.entity';

export class CreateApplicationDto {
  @IsUUID()
  jobId: string;

  @IsOptional()
  @IsUUID()
  resumeId?: string;

  @IsOptional()
  @IsString()
  coverNote?: string;
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  recruiterNotes?: string;
}
