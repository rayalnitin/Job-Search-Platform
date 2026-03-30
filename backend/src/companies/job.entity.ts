import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from '../users/user.entity';

export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract',
}

export enum JobLocationType {
  REMOTE = 'remote',
  ONSITE = 'onsite',
  HYBRID = 'hybrid',
}

export enum JobStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column('text', { array: true, default: [] })
  skills: string[];

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'enum', enum: JobType, default: JobType.FULL_TIME })
  type: JobType;

  @Column({
    type: 'enum',
    enum: JobLocationType,
    default: JobLocationType.ONSITE,
  })
  locationType: JobLocationType;

  @Column({ nullable: true })
  salaryRange: string; // e.g. "50000-80000" or "competitive"

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.ACTIVE })
  status: JobStatus;

  @ManyToOne(() => Company, (company) => company.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'posted_by' })
  postedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
