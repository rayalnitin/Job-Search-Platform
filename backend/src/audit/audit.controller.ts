import { Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  // ── Existing hash-chain endpoints (untouched) ─────────────────

  // GET /admin/logs
  @Get('logs')
  async getLogs() {
    return this.auditService.getAllLogs();
  }

  // GET /admin/logs/verify
  @Get('logs/verify')
  async verifyLogs() {
    return this.auditService.verifyChain();
  }

  // ── Blockchain endpoints (additive) ───────────────────────────

  // POST /admin/blockchain/mine
  // Seals all unsealed audit entries into a new block with proof-of-work
  @Post('blockchain/mine')
  async mineBlock() {
    return this.auditService.mineBlock();
  }

  // GET /admin/blockchain
  // Returns the full blockchain with all blocks and unsealed entry count
  @Get('blockchain')
  async getBlockchain() {
    return this.auditService.getBlockchain();
  }

  // GET /admin/blockchain/verify
  // Verifies every block: PoW, hash linkage, merkle root, sequential index
  @Get('blockchain/verify')
  async verifyBlockchain() {
    return this.auditService.verifyBlockchain();
  }
}
