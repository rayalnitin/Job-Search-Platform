import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditAction, AuditLog } from '../audit/audit-log.entity';
import { Application } from '../applications/application.entity';
import { Connection, ConnectionStatus } from '../connections/connection.entity';
import { Message } from '../messages/message.entity';
import { User, UserRole } from '../users/user.entity';

export type NotificationType =
  | 'message'
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_rejected'
  | 'application_status'
  | 'application_received'
  | 'account';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  link: string;
  meta?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async getNotifications(user: User, since?: string, limit = 25) {
    const sinceDate = since ? new Date(since) : null;

    const [
      messageNotifications,
      connectionNotifications,
      applicationNotifications,
      accountNotifications,
    ] = await Promise.all([
      this.getMessageNotifications(user, sinceDate),
      this.getConnectionNotifications(user, sinceDate),
      this.getApplicationNotifications(user, sinceDate),
      this.getAccountNotifications(user, sinceDate),
    ]);

    const items = [
      ...messageNotifications,
      ...connectionNotifications,
      ...applicationNotifications,
      ...accountNotifications,
    ]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .slice(0, limit);

    return {
      items,
      serverTime: new Date().toISOString(),
    };
  }

  private async getMessageNotifications(
    user: User,
    sinceDate: Date | null,
  ): Promise<NotificationItem[]> {
    const messages = await this.messageRepository.find({
      where: {
        receiver: { id: user.id },
        isRead: false,
      },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });

    return messages
      .filter((message) => this.isAfterSince(message.createdAt, sinceDate))
      .map((message) => ({
        id: `message:${message.id}`,
        type: 'message',
        title: 'New message',
        message: `${message.sender.email} sent you a message.`,
        createdAt: message.createdAt.toISOString(),
        link: '/messages',
        meta: {
          senderId: message.sender.id,
          senderEmail: message.sender.email,
        },
      }));
  }

  private async getConnectionNotifications(
    user: User,
    sinceDate: Date | null,
  ): Promise<NotificationItem[]> {
    const pendingRequests = await this.connectionRepository.find({
      where: {
        receiver: { id: user.id },
        status: ConnectionStatus.PENDING,
      },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });

    const outgoingConnections = await this.connectionRepository.find({
      where: {
        requester: { id: user.id },
        status: In([ConnectionStatus.ACCEPTED, ConnectionStatus.REJECTED]),
      },
      relations: ['receiver'],
      order: { updatedAt: 'DESC' },
    });

    const incomingItems = pendingRequests
      .filter((connection) =>
        this.isAfterSince(connection.createdAt, sinceDate),
      )
      .map((connection) => ({
        id: `connection-request:${connection.id}`,
        type: 'connection_request' as const,
        title: 'Connection request',
        message: `${connection.requester.email} sent you a connection request.`,
        createdAt: connection.createdAt.toISOString(),
        link: '/network',
        meta: {
          requesterId: connection.requester.id,
          requesterEmail: connection.requester.email,
        },
      }));

    const outgoingItems = outgoingConnections
      .filter((connection) =>
        this.isAfterSince(connection.updatedAt, sinceDate),
      )
      .map((connection) => ({
        id: `connection-${connection.status}:${connection.id}`,
        type:
          connection.status === ConnectionStatus.ACCEPTED
            ? ('connection_accepted' as const)
            : ('connection_rejected' as const),
        title:
          connection.status === ConnectionStatus.ACCEPTED
            ? 'Connection accepted'
            : 'Connection rejected',
        message:
          connection.status === ConnectionStatus.ACCEPTED
            ? `${connection.receiver.email} accepted your connection request.`
            : `${connection.receiver.email} rejected your connection request.`,
        createdAt: connection.updatedAt.toISOString(),
        link: '/network',
        meta: {
          receiverId: connection.receiver.id,
          receiverEmail: connection.receiver.email,
        },
      }));

    return [...incomingItems, ...outgoingItems];
  }

  private async getApplicationNotifications(
    user: User,
    sinceDate: Date | null,
  ): Promise<NotificationItem[]> {
    const applicantStatusLogs = await this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.action = :action', {
        action: AuditAction.APPLICATION_STATUS_UPDATED,
      })
      .andWhere(`audit.metadata ->> 'applicantId' = :userId`, {
        userId: user.id,
      })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();

    const applicantItems = applicantStatusLogs
      .filter((log) => this.isAfterSince(log.createdAt, sinceDate))
      .map((log) => {
        const metadata = log.metadata || {};
        const toStatus = metadata.to || 'updated';
        const jobTitle = metadata.jobTitle || 'your application';

        return {
          id: `application-status:${log.id}`,
          type: 'application_status' as const,
          title: 'Application updated',
          message: `Your application for ${jobTitle} was updated to ${toStatus}.`,
          createdAt: log.createdAt.toISOString(),
          link: '/applications',
          meta: metadata,
        };
      });

    const recruiterApplications =
      user.role === UserRole.RECRUITER || user.role === UserRole.ADMIN
        ? await this.applicationRepository
            .createQueryBuilder('application')
            .leftJoinAndSelect('application.job', 'job')
            .leftJoinAndSelect('application.applicant', 'applicant')
            .leftJoin('job.postedBy', 'postedBy')
            .where('postedBy.id = :userId', { userId: user.id })
            .orderBy('application.appliedAt', 'DESC')
            .getMany()
        : [];

    const recruiterItems = recruiterApplications
      .filter((application) =>
        this.isAfterSince(application.appliedAt, sinceDate),
      )
      .map((application) => ({
        id: `application-received:${application.id}`,
        type: 'application_received' as const,
        title: 'New application',
        message: `${application.applicant.email} applied to ${application.job.title}.`,
        createdAt: application.appliedAt.toISOString(),
        link: '/recruiter/applicants',
        meta: {
          applicationId: application.id,
          jobId: application.job.id,
          jobTitle: application.job.title,
          applicantId: application.applicant.id,
          applicantEmail: application.applicant.email,
        },
      }));

    return [...applicantItems, ...recruiterItems];
  }

  private async getAccountNotifications(
    user: User,
    sinceDate: Date | null,
  ): Promise<NotificationItem[]> {
    const accountLogs = await this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.targetId = :userId', { userId: user.id })
      .andWhere('audit.action IN (:...actions)', {
        actions: [
          AuditAction.USER_SUSPENDED,
          AuditAction.USER_UNSUSPENDED,
          AuditAction.PASSWORD_RESET,
          AuditAction.ACCOUNT_DELETED,
        ],
      })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();

    return accountLogs
      .filter((log) => this.isAfterSince(log.createdAt, sinceDate))
      .map((log) => {
        const messages: Record<
          AuditAction,
          { title: string; message: string }
        > = {
          [AuditAction.USER_SUSPENDED]: {
            title: 'Account update',
            message: 'Your account was suspended by an administrator.',
          },
          [AuditAction.USER_UNSUSPENDED]: {
            title: 'Account update',
            message: 'Your account was reactivated by an administrator.',
          },
          [AuditAction.USER_DELETED]: {
            title: 'Account update',
            message: 'Your account was deleted by an administrator.',
          },
          [AuditAction.PASSWORD_RESET]: {
            title: 'Security update',
            message: 'Your password was reset.',
          },
          [AuditAction.ACCOUNT_DELETED]: {
            title: 'Account update',
            message: 'Your account was deleted.',
          },
          [AuditAction.USER_REGISTERED]: {
            title: 'Account update',
            message: 'Your account was registered.',
          },
          [AuditAction.USER_LOGIN]: {
            title: 'Account update',
            message: 'A login was detected on your account.',
          },
          [AuditAction.COMPANY_CREATED]: {
            title: 'Account update',
            message: 'A company profile was created.',
          },
          [AuditAction.COMPANY_UPDATED]: {
            title: 'Account update',
            message: 'A company profile was updated.',
          },
          [AuditAction.JOB_CREATED]: {
            title: 'Account update',
            message: 'A job was posted.',
          },
          [AuditAction.JOB_UPDATED]: {
            title: 'Account update',
            message: 'A job was updated.',
          },
          [AuditAction.JOB_DELETED]: {
            title: 'Account update',
            message: 'A job was deleted.',
          },
          [AuditAction.APPLICATION_SUBMITTED]: {
            title: 'Account update',
            message: 'An application was submitted.',
          },
          [AuditAction.APPLICATION_STATUS_UPDATED]: {
            title: 'Account update',
            message: 'An application status was updated.',
          },
          [AuditAction.MESSAGE_SENT]: {
            title: 'Account update',
            message: 'A message was sent.',
          },
          [AuditAction.RESUME_DOWNLOADED]: {
            title: 'Account update',
            message: 'A resume was downloaded.',
          },
          [AuditAction.PROFILE_VIEWED]: {
            title: 'Account update',
            message: 'Your profile was viewed.',
          },
        };

        return {
          id: `account:${log.id}`,
          type: 'account' as const,
          title: messages[log.action].title,
          message: messages[log.action].message,
          createdAt: log.createdAt.toISOString(),
          link: '/profile',
          meta: log.metadata || {},
        };
      });
  }

  private isAfterSince(date: Date, sinceDate: Date | null): boolean {
    if (!sinceDate) {
      return true;
    }

    return new Date(date).getTime() > sinceDate.getTime();
  }
}
