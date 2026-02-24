import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Resume } from './resume.entity';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Resume]), MulterModule.register()],
  providers: [ResumeService],
  controllers: [ResumeController],
  exports: [TypeOrmModule],
})
export class ResumeModule {}
