import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/application.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/user.entity';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  // POST /applications — apply to a job
  @Post()
  apply(@GetUser() user: User, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user, dto);
  }

  // GET /applications/mine — my applications with full status history
  @Get('mine')
  getMyApplications(@GetUser() user: User) {
    return this.applicationsService.getMyApplications(user);
  }

  // GET /applications/job/:jobId — all applicants for a job (recruiter/admin)
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @Get('job/:jobId')
  getApplicantsForJob(@GetUser() user: User, @Param('jobId') jobId: string) {
    return this.applicationsService.getApplicantsForJob(user, jobId);
  }

  // GET /applications/:id — single application detail
  @Get(':id')
  getApplicationById(@GetUser() user: User, @Param('id') id: string) {
    return this.applicationsService.getApplicationById(user, id);
  }

  // PATCH /applications/:id/status — update status (recruiter/admin)
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user, id, dto);
  }
}
