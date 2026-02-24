import { IsUUID } from 'class-validator';

export class ResumeParamDto {
  @IsUUID()
  id: string;
}
