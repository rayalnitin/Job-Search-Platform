import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Resume } from './resume.entity';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { PkiModule } from '../pki/pki.module';
import { OtpModule } from '../otp/otp.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resume]),
    MulterModule.register({ storage: undefined }),
    PkiModule,
    OtpModule,
    AuditModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
