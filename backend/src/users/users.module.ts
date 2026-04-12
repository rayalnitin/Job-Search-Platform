import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Profile } from './profile.entity';
import { ProfileView } from './profile-view.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Connection } from '../connections/connection.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, ProfileView, Connection]),
    AuditModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
