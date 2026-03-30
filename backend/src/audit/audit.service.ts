import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: AuditAction,
    performedBy: string,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>,
  ) {
    const entry = this.auditRepository.create({
      action,
      performedBy,
      targetId,
      targetType,
      metadata,
    });
    await this.auditRepository.save(entry);
  }

  async getAllLogs() {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
