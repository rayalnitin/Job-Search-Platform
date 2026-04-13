import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class RegisterPublicKeyDto {
  @IsString()
  @IsNotEmpty()
  publicKey: string; // PEM or Base64 encoded public key from client
}

export class SendE2eeMessageDto {
  @IsUUID()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  ciphertext: string; // already encrypted by sender using recipient's public key
}
