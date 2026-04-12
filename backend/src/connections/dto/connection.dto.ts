import { IsUUID } from 'class-validator';

export class SendConnectionRequestDto {
  @IsUUID()
  receiverId: string;
}
