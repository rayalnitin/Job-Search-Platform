import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { GroupMessagesService } from './group-messages.service';
import { E2eeMessagesService } from './e2ee-messages.service';
import { SendMessageDto } from './dto/message.dto';
import {
  CreateGroupDto,
  SendGroupMessageDto,
  AddParticipantDto,
} from './dto/group-message.dto';
import {
  RegisterPublicKeyDto,
  SendE2eeMessageDto,
} from './dto/e2ee-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private groupMessagesService: GroupMessagesService,
    private e2eeMessagesService: E2eeMessagesService,
  ) {}

  @Get('test')
  test() {
    return 'Messages working';
  }

  // ── One-to-one server-side encrypted (existing, untouched) ────

  @Post()
  sendMessage(@GetUser() user: User, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(user, dto);
  }

  @Get()
  getInbox(@GetUser() user: User) {
    return this.messagesService.getInbox(user);
  }

  // ── Group messaging (additive) ────────────────────────────────

  @Post('groups')
  createGroup(@GetUser() user: User, @Body() dto: CreateGroupDto) {
    return this.groupMessagesService.createGroup(user, dto);
  }

  @Get('groups')
  getMyGroups(@GetUser() user: User) {
    return this.groupMessagesService.getMyGroups(user);
  }

  @Post('groups/:id/participants')
  addParticipant(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.groupMessagesService.addParticipant(user, id, dto);
  }

  @Delete('groups/:id/participants/:userId')
  removeParticipant(
    @GetUser() user: User,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.groupMessagesService.removeParticipant(user, id, userId);
  }

  @Post('groups/:id/send')
  sendGroupMessage(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: SendGroupMessageDto,
  ) {
    return this.groupMessagesService.sendGroupMessage(user, id, dto);
  }

  @Get('groups/:id')
  getGroupConversation(@GetUser() user: User, @Param('id') id: string) {
    return this.groupMessagesService.getGroupConversation(user, id);
  }

  // ── E2EE messaging (additive) ─────────────────────────────────

  // POST /messages/e2ee/keys — register client public key
  @Post('e2ee/keys')
  registerPublicKey(@GetUser() user: User, @Body() dto: RegisterPublicKeyDto) {
    return this.e2eeMessagesService.registerPublicKey(user, dto);
  }

  // GET /messages/e2ee/keys/:userId — fetch a user's public key
  // so sender can encrypt a message for them client-side
  @Get('e2ee/keys/:userId')
  getPublicKey(@Param('userId') userId: string) {
    return this.e2eeMessagesService.getPublicKey(userId);
  }

  // GET /messages/e2ee — E2EE inbox (conversation previews)
  @Get('e2ee')
  getE2eeInbox(@GetUser() user: User) {
    return this.e2eeMessagesService.getE2eeInbox(user);
  }

  // POST /messages/e2ee — send E2EE message (ciphertext only)
  @Post('e2ee')
  sendE2eeMessage(@GetUser() user: User, @Body() dto: SendE2eeMessageDto) {
    return this.e2eeMessagesService.sendE2eeMessage(user, dto);
  }

  // GET /messages/e2ee/:userId — fetch E2EE conversation (raw ciphertext)
  @Get('e2ee/:userId')
  getE2eeConversation(@GetUser() user: User, @Param('userId') userId: string) {
    return this.e2eeMessagesService.getE2eeConversation(user, userId);
  }

  @Get(':userId')
  getConversation(
    @GetUser() user: User,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.messagesService.getConversation(user, userId);
  }
}
