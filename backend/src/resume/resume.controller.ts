import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IsString } from 'class-validator';
import type { Response } from 'express';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

class DownloadResumeDto {
  @IsString()
  otpCode: string;
}

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  // POST /resume/upload
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadResume(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resumeService.uploadResume(user, file);
  }

  // GET /resume
  @Get()
  getMyResumes(@CurrentUser() user: User) {
    return this.resumeService.getMyResumes(user);
  }

  // POST /resume/request-download-otp/:id
  // Step 1: request an OTP before downloading a resume
  @Post('request-download-otp/:id')
  requestDownloadOtp(@CurrentUser() user: User, @Param('id') id: string) {
    return this.resumeService.requestDownloadOtp(user, id);
  }

  // POST /resume/download/:id
  // Step 2: provide OTP code in body to actually download the resume
  @Post('download/:id')
  async downloadResume(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: DownloadResumeDto,
    @Res() res: Response,
  ) {
    const file = await this.resumeService.downloadResume(user, id, dto.otpCode);

    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'X-Integrity-Verified': String(file.integrity.verified),
      'X-Integrity-Note': file.integrity.note,
      'X-File-Hash': file.integrity.fileHash ?? '',
    });
    res.send(file.buffer);
  }

  // DELETE /resume/:id
  @Delete(':id')
  deleteResume(@CurrentUser() user: User, @Param('id') id: string) {
    return this.resumeService.deleteResume(user, id);
  }

  // PATCH /resume/set-active/:id
  @Patch('set-active/:id')
  setActiveResume(@CurrentUser() user: User, @Param('id') id: string) {
    return this.resumeService.setActiveResume(user, id);
  }
}
