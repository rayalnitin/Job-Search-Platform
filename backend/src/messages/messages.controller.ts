import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/user.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('test')
  test() {
    return 'Messages working';
  }

  // POST /messages — send an encrypted message
  @Post()
  sendMessage(@GetUser() user: User, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(user, dto);
  }

  // GET /messages — inbox: list all conversations with last message preview
  @Get()
  getInbox(@GetUser() user: User) {
    return this.messagesService.getInbox(user);
  }

  // GET /messages/:userId — full conversation with a specific user (decrypted)
  @Get(':userId')
  getConversation(@GetUser() user: User, @Param('userId') userId: string) {
    return this.messagesService.getConversation(user, userId);
  }
}
