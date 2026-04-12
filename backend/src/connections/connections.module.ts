import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from './connection.entity';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Connection, User])],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService], // exported so UsersModule can use it later for privacy checks
})
export class ConnectionsModule {}
