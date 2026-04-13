import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('blockchain_blocks')
export class BlockchainBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Sequential block number — 0 is genesis
  @Column({ type: 'int' })
  index: number;

  // Hash of the previous block ('GENESIS' for block 0)
  @Column({ type: 'text' })
  previousHash: string;

  // SHA-256(index|previousHash|merkleRoot|timestamp|nonce)
  @Column({ type: 'text' })
  blockHash: string;

  // SHA-256 of all contained audit entry hashes joined with |
  // Proves the exact set of entries sealed in this block
  @Column({ type: 'text' })
  merkleRoot: string;

  // Array of AuditLog IDs sealed in this block
  @Column({ type: 'jsonb', default: [] })
  auditEntryIds: string[];

  // Proof-of-work nonce — incremented until blockHash starts with N zeros
  @Column({ type: 'int' })
  nonce: number;

  // Number of leading zeros required in blockHash
  @Column({ type: 'int', default: 4 })
  difficulty: number;

  @CreateDateColumn()
  timestamp: Date;
}
