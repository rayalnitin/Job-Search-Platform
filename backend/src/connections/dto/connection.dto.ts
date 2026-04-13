import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class SendConnectionRequestDto {
  @IsOptional()
  @IsUUID()
  receiverId?: string;

  @IsOptional()
  @IsEmail()
  receiverEmail?: string;
}
