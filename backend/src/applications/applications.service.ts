import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Application, ApplicationStatus } from './application.entity';
import { User, UserRole } from '../users/user.entity';
import { Profile } from '../users/profile.entity';
import { Job } from '../companies/job.entity';
import { Resume } from '../resume/resume.entity';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  ToggleShortlistDto,
} from './dto/application.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private auditService: AuditService,
  ) {}

  // ── Apply to a job ───────────────────────────────────────────

  async apply(user: User, dto: CreateApplicationDto) {
    const job = await this.jobRepository.findOne({
      where: { id: dto.jobId },
      relations: ['company', 'postedBy'],
    });
    if (!job) throw new NotFoundException('Job not found');

    // Prevent duplicate applications
    const existing = await this.applicationRepository.findOne({
      where: { applicant: { id: user.id }, job: { id: dto.jobId } },
    });
    if (existing)
      throw new ConflictException('You have already applied to this job');

    // Optionally attach a resume
    let resume: Resume | null = null;
    if (dto.resumeId) {
      resume = await this.resumeRepository.findOne({
        where: { id: dto.resumeId, user: { id: user.id } },
      });
      if (!resume) throw new NotFoundException('Resume not found');
    }

    const initialHistory = [
      {
        status: ApplicationStatus.APPLIED,
        changedAt: new Date().toISOString(),
        changedBy: user.id,
      },
    ];

    const application = this.applicationRepository.create({
      applicant: user,
      job,
      resume: resume ?? undefined,
      coverNote: dto.coverNote,
      status: ApplicationStatus.APPLIED,
      statusHistory: initialHistory,
    });

    await this.applicationRepository.save(application);

    await this.auditService.log(
      AuditAction.APPLICATION_SUBMITTED,
      user.id,
      application.id,
      'Application',
      { jobId: dto.jobId, jobTitle: job.title },
    );

    return {
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        jobTitle: job.title,
        status: application.status,
        appliedAt: application.appliedAt,
      },
    };
  }

  // ── Get my applications (applicant view) ─────────────────────

  async getMyApplications(user: User) {
    const applications = await this.applicationRepository.find({
      where: { applicant: { id: user.id } },
      relations: ['job', 'job.company', 'job.postedBy', 'resume'],
      order: { appliedAt: 'DESC' },
    });

    const recruiterIds = Array.from(
      new Set(applications.map((application) => application.job.postedBy?.id).filter(Boolean)),
    );
    const recruiterProfiles = recruiterIds.length
      ? await this.profileRepository.find({
          where: { user: { id: In(recruiterIds) } },
          relations: ['user'],
        })
      : [];
    const recruiterNameMap = new Map(
      recruiterProfiles.map((profile) => [profile.user.id, profile.name || profile.user.email]),
    );

    return applications.map((app) => ({
      id: app.id,
      job: {
        id: app.job.id,
        title: app.job.title,
        company: app.job.company?.name,
      },
      recruiter: app.job.postedBy
        ? {
            id: app.job.postedBy.id,
            email: app.job.postedBy.email,
            name: recruiterNameMap.get(app.job.postedBy.id) || app.job.postedBy.email,
          }
        : null,
      status: app.status,
      statusHistory: app.statusHistory,
      coverNote: app.coverNote,
      isShortlisted: app.isShortlisted,
      resumeId: app.resume?.id ?? null,
      appliedAt: app.appliedAt,
    }));
  }

  // ── Get single application detail ────────────────────────────

  async getApplicationById(user: User, id: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['applicant', 'job', 'job.company', 'job.postedBy', 'resume'],
    });
    if (!application) throw new NotFoundException('Application not found');

    const isApplicant = application.applicant.id === user.id;
    const isRecruiterOrAdmin =
      user.role === UserRole.ADMIN || user.role === UserRole.RECRUITER;

    if (!isApplicant && !isRecruiterOrAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: application.id,
      applicant: isRecruiterOrAdmin
        ? { id: application.applicant.id, email: application.applicant.email }
        : undefined,
      job: {
        id: application.job.id,
        title: application.job.title,
        company: application.job.company?.name,
      },
      status: application.status,
      statusHistory: application.statusHistory,
      coverNote: application.coverNote,
      recruiterNotes: isRecruiterOrAdmin
        ? application.recruiterNotes
        : undefined,
      isShortlisted: application.isShortlisted,
      resumeId: application.resume?.id ?? null,
      appliedAt: application.appliedAt,
      updatedAt: application.updatedAt,
    };
  }

  // ── Get all applicants for a job (recruiter view) ────────────
  // Optional query param: ?shortlisted=true to filter only shortlisted

  async getApplicantsForJob(
    user: User,
    jobId: string,
    shortlistedOnly?: boolean,
  ) {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: ['postedBy'],
    });
    if (!job) throw new NotFoundException('Job not found');

    // Only job poster or admin can see applicants
    if (job.postedBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const whereClause: any = { job: { id: jobId } };
    if (shortlistedOnly) {
      whereClause.isShortlisted = true;
    }

    const applications = await this.applicationRepository.find({
      where: whereClause,
      relations: ['applicant', 'resume'],
      order: { appliedAt: 'DESC' },
    });

    const applicantIds = Array.from(
      new Set(applications.map((application) => application.applicant.id)),
    );
    const applicantProfiles = applicantIds.length
      ? await this.profileRepository.find({
          where: { user: { id: In(applicantIds) } },
          relations: ['user'],
        })
      : [];
    const applicantNameMap = new Map(
      applicantProfiles.map((profile) => [profile.user.id, profile.name || profile.user.email]),
    );

    return applications.map((app) => ({
      id: app.id,
      applicant: {
        id: app.applicant.id,
        email: app.applicant.email,
        name: applicantNameMap.get(app.applicant.id) || app.applicant.email,
      },
      status: app.status,
      statusHistory: app.statusHistory,
      coverNote: app.coverNote,
      recruiterNotes: app.recruiterNotes,
      isShortlisted: app.isShortlisted,
      resumeId: app.resume?.id ?? null,
      appliedAt: app.appliedAt,
    }));
  }

  // ── Update application status (recruiter/admin only) ─────────

  async updateStatus(
    user: User,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job', 'job.postedBy', 'applicant'],
    });
    if (!application) throw new NotFoundException('Application not found');

    // Only job poster or admin can update status
    if (
      application.job.postedBy.id !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    const previousStatus = application.status;

    // Append to status history
    application.statusHistory = [
      ...application.statusHistory,
      {
        status: dto.status,
        changedAt: new Date().toISOString(),
        changedBy: user.id,
      },
    ];

    application.status = dto.status;
    if (dto.recruiterNotes !== undefined) {
      application.recruiterNotes = dto.recruiterNotes;
    }

    await this.applicationRepository.save(application);

    await this.auditService.log(
      AuditAction.APPLICATION_STATUS_UPDATED,
      user.id,
      application.id,
      'Application',
      {
        jobTitle: application.job.title,
        applicantId: application.applicant.id,
        from: previousStatus,
        to: dto.status,
      },
    );

    return {
      message: 'Application status updated',
      application: {
        id: application.id,
        status: application.status,
        statusHistory: application.statusHistory,
      },
    };
  }

  // ── Toggle shortlist (recruiter/admin only) ───────────────────

  async toggleShortlist(
    user: User,
    applicationId: string,
    dto: ToggleShortlistDto,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['job', 'job.postedBy', 'applicant'],
    });
    if (!application) throw new NotFoundException('Application not found');

    // Only job poster or admin can shortlist
    if (
      application.job.postedBy.id !== user.id &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Access denied');
    }

    application.isShortlisted = dto.isShortlisted;
    await this.applicationRepository.save(application);

    return {
      message: dto.isShortlisted
        ? 'Applicant shortlisted successfully'
        : 'Applicant removed from shortlist',
      application: {
        id: application.id,
        applicantId: application.applicant.id,
        isShortlisted: application.isShortlisted,
      },
    };
  }
}
