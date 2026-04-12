import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/user.entity';
import { SendConnectionRequestDto } from './dto/connection.dto';

@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  // POST /connections/request — send a connection request
  @Post('request')
  sendRequest(@GetUser() user: User, @Body() dto: SendConnectionRequestDto) {
    return this.connectionsService.sendRequest(user, dto);
  }

  // GET /connections — list my accepted connections
  @Get()
  getMyConnections(@GetUser() user: User) {
    return this.connectionsService.getMyConnections(user);
  }

  // GET /connections/pending — list incoming pending requests
  @Get('pending')
  getPendingRequests(@GetUser() user: User) {
    return this.connectionsService.getPendingRequests(user);
  }

  // GET /connections/graph — my limited connection graph
  @Get('graph')
  getConnectionGraph(@GetUser() user: User) {
    return this.connectionsService.getConnectionGraph(user);
  }

  // PATCH /connections/:id/accept — accept a request
  @Patch(':id/accept')
  acceptRequest(@GetUser() user: User, @Param('id') id: string) {
    return this.connectionsService.acceptRequest(user, id);
  }

  // PATCH /connections/:id/reject — reject a request
  @Patch(':id/reject')
  rejectRequest(@GetUser() user: User, @Param('id') id: string) {
    return this.connectionsService.rejectRequest(user, id);
  }

  // DELETE /connections/:id — remove an accepted connection
  @Delete(':id')
  removeConnection(@GetUser() user: User, @Param('id') id: string) {
    return this.connectionsService.removeConnection(user, id);
  }
}
