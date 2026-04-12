import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // GET /admin/logs
  // Returns all audit log entries in chronological order (oldest first)
  @Get('logs')
  async getLogs() {
    return this.auditService.getAllLogs();
  }

  // GET /admin/logs/verify
  // Walks the entire hash chain and reports whether the log has been tampered with
  @Get('logs/verify')
  async verifyLogs() {
    return this.auditService.verifyChain();
  }
}
