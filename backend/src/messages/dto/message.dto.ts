import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
