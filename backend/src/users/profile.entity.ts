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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
