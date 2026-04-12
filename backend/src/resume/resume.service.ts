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
import { PkiService } from '../pki/pki.service';
import {
  signData,
  verifySignature,
  hashBuffer,
} from '../common/utils/pki.util';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/otp.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    private pkiService: PkiService,
    private otpService: OtpService,
    private auditService: AuditService,
  ) {}

  // ── Upload resume ─────────────────────────────────────────────

  async uploadResume(user: User, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and DOCX files are allowed');
    }

    const fileHash = hashBuffer(file.buffer);
    const signature = signData(fileHash, this.pkiService.getPrivateKey());
    const encryptedData = encryptFile(file.buffer);

    const resume = this.resumeRepository.create({
      user,
      filename: file.originalname,
      encryptedData,
      isActive: true,
      fileHash,
      signature,
    });

    await this.resumeRepository.save(resume);

    return {
      message: 'Resume uploaded successfully',
      resume: {
        id: resume.id,
        filename: resume.filename,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
        fileHash,
        integrityVerified: true,
      },
    };
  }

  // ── List resumes ──────────────────────────────────────────────

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
      fileHash: r.fileHash ?? null,
      hasPkiSignature: !!r.signature,
    }));
  }

  // ── Request OTP for resume download — step 1 ─────────────────

  async requestDownloadOtp(user: User, resumeId: string) {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['user'],
    });
    if (!resume) throw new NotFoundException('Resume not found');

    if (resume.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    await this.otpService.generateOtp(user, OtpPurpose.RESUME_DOWNLOAD);

    return {
      message: 'OTP sent. Use it with POST /resume/download/:id to download.',
    };
  }

  // ── Download resume (OTP required) — step 2 ──────────────────

  async downloadResume(user: User, resumeId: string, otpCode: string) {
    const isValid = await this.otpService.verifyOtp(
      user,
      otpCode,
      OtpPurpose.RESUME_DOWNLOAD,
    );
    if (!isValid) throw new BadRequestException('Invalid or expired OTP');

    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['user'],
    });
    if (!resume) throw new NotFoundException('Resume not found');

    if (resume.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const decryptedData = decryptFile(resume.encryptedData);

    // PKI integrity verification
    let integrityVerified = false;
    let integrityNote = 'No PKI signature on record for this resume.';

    if (resume.signature && resume.fileHash) {
      const recomputedHash = hashBuffer(decryptedData);
      if (recomputedHash !== resume.fileHash) {
        integrityNote =
          'WARNING: File hash mismatch. File may have been tampered with.';
      } else {
        integrityVerified = verifySignature(
          resume.fileHash,
          resume.signature,
          this.pkiService.getPublicKey(),
        );
        integrityNote = integrityVerified
          ? 'RSA-SHA256 signature verified. File integrity confirmed.'
          : 'WARNING: RSA signature verification failed.';
      }
    }

    await this.auditService.log(
      AuditAction.RESUME_DOWNLOADED,
      user.id,
      resume.id,
      'Resume',
      { filename: resume.filename, integrityVerified },
    );

    return {
      filename: resume.filename,
      buffer: decryptedData,
      mimetype: resume.filename.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      integrity: {
        verified: integrityVerified,
        fileHash: resume.fileHash ?? null,
        note: integrityNote,
      },
    };
  }

  // ── Delete resume ─────────────────────────────────────────────

  async deleteResume(user: User, resumeId: string) {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['user'],
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.user.id !== user.id)
      throw new ForbiddenException('Access denied');

    await this.resumeRepository.remove(resume);
    return { message: 'Resume deleted successfully' };
  }

  // ── Set active resume ─────────────────────────────────────────

  async setActiveResume(user: User, resumeId: string) {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['user'],
    });
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.user.id !== user.id)
      throw new ForbiddenException('Access denied');

    await this.resumeRepository.update(
      { user: { id: user.id } },
      { isActive: false },
    );
    resume.isActive = true;
    await this.resumeRepository.save(resume);

    return { message: 'Active resume updated successfully' };
  }
}
