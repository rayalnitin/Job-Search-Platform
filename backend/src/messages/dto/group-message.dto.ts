import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // UUIDs of users to add as participants (besides creator)
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  participantIds: string[];
}

export class SendGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AddParticipantDto {
  @IsUUID()
  userId: string;
}
