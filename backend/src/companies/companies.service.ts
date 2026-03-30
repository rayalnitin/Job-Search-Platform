import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { Job, JobStatus } from './job.entity';
import { User, UserRole } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
import {
  CreateCompanyDto,
  CreateJobDto,
  UpdateCompanyDto,
  UpdateJobDto,
} from './dto/company-job.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private auditService: AuditService,
  ) {}

  // ── Companies ────────────────────────────────────────────────

  async createCompany(user: User, dto: CreateCompanyDto) {
    const company = this.companyRepository.create({
      ...dto,
      createdBy: user,
    });
    await this.companyRepository.save(company);

    await this.auditService.log(
      AuditAction.COMPANY_CREATED,
      user.id,
      company.id,
      'Company',
      { name: company.name },
    );

    return { message: 'Company created successfully', company };
  }

  async getAllCompanies() {
    return this.companyRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCompanyById(id: string) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy', 'jobs'],
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompany(user: User, id: string, dto: UpdateCompanyDto) {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!company) throw new NotFoundException('Company not found');

    // Only owner or admin can update
    if (company.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(company, dto);
    await this.companyRepository.save(company);

    await this.auditService.log(
      AuditAction.COMPANY_UPDATED,
      user.id,
      company.id,
      'Company',
      { changes: dto },
    );

    return { message: 'Company updated successfully', company };
  }

  // ── Jobs ─────────────────────────────────────────────────────

  async createJob(user: User, companyId: string, dto: CreateJobDto) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['createdBy'],
    });
    if (!company) throw new NotFoundException('Company not found');

    // Only company owner or admin can post jobs
    if (company.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the company owner can post jobs');
    }

    const job = this.jobRepository.create({
      ...dto,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      company,
      postedBy: user,
    });
    await this.jobRepository.save(job);

    await this.auditService.log(
      AuditAction.JOB_CREATED,
      user.id,
      job.id,
      'Job',
      { title: job.title, companyId },
    );

    return { message: 'Job posted successfully', job };
  }

  async getAllJobs(query: {
    keyword?: string;
    location?: string;
    type?: string;
    locationType?: string;
    skill?: string;
  }) {
    const qb = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('job.postedBy', 'postedBy')
      .where('job.status = :status', { status: JobStatus.ACTIVE });

    if (query.keyword) {
      qb.andWhere(
        '(job.title ILIKE :keyword OR job.description ILIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }

    if (query.location) {
      qb.andWhere('job.location ILIKE :location', {
        location: `%${query.location}%`,
      });
    }

    if (query.type) {
      qb.andWhere('job.type = :type', { type: query.type });
    }

    if (query.locationType) {
      qb.andWhere('job.locationType = :locationType', {
        locationType: query.locationType,
      });
    }

    if (query.skill) {
      qb.andWhere(':skill = ANY(job.skills)', { skill: query.skill });
    }

    qb.orderBy('job.createdAt', 'DESC');

    return qb.getMany();
  }

  async getJobById(id: string) {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['company', 'postedBy'],
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async updateJob(user: User, id: string, dto: UpdateJobDto) {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['postedBy'],
    });
    if (!job) throw new NotFoundException('Job not found');

    if (job.postedBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(job, {
      ...dto,
      deadline: dto.deadline ? new Date(dto.deadline) : job.deadline,
    });
    await this.jobRepository.save(job);

    await this.auditService.log(
      AuditAction.JOB_UPDATED,
      user.id,
      job.id,
      'Job',
      { changes: dto },
    );

    return { message: 'Job updated successfully', job };
  }

  async deleteJob(user: User, id: string) {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['postedBy'],
    });
    if (!job) throw new NotFoundException('Job not found');

    if (job.postedBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    await this.jobRepository.remove(job);

    await this.auditService.log(
      AuditAction.JOB_DELETED,
      user.id,
      id,
      'Job',
      { title: job.title },
    );

    return { message: 'Job deleted successfully' };
  }
}
