import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
    // Store uploaded files in memory buffer (same pattern as resume upload)
    MulterModule.register({ storage: memoryStorage() }),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
