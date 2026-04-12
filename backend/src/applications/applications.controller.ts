import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/user.entity';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  ToggleShortlistDto,
} from './dto/application.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // POST /applications — apply to a job
  @Post()
  apply(@GetUser() user: User, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user, dto);
  }

  // GET /applications/mine — my applications
  @Get('mine')
  getMyApplications(@GetUser() user: User) {
    return this.applicationsService.getMyApplications(user);
  }

  // GET /applications/job/:jobId — all applicants for a job (recruiter/admin)
  // Optional: ?shortlisted=true to filter shortlisted only
  @Get('job/:jobId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  getApplicantsForJob(
    @GetUser() user: User,
    @Param('jobId') jobId: string,
    @Query('shortlisted') shortlisted?: string,
  ) {
    const shortlistedOnly = shortlisted === 'true';
    return this.applicationsService.getApplicantsForJob(
      user,
      jobId,
      shortlistedOnly,
    );
  }

  // GET /applications/:id — single application detail
  @Get(':id')
  getApplicationById(@GetUser() user: User, @Param('id') id: string) {
    return this.applicationsService.getApplicationById(user, id);
  }

  // PATCH /applications/:id/status — update status (recruiter/admin)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  updateStatus(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user, id, dto);
  }

  // PATCH /applications/:id/shortlist — toggle shortlist (recruiter/admin)
  @Patch(':id/shortlist')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  toggleShortlist(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: ToggleShortlistDto,
  ) {
    return this.applicationsService.toggleShortlist(user, id, dto);
  }
}
