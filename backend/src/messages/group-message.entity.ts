import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { GroupConversation } from './group-conversation.entity';

@Entity('group_messages')
export class GroupMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GroupConversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: GroupConversation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  // AES-256-CBC encrypted content stored as hex string
  @Column({ type: 'text' })
  encryptedContent: string;

  // IV stored separately as hex string
  @Column({ type: 'text' })
  iv: string;

  // PKI: SHA-256 hash of original plaintext
  @Column({ nullable: true, type: 'text' })
  contentHash: string;

  // PKI: RSA-SHA256 signature of contentHash signed with server private key
  @Column({ nullable: true, type: 'text' })
  signature: string;

  @CreateDateColumn()
  createdAt: Date;
}
