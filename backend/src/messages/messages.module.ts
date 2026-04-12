import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { User } from '../users/user.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { AuditModule } from '../audit/audit.module';
import { PkiModule } from '../pki/pki.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User]), AuditModule, PkiModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
