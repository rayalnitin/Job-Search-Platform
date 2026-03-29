import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserRole, User } from '../users/user.entity';
import {
  CreateCompanyDto,
  CreateJobDto,
  UpdateCompanyDto,
  UpdateJobDto,
} from './dto/company-job.dto';

@Controller()
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  // ── Company Endpoints ────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @Post('companies')
  createCompany(@GetUser() user: User, @Body() dto: CreateCompanyDto) {
    return this.companiesService.createCompany(user, dto);
  }

  @Get('companies')
  getAllCompanies() {
    return this.companiesService.getAllCompanies();
  }

  @Get('companies/:id')
  getCompanyById(@Param('id') id: string) {
    return this.companiesService.getCompanyById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('companies/:id')
  updateCompany(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(user, id, dto);
  }

  // ── Job Endpoints ────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('companies/:companyId/jobs')
  createJob(
    @GetUser() user: User,
    @Param('companyId') companyId: string,
    @Body() dto: CreateJobDto,
  ) {
    return this.companiesService.createJob(user, companyId, dto);
  }

  // Public job search with query params:
  // GET /jobs?keyword=engineer&location=remote&type=full-time&skill=react
  @Get('jobs')
  getAllJobs(
    @Query('keyword') keyword?: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
    @Query('locationType') locationType?: string,
    @Query('skill') skill?: string,
  ) {
    return this.companiesService.getAllJobs({
      keyword,
      location,
      type,
      locationType,
      skill,
    });
  }

  @Get('jobs/:id')
  getJobById(@Param('id') id: string) {
    return this.companiesService.getJobById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('jobs/:id')
  updateJob(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.companiesService.updateJob(user, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('jobs/:id')
  deleteJob(@GetUser() user: User, @Param('id') id: string) {
    return this.companiesService.deleteJob(user, id);
  }
}
