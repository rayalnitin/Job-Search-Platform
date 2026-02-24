import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from './resume.entity';
import { User, UserRole } from '../users/user.entity';
import { encryptFile, decryptFile } from '../common/utils/crypto.util';

@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
  ) {}

  async uploadResume(user: User, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and DOCX files are allowed');
    }

    // Encrypt file buffer
    const encryptedData = encryptFile(file.buffer);

    const resume = this.resumeRepository.create({
      user,
      filename: file.originalname,
      encryptedData,
      isActive: true,
    });

    await this.resumeRepository.save(resume);

    return {
      message: 'Resume uploaded successfully',
      resume: {
        id: resume.id,
        filename: resume.filename,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
      },
    };
  }

  async getMyResumes(user: User) {
    const resumes = await this.resumeRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    return resumes.map((r) => ({
      id: r.id,
      filename: r.filename,
      isActive: r.isActive,
      createdAt: r.createdAt,
    }));
  }

  async downloadResume(user: User, resumeId: string) {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['user'],
    });

    if (!resume) throw new NotFoundException('Resume not found');

    // Only owner or admin can download
    if (resume.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const decryptedData = decryptFile(resume.encryptedData);

    return {
      filename: resume.filename,
      buffer: decryptedData,
      mimetype: resume.filename.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }

  async deleteResume(user: User, resumeId: string) {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['user'],
    });

    if (!resume) throw new NotFoundException('Resume not found');

    if (resume.user.id !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    await this.resumeRepository.remove(resume);

    return { message: 'Resume deleted successfully' };
  }

  async setActiveResume(user: User, resumeId: string) {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['user'],
    });

    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.user.id !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    // Set all resumes inactive first
    await this.resumeRepository.update(
      { user: { id: user.id } },
      { isActive: false },
    );

    // Set selected resume as active
    resume.isActive = true;
    await this.resumeRepository.save(resume);

    return { message: 'Active resume updated successfully' };
  }
}
