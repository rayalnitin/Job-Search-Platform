import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { GroupConversation } from './group-conversation.entity';
import { GroupMessage } from './group-message.entity';
import { E2eeMessage } from './e2ee-message.entity';
import { User } from '../users/user.entity';
import { MessagesService } from './messages.service';
import { GroupMessagesService } from './group-messages.service';
import { E2eeMessagesService } from './e2ee-messages.service';
import { MessagesController } from './messages.controller';
import { AuditModule } from '../audit/audit.module';
import { PkiModule } from '../pki/pki.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      GroupConversation,
      GroupMessage,
      E2eeMessage,
      User,
    ]),
    AuditModule,
    PkiModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, GroupMessagesService, E2eeMessagesService],
})
export class MessagesModule {}
