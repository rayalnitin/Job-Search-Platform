import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  // AES-256-CBC encrypted content stored as hex string
  @Column({ type: 'text' })
  encryptedContent: string;

  // IV stored separately as hex string
  @Column({ type: 'text' })
  iv: string;

  // PKI: SHA-256 hash of the original plaintext content
  @Column({ nullable: true, type: 'text' })
  contentHash: string;

  // PKI: RSA-SHA256 signature of contentHash, signed with server private key
  // Proves the message was created by this server and not altered in the DB
  @Column({ nullable: true, type: 'text' })
  signature: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
