import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('e2ee_messages')
export class E2eeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  // Ciphertext encrypted by sender using recipient's public key (client-side)
  // Server never decrypts this — true E2EE
  @Column({ type: 'text' })
  ciphertext: string;

  // PKI: SHA-256 hash of the ciphertext (not plaintext — server never sees plaintext)
  // Signed by server to prove ciphertext was not tampered with in the DB
  @Column({ nullable: true, type: 'text' })
  ciphertextHash: string;

  // PKI: RSA-SHA256 signature of ciphertextHash
  @Column({ nullable: true, type: 'text' })
  signature: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
