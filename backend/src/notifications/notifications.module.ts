import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Message } from '../messages/message.entity';
import { Connection } from '../connections/connection.entity';
import { Application } from '../applications/application.entity';
import { AuditLog } from '../audit/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Connection, Application, AuditLog])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}