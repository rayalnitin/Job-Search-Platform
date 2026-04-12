import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Message } from './message.entity';
import { User } from '../users/user.entity';
import { SendMessageDto } from './dto/message.dto';
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

function encryptMessage(plaintext: string): {
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

function decryptMessage(encryptedContent: string, ivHex: string): string {
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
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
    private pkiService: PkiService,
  ) {}

  // ── Send a message ────────────────────────────────────────────

  async sendMessage(sender: User, dto: SendMessageDto) {
    const receiver = await this.userRepository.findOne({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

    if (sender.id === dto.receiverId) {
      throw new ForbiddenException('You cannot message yourself');
    }

    // Encrypt the message content for storage
    const { encryptedContent, iv } = encryptMessage(dto.content);

    // PKI Step 1: hash the plaintext content
    const contentHash = hashString(dto.content);

    // PKI Step 2: sign the hash with the server's RSA private key
    // This proves the message was accepted and stored by this server
    // and that the stored ciphertext has not been tampered with
    const signature = signData(contentHash, this.pkiService.getPrivateKey());

    const message = this.messageRepository.create({
      sender,
      receiver,
      encryptedContent,
      iv,
      contentHash,
      signature,
      isRead: false,
    });

    await this.messageRepository.save(message);

    await this.auditService.log(
      AuditAction.MESSAGE_SENT,
      sender.id,
      message.id,
      'Message',
      { receiverId: receiver.id },
    );

    return {
      message: 'Message sent successfully',
      data: {
        id: message.id,
        receiverId: receiver.id,
        sentAt: message.createdAt,
        contentHash,
        signatureAttached: true,
      },
    };
  }

  // ── Get full conversation with a user ─────────────────────────

  async getConversation(currentUser: User, otherUserId: string) {
    const otherUser = await this.userRepository.findOne({
      where: { id: otherUserId },
    });
    if (!otherUser) throw new NotFoundException('User not found');

    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where(
        '(message.sender_id = :me AND message.receiver_id = :other) OR (message.sender_id = :other AND message.receiver_id = :me)',
        { me: currentUser.id, other: otherUserId },
      )
      .orderBy('message.createdAt', 'ASC')
      .getMany();

    // Mark unread messages as read
    const unreadIds = messages
      .filter((m) => m.receiver.id === currentUser.id && !m.isRead)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ isRead: true })
        .whereInIds(unreadIds)
        .execute();
    }

    // Decrypt, verify signature, and return
    return messages.map((m) => {
      const decryptedContent = decryptMessage(m.encryptedContent, m.iv);

      // PKI: verify the signature on the decrypted content
      let integrityVerified = false;
      let integrityNote = 'No PKI signature on record for this message.';

      if (m.signature && m.contentHash) {
        // Recompute hash of decrypted content and compare
        const recomputedHash = hashString(decryptedContent);
        const hashMatches = recomputedHash === m.contentHash;

        if (!hashMatches) {
          integrityNote =
            'WARNING: Content hash mismatch. Message may have been tampered with in the database.';
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
        from: m.sender.id === currentUser.id ? 'me' : m.sender.email,
        senderId: m.sender.id,
        content: decryptedContent,
        isRead: m.isRead,
        sentAt: m.createdAt,
        integrity: {
          verified: integrityVerified,
          note: integrityNote,
        },
      };
    });
  }

  // ── List all conversations (inbox preview) ────────────────────

  async getInbox(currentUser: User) {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('message.sender_id = :id OR message.receiver_id = :id', {
        id: currentUser.id,
      })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const inbox: {
      partnerId: string;
      partnerEmail: string;
      lastMessage: string;
      sentAt: Date;
      unreadCount: number;
    }[] = [];

    for (const m of messages) {
      const partner = m.sender.id === currentUser.id ? m.receiver : m.sender;

      if (!seen.has(partner.id)) {
        seen.add(partner.id);

        const unreadCount = await this.messageRepository.count({
          where: {
            sender: { id: partner.id },
            receiver: { id: currentUser.id },
            isRead: false,
          },
        });

        inbox.push({
          partnerId: partner.id,
          partnerEmail: partner.email,
          lastMessage: decryptMessage(m.encryptedContent, m.iv),
          sentAt: m.createdAt,
          unreadCount,
        });
      }
    }

    return inbox;
  }
}
