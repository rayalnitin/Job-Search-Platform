import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { GroupConversation } from './group-conversation.entity';
import { GroupMessage } from './group-message.entity';
import { User } from '../users/user.entity';
import {
  CreateGroupDto,
  SendGroupMessageDto,
  AddParticipantDto,
} from './dto/group-message.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
import { PkiService } from '../pki/pki.service';
import {
  signData,
  verifySignature,
  hashString,
} from '../common/utils/pki.util';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey(): Buffer {
  const secret =
    process.env.RESUME_ENCRYPTION_KEY || 'jobportal_resume_key_32byteslong!';
  return crypto.scryptSync(secret, 'salt', 32);
}

function encryptContent(plaintext: string): {
  encryptedContent: string;
  iv: string;
} {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return {
    encryptedContent: encrypted.toString('hex'),
    iv: iv.toString('hex'),
  };
}

function decryptContent(encryptedContent: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedContent, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

@Injectable()
export class GroupMessagesService {
  constructor(
    @InjectRepository(GroupConversation)
    private groupRepository: Repository<GroupConversation>,
    @InjectRepository(GroupMessage)
    private groupMessageRepository: Repository<GroupMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
    private pkiService: PkiService,
  ) {}

  // ── Create a group conversation ───────────────────────────────

  async createGroup(creator: User, dto: CreateGroupDto) {
    // Resolve all participant users
    const participants: User[] = [creator]; // creator always included

    for (const uid of dto.participantIds) {
      if (uid === creator.id) continue; // skip duplicates of creator
      const user = await this.userRepository.findOne({ where: { id: uid } });
      if (!user) throw new NotFoundException(`User ${uid} not found`);
      participants.push(user);
    }

    if (participants.length < 2) {
      throw new BadRequestException(
        'A group must have at least 2 participants',
      );
    }

    const group = this.groupRepository.create({
      name: dto.name,
      createdBy: creator,
      participants,
    });

    await this.groupRepository.save(group);

    await this.auditService.log(
      AuditAction.MESSAGE_SENT,
      creator.id,
      group.id,
      'GroupConversation',
      { name: dto.name, participantCount: participants.length },
    );

    return {
      message: 'Group created successfully',
      group: {
        id: group.id,
        name: group.name,
        createdBy: creator.id,
        participants: participants.map((p) => ({
          id: p.id,
          email: p.email,
        })),
        createdAt: group.createdAt,
      },
    };
  }

  // ── List my group conversations ───────────────────────────────

  async getMyGroups(user: User) {
    const groups = await this.groupRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.participants', 'participant')
      .leftJoinAndSelect('g.createdBy', 'creator')
      .where('participant.id = :userId', { userId: user.id })
      .orderBy('g.createdAt', 'DESC')
      .getMany();

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      createdBy: { id: g.createdBy.id, email: g.createdBy.email },
      participants: g.participants.map((p) => ({
        id: p.id,
        email: p.email,
      })),
      participantCount: g.participants.length,
      createdAt: g.createdAt,
    }));
  }

  // ── Add a participant (creator only) ──────────────────────────

  async addParticipant(
    requester: User,
    groupId: string,
    dto: AddParticipantDto,
  ) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['createdBy', 'participants'],
    });
    if (!group) throw new NotFoundException('Group not found');

    if (group.createdBy.id !== requester.id) {
      throw new ForbiddenException(
        'Only the group creator can add participants',
      );
    }

    const alreadyIn = group.participants.some((p) => p.id === dto.userId);
    if (alreadyIn) {
      throw new BadRequestException('User is already in this group');
    }

    const newUser = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!newUser) throw new NotFoundException('User not found');

    group.participants.push(newUser);
    await this.groupRepository.save(group);

    return {
      message: 'Participant added successfully',
      groupId: group.id,
      addedUser: { id: newUser.id, email: newUser.email },
    };
  }

  // ── Remove a participant (creator only) ───────────────────────

  async removeParticipant(
    requester: User,
    groupId: string,
    targetUserId: string,
  ) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['createdBy', 'participants'],
    });
    if (!group) throw new NotFoundException('Group not found');

    if (group.createdBy.id !== requester.id) {
      throw new ForbiddenException(
        'Only the group creator can remove participants',
      );
    }

    if (targetUserId === requester.id) {
      throw new BadRequestException('Creator cannot remove themselves');
    }

    const before = group.participants.length;
    group.participants = group.participants.filter(
      (p) => p.id !== targetUserId,
    );

    if (group.participants.length === before) {
      throw new NotFoundException('User is not a participant in this group');
    }

    if (group.participants.length < 2) {
      throw new BadRequestException('Group must have at least 2 participants');
    }

    await this.groupRepository.save(group);

    return {
      message: 'Participant removed successfully',
      groupId: group.id,
      removedUserId: targetUserId,
    };
  }

  // ── Send a message to a group ─────────────────────────────────

  async sendGroupMessage(
    sender: User,
    groupId: string,
    dto: SendGroupMessageDto,
  ) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['participants'],
    });
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.participants.some((p) => p.id === sender.id);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Encrypt
    const { encryptedContent, iv } = encryptContent(dto.content);

    // PKI sign
    const contentHash = hashString(dto.content);
    const signature = signData(contentHash, this.pkiService.getPrivateKey());

    const msg = this.groupMessageRepository.create({
      conversation: group,
      sender,
      encryptedContent,
      iv,
      contentHash,
      signature,
    });

    await this.groupMessageRepository.save(msg);

    await this.auditService.log(
      AuditAction.MESSAGE_SENT,
      sender.id,
      msg.id,
      'GroupMessage',
      { groupId: group.id, groupName: group.name },
    );

    return {
      message: 'Message sent successfully',
      data: {
        id: msg.id,
        groupId: group.id,
        sentAt: msg.createdAt,
        contentHash,
        signatureAttached: true,
      },
    };
  }

  // ── Get full group conversation (decrypted + PKI verified) ────

  async getGroupConversation(user: User, groupId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['participants', 'createdBy'],
    });
    if (!group) throw new NotFoundException('Group not found');

    const isMember = group.participants.some((p) => p.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const messages = await this.groupMessageRepository.find({
      where: { conversation: { id: groupId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    const decryptedMessages = messages.map((m) => {
      const decryptedContent = decryptContent(m.encryptedContent, m.iv);

      let integrityVerified = false;
      let integrityNote = 'No PKI signature on record for this message.';

      if (m.signature && m.contentHash) {
        const recomputedHash = hashString(decryptedContent);
        const hashMatches = recomputedHash === m.contentHash;

        if (!hashMatches) {
          integrityNote =
            'WARNING: Content hash mismatch. Message may have been tampered with.';
        } else {
          integrityVerified = verifySignature(
            m.contentHash,
            m.signature,
            this.pkiService.getPublicKey(),
          );
          integrityNote = integrityVerified
            ? 'RSA-SHA256 signature verified. Message integrity confirmed.'
            : 'WARNING: RSA signature verification failed. Message may have been tampered with.';
        }
      }

      return {
        id: m.id,
        from: m.sender.id === user.id ? 'me' : m.sender.email,
        senderId: m.sender.id,
        content: decryptedContent,
        sentAt: m.createdAt,
        integrity: {
          verified: integrityVerified,
          note: integrityNote,
        },
      };
    });

    return {
      group: {
        id: group.id,
        name: group.name,
        createdBy: { id: group.createdBy.id, email: group.createdBy.email },
        participants: group.participants.map((p) => ({
          id: p.id,
          email: p.email,
        })),
      },
      messages: decryptedMessages,
    };
  }
}
