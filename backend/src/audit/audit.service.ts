import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  // ── Internal: compute entry hash ─────────────────────────────
  // Hash input: action|performedBy|targetId|targetType|metadata|createdAt|previousHash
  // This binds the hash to the entry content AND to the chain position.

  private computeHash(
    action: string,
    performedBy: string,
    targetId: string,
    targetType: string,
    metadata: Record<string, any>,
    createdAt: Date,
    previousHash: string,
  ): string {
    const payload = [
      action,
      performedBy ?? '',
      targetId ?? '',
      targetType ?? '',
      JSON.stringify(metadata ?? {}),
      createdAt.toISOString(),
      previousHash,
    ].join('|');

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  // ── Log a new audit entry ─────────────────────────────────────

  async log(
    action: AuditAction,
    performedBy: string,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>,
  ) {
    // Get the most recent log entry to fetch its hash (chain tip)
    const lastEntry = await this.auditRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    const previousHash = lastEntry?.entryHash ?? 'GENESIS';

    // We need createdAt before saving — use current time
    const createdAt = new Date();

    const entryHash = this.computeHash(
      action,
      performedBy ?? '',
      targetId ?? '',
      targetType ?? '',
      metadata ?? {},
      createdAt,
      previousHash,
    );

    const entry = this.auditRepository.create({
      action,
      performedBy,
      targetId,
      targetType,
      metadata,
      previousHash,
      entryHash,
      createdAt,
    });

    await this.auditRepository.save(entry);
  }

  // ── Get all logs (admin view) ─────────────────────────────────

  async getAllLogs() {
    return this.auditRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  // ── Verify the entire audit log chain ────────────────────────
  // Walks every entry in chronological order, recomputes each hash,
  // and checks that:
  //   1. entryHash matches the recomputed hash (content not tampered)
  //   2. previousHash matches the prior entry's entryHash (chain not broken)

  async verifyChain(): Promise<{
    valid: boolean;
    totalEntries: number;
    firstTamperedId: string | null;
    message: string;
  }> {
    const logs = await this.auditRepository.find({
      order: { createdAt: 'ASC' },
    });

    if (logs.length === 0) {
      return {
        valid: true,
        totalEntries: 0,
        firstTamperedId: null,
        message: 'No audit entries found. Chain is empty.',
      };
    }

    let expectedPreviousHash = 'GENESIS';

    for (const log of logs) {
      // Check 1: previousHash must match what we expect from the prior entry
      if (log.previousHash !== expectedPreviousHash) {
        return {
          valid: false,
          totalEntries: logs.length,
          firstTamperedId: log.id,
          message: `Chain broken at entry ${log.id}. previousHash mismatch — a log entry may have been inserted, deleted, or reordered.`,
        };
      }

      // Check 2: recompute entryHash and compare
      const recomputed = this.computeHash(
        log.action,
        log.performedBy ?? '',
        log.targetId ?? '',
        log.targetType ?? '',
        log.metadata ?? {},
        log.createdAt,
        log.previousHash,
      );

      if (recomputed !== log.entryHash) {
        return {
          valid: false,
          totalEntries: logs.length,
          firstTamperedId: log.id,
          message: `Entry ${log.id} has been tampered with. Stored hash does not match recomputed hash.`,
        };
      }

      // Advance the chain
      expectedPreviousHash = log.entryHash;
    }

    return {
      valid: true,
      totalEntries: logs.length,
      firstTamperedId: null,
      message: `All ${logs.length} audit log entries verified. Chain is intact.`,
    };
  }
}
