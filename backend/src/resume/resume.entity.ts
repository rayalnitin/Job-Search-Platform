import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  filename: string;

  @Column({ type: 'bytea' })
  encryptedData: Buffer;

  @Column({ default: false })
  isActive: boolean;

  // PKI: SHA-256 hash of the original (pre-encryption) file buffer
  // Stored so we can re-verify integrity on download without re-decrypting first
  @Column({ nullable: true, type: 'text' })
  fileHash: string;

  // PKI: RSA-SHA256 signature of fileHash, signed with server private key
  // Stored as base64 string
  @Column({ nullable: true, type: 'text' })
  signature: string;

  @CreateDateColumn()
  createdAt: Date;
}
