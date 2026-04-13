import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FieldPrivacy {
  PUBLIC = 'public',
  CONNECTIONS = 'connections',
  PRIVATE = 'private',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  headline: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true, type: 'text' })
  education: string;

  @Column({ nullable: true, type: 'text' })
  experience: string;

  @Column({ nullable: true, type: 'text' })
  skills: string;

  // ── Profile picture ───────────────────────────────────────────
  // Stored as raw bytes — not encrypted (avatars are public-facing)
  // Fetch via GET /users/avatar/:userId

  @Column({ type: 'bytea', nullable: true })
  avatarData: Buffer | null;

  @Column({ type: 'text', nullable: true })
  avatarMimeType: string | null; // e.g. image/jpeg, image/png, image/webp

  // ── Per-field privacy controls ────────────────────────────────

  @Column({
    type: 'enum',
    enum: FieldPrivacy,
    default: FieldPrivacy.PUBLIC,
  })
  headlinePrivacy: FieldPrivacy;

  @Column({
    type: 'enum',
    enum: FieldPrivacy,
    default: FieldPrivacy.PUBLIC,
  })
  locationPrivacy: FieldPrivacy;

  @Column({
    type: 'enum',
    enum: FieldPrivacy,
    default: FieldPrivacy.PUBLIC,
  })
  bioPrivacy: FieldPrivacy;

  @Column({
    type: 'enum',
    enum: FieldPrivacy,
    default: FieldPrivacy.PUBLIC,
  })
  educationPrivacy: FieldPrivacy;

  @Column({
    type: 'enum',
    enum: FieldPrivacy,
    default: FieldPrivacy.PUBLIC,
  })
  experiencePrivacy: FieldPrivacy;

  @Column({
    type: 'enum',
    enum: FieldPrivacy,
    default: FieldPrivacy.PUBLIC,
  })
  skillsPrivacy: FieldPrivacy;

  // ── Profile viewer opt-out ────────────────────────────────────

  @Column({ default: false })
  optOutOfViewers: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
