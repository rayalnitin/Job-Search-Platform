import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Job } from '../companies/job.entity';
import { Resume } from '../resume/resume.entity';

export enum ApplicationStatus {
  APPLIED = 'applied',
  REVIEWED = 'reviewed',
  INTERVIEWED = 'interviewed',
  REJECTED = 'rejected',
  OFFER = 'offer',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicant_id' })
  applicant: User;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => Resume, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ type: 'text', nullable: true })
  coverNote: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status: ApplicationStatus;

  // Stores full status history: [{status, changedAt, changedBy}]
  @Column({ type: 'jsonb', default: [] })
  statusHistory: {
    status: ApplicationStatus;
    changedAt: string;
    changedBy: string;
  }[];

  // Recruiter notes (only visible to recruiter/admin)
  @Column({ type: 'text', nullable: true })
  recruiterNotes: string;

  // Shortlisting flag (set by recruiter/admin)
  @Column({ default: false })
  isShortlisted: boolean;

  @CreateDateColumn()
  appliedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
