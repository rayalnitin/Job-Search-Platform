import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AuditLog, AuditAction } from './audit-log.entity';
import { BlockchainBlock } from './blockchain-block.entity';

const BLOCK_DIFFICULTY = 4; // blockHash must start with '0000'
const DIFFICULTY_PREFIX = '0'.repeat(BLOCK_DIFFICULTY);

@Injectable()
export class AuditService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    @InjectRepository(BlockchainBlock)
    private blockRepository: Repository<BlockchainBlock>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // EXISTING HASH-CHAIN LOGIC — UNTOUCHED
  // ─────────────────────────────────────────────────────────────

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

  async log(
    action: AuditAction,
    performedBy: string,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, any>,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const auditRepository = manager.getRepository(AuditLog);

      const lastEntry = await auditRepository
        .createQueryBuilder('log')
        .orderBy('log.createdAt', 'DESC')
        .addOrderBy('log.id', 'DESC')
        .setLock('pessimistic_write')
        .getOne();

      const previousHash = lastEntry?.entryHash ?? 'GENESIS';
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

      const entry = auditRepository.create({
        action,
        performedBy,
        targetId,
        targetType,
        metadata,
        previousHash,
        entryHash,
        createdAt,
      });

      await auditRepository.save(entry);
    });
  }

  async getAllLogs() {
    return this.auditRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async verifyChain(): Promise<{
    valid: boolean;
    totalEntries: number;
    firstTamperedId: string | null;
    message: string;
  }> {
    const logs = await this.auditRepository.find({
      order: { createdAt: 'ASC', id: 'ASC' },
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
      if (log.previousHash !== expectedPreviousHash) {
        return {
          valid: false,
          totalEntries: logs.length,
          firstTamperedId: log.id,
          message: `Chain broken at entry ${log.id}. previousHash mismatch.`,
        };
      }

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

      expectedPreviousHash = log.entryHash;
    }

    return {
      valid: true,
      totalEntries: logs.length,
      firstTamperedId: null,
      message: `All ${logs.length} audit log entries verified. Chain is intact.`,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCKCHAIN LOGIC — ADDITIVE
  // ─────────────────────────────────────────────────────────────

  // ── Compute merkle root from a list of entry hashes ───────────
  // Simple merkle: SHA-256 of all entry hashes joined with |
  // Proves the exact ordered set of entries sealed in a block

  private computeMerkleRoot(entryHashes: string[]): string {
    if (entryHashes.length === 0) return 'EMPTY';
    const combined = entryHashes.join('|');
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  // ── Compute block hash ────────────────────────────────────────
  // SHA-256(index|previousHash|merkleRoot|timestamp|nonce)

  private computeBlockHash(
    index: number,
    previousHash: string,
    merkleRoot: string,
    timestamp: string,
    nonce: number,
  ): string {
    const payload = [
      index.toString(),
      previousHash,
      merkleRoot,
      timestamp,
      nonce.toString(),
    ].join('|');

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  // ── Proof of work: mine until hash starts with DIFFICULTY_PREFIX

  private mineBlockHash(
    index: number,
    previousHash: string,
    merkleRoot: string,
    timestamp: string,
  ): { blockHash: string; nonce: number } {
    let nonce = 0;
    let blockHash = '';

    while (true) {
      blockHash = this.computeBlockHash(
        index,
        previousHash,
        merkleRoot,
        timestamp,
        nonce,
      );

      if (blockHash.startsWith(DIFFICULTY_PREFIX)) {
        break;
      }
      nonce++;
    }

    return { blockHash, nonce };
  }

  // ── Mine a new block ──────────────────────────────────────────
  // Seals all audit entries not yet included in any block.
  // Returns error if no unsealed entries exist.

  async mineBlock(): Promise<{
    message: string;
    block?: {
      index: number;
      blockHash: string;
      merkleRoot: string;
      nonce: number;
      difficulty: number;
      entryCount: number;
      timestamp: Date;
    };
    error?: string;
  }> {
    // Find all audit entries already sealed into blocks
    const existingBlocks = await this.blockRepository.find();
    const sealedIds = new Set<string>(
      existingBlocks.flatMap((b) => b.auditEntryIds),
    );

    // Get all audit entries not yet sealed
    const allEntries = await this.auditRepository.find({
      order: { createdAt: 'ASC' },
    });

    const unsealedEntries = allEntries.filter((e) => !sealedIds.has(e.id));

    if (unsealedEntries.length === 0) {
      return {
        message: 'No new audit entries to seal.',
        error: 'Nothing to mine. All audit entries are already in a block.',
      };
    }

    // Get previous block hash (or GENESIS if first block)
    const lastBlock = await this.blockRepository.findOne({
      where: {},
      order: { index: 'DESC' },
    });

    const previousHash = lastBlock?.blockHash ?? 'GENESIS';
    const index = (lastBlock?.index ?? -1) + 1;

    // Compute merkle root from unsealed entry hashes
    const entryHashes = unsealedEntries.map((e) => e.entryHash);
    const merkleRoot = this.computeMerkleRoot(entryHashes);

    // Use fixed timestamp string for deterministic hashing
    const timestamp = new Date();

    // Mine: find nonce that produces hash with required leading zeros
    const { blockHash, nonce } = this.mineBlockHash(
      index,
      previousHash,
      merkleRoot,
      timestamp.toISOString(),
    );

    const block = this.blockRepository.create({
      index,
      previousHash,
      blockHash,
      merkleRoot,
      auditEntryIds: unsealedEntries.map((e) => e.id),
      nonce,
      difficulty: BLOCK_DIFFICULTY,
      timestamp,
    });

    await this.blockRepository.save(block);

    return {
      message: `Block #${index} mined successfully`,
      block: {
        index: block.index,
        blockHash: block.blockHash,
        merkleRoot: block.merkleRoot,
        nonce: block.nonce,
        difficulty: block.difficulty,
        entryCount: unsealedEntries.length,
        timestamp,
      },
    };
  }

  // ── Get the full blockchain ───────────────────────────────────

  async getBlockchain(): Promise<{
    totalBlocks: number;
    unsealedEntryCount: number;
    blocks: {
      index: number;
      blockHash: string;
      previousHash: string;
      merkleRoot: string;
      nonce: number;
      difficulty: number;
      entryCount: number;
      auditEntryIds: string[];
      timestamp: Date | null;
    }[];
  }> {
    const blocks = await this.blockRepository.find({
      order: { index: 'ASC' },
    });

    // Count unsealed entries
    const sealedIds = new Set<string>(blocks.flatMap((b) => b.auditEntryIds));
    const totalEntries = await this.auditRepository.count();
    const unsealedEntryCount = totalEntries - sealedIds.size;

    return {
      totalBlocks: blocks.length,
      unsealedEntryCount,
      blocks: blocks.map((b) => ({
        index: b.index,
        blockHash: b.blockHash,
        previousHash: b.previousHash,
        merkleRoot: b.merkleRoot,
        nonce: b.nonce,
        difficulty: b.difficulty,
        entryCount: b.auditEntryIds.length,
        auditEntryIds: b.auditEntryIds,
        timestamp: b.timestamp,
      })),
    };
  }

  // ── Verify the entire blockchain ──────────────────────────────
  // Checks for each block:
  //   1. index is sequential
  //   2. previousHash links correctly to prior block
  //   3. blockHash starts with required difficulty prefix (PoW valid)
  //   4. blockHash recomputes correctly from stored fields
  //   5. merkleRoot recomputes correctly from sealed audit entries

  async verifyBlockchain(): Promise<{
    valid: boolean;
    totalBlocks: number;
    firstInvalidBlockIndex: number | null;
    message: string;
    details: string[];
  }> {
    const blocks = await this.blockRepository.find({
      order: { index: 'ASC' },
    });

    if (blocks.length === 0) {
      return {
        valid: true,
        totalBlocks: 0,
        firstInvalidBlockIndex: null,
        message:
          'No blocks found. Mine the first block with POST /admin/blockchain/mine.',
        details: [],
      };
    }

    const details: string[] = [];
    let expectedPreviousHash = 'GENESIS';

    for (const block of blocks) {
      // Check 1: sequential index
      if (block.index !== details.length) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          firstInvalidBlockIndex: block.index,
          message: `Block index mismatch at block #${block.index}.`,
          details,
        };
      }

      // Check 2: previousHash linkage
      if (block.previousHash !== expectedPreviousHash) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          firstInvalidBlockIndex: block.index,
          message: `Block #${block.index} previousHash mismatch. Chain is broken.`,
          details,
        };
      }

      // Check 3: proof-of-work — hash must start with difficulty zeros
      if (!block.blockHash.startsWith('0'.repeat(block.difficulty))) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          firstInvalidBlockIndex: block.index,
          message: `Block #${block.index} fails proof-of-work. Hash does not meet difficulty.`,
          details,
        };
      }

      // Check 4: recompute merkle root from sealed audit entries
      const entries = await this.auditRepository.findByIds(block.auditEntryIds);

      if (!block.timestamp) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          firstInvalidBlockIndex: block.index,
          message: `Block #${block.index} is missing a timestamp. Run Repair Ledger to rebuild the chain.`,
          details,
        };
      }

      // Sort by createdAt to ensure deterministic order
      entries.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      const entryHashes = entries.map((e) => e.entryHash);
      const recomputedMerkle = this.computeMerkleRoot(entryHashes);

      if (recomputedMerkle !== block.merkleRoot) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          firstInvalidBlockIndex: block.index,
          message: `Block #${block.index} merkle root mismatch. Sealed entries may have been tampered with.`,
          details,
        };
      }

      // Check 5: recompute block hash
      const recomputedHash = this.computeBlockHash(
        block.index,
        block.previousHash,
        block.merkleRoot,
        block.timestamp.toISOString(),
        block.nonce,
      );

      if (recomputedHash !== block.blockHash) {
        return {
          valid: false,
          totalBlocks: blocks.length,
          firstInvalidBlockIndex: block.index,
          message: `Block #${block.index} hash mismatch. Block data has been tampered with.`,
          details,
        };
      }

      details.push(
        `Block #${block.index} ✓ — ${block.auditEntryIds.length} entries, hash: ${block.blockHash.substring(0, 16)}...`,
      );
      expectedPreviousHash = block.blockHash;
    }

    return {
      valid: true,
      totalBlocks: blocks.length,
      firstInvalidBlockIndex: null,
      message: `All ${blocks.length} blocks verified. Blockchain is intact.`,
      details,
    };
  }

  // ── Repair the full ledger ───────────────────────────────────
  // Rebuilds audit hash-chain, clears blockchain blocks, and remints blocks.

  async repairLedger(): Promise<{
    message: string;
    auditEntriesRepaired: number;
    blockchainRebuilt: boolean;
    blockchain?: {
      totalBlocks: number;
      unsealedEntryCount: number;
      blocks: {
        index: number;
        blockHash: string;
        previousHash: string;
        merkleRoot: string;
        nonce: number;
        difficulty: number;
        entryCount: number;
        auditEntryIds: string[];
        timestamp: Date | null;
      }[];
    };
  }> {
    const logs = await this.auditRepository.find({
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    let previousHash = 'GENESIS';

    await this.dataSource.transaction(async (manager) => {
      const auditRepository = manager.getRepository(AuditLog);

      for (const log of logs) {
        log.previousHash = previousHash;
        log.entryHash = this.computeHash(
          log.action,
          log.performedBy ?? '',
          log.targetId ?? '',
          log.targetType ?? '',
          log.metadata ?? {},
          log.createdAt,
          previousHash,
        );

        await auditRepository.save(log);
        previousHash = log.entryHash;
      }
    });

    await this.blockRepository.clear();

    const mined = await this.mineBlock();

    return {
      message: 'Ledger repaired and blockchain rebuilt successfully.',
      auditEntriesRepaired: logs.length,
      blockchainRebuilt: true,
      blockchain: mined.block
        ? await this.getBlockchain()
        : await this.getBlockchain(),
    };
  }
}
