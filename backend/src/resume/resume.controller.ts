import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  uploadResume(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.resumeService.uploadResume(user, file);
  }

  @Get()
  getMyResumes(@CurrentUser() user: User) {
    return this.resumeService.getMyResumes(user);
  }

  @Get('download/:id')
  async downloadResume(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.resumeService.downloadResume(user, id);
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    res.send(file.buffer);
  }

  @Delete(':id')
  deleteResume(@CurrentUser() user: User, @Param('id') id: string) {
    return this.resumeService.deleteResume(user, id);
  }

  @Patch('set-active/:id')
  setActiveResume(@CurrentUser() user: User, @Param('id') id: string) {
    return this.resumeService.setActiveResume(user, id);
  }
}
