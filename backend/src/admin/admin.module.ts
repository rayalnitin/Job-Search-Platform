import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Profile } from '../users/profile.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile]), AuditModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
