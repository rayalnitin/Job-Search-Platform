import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { Job } from './job.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Job]), AuditModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService], // exported for ApplicationsModule to use
})
export class CompaniesModule {}
