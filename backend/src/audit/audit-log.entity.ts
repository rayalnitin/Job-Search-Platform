import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AuditAction {
  // Auth
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN = 'USER_LOGIN',
  // Company & Jobs
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  JOB_CREATED = 'JOB_CREATED',
  JOB_UPDATED = 'JOB_UPDATED',
  JOB_DELETED = 'JOB_DELETED',
  // Applications
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_STATUS_UPDATED = 'APPLICATION_STATUS_UPDATED',
  // Messages
  MESSAGE_SENT = 'MESSAGE_SENT',
  // Admin
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_UNSUSPENDED = 'USER_UNSUSPENDED',
  USER_DELETED = 'USER_DELETED',
  // Password & Account
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  // Resume
  RESUME_DOWNLOADED = 'RESUME_DOWNLOADED',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ nullable: true })
  performedBy: string; // userId

  @Column({ nullable: true })
  targetId: string; // e.g. jobId, userId, applicationId

  @Column({ nullable: true })
  targetType: string; // e.g. 'Job', 'User', 'Application'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Hash chaining fields
  // SHA-256 of the previous entry's entryHash (null/'GENESIS' for first entry)
  @Column({ nullable: true, type: 'text' })
  previousHash: string;

  // SHA-256(action + performedBy + targetId + targetType + metadata + createdAt + previousHash)
  @Column({ nullable: true, type: 'text' })
  entryHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
