import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { E2eeMessage } from './e2ee-message.entity';
import { User } from '../users/user.entity';
import {
  RegisterPublicKeyDto,
  SendE2eeMessageDto,
} from './dto/e2ee-message.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
import { PkiService } from '../pki/pki.service';
import {
  signData,
  verifySignature,
  hashString,
} from '../common/utils/pki.util';

@Injectable()
export class E2eeMessagesService {
  constructor(
    @InjectRepository(E2eeMessage)
    private e2eeMessageRepository: Repository<E2eeMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
    private pkiService: PkiService,
  ) {}

  // ── Register / update client public key ──────────────────────
  // Called after login. Client generates key pair locally,
  // uploads public key here. Private key never leaves the client.

  async registerPublicKey(user: User, dto: RegisterPublicKeyDto) {
    await this.userRepository.update(user.id, { publicKey: dto.publicKey });

    return {
      message: 'Public key registered successfully',
      userId: user.id,
      publicKeyRegistered: true,
    };
  }

  // ── Get a user's public key (so sender can encrypt for them) ─

  async getPublicKey(targetUserId: string) {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!user.publicKey) {
      throw new BadRequestException(
        'This user has not registered a public key. E2EE is not available for this user.',
      );
    }

    return {
      userId: user.id,
      publicKey: user.publicKey,
    };
  }

  // ── Send an E2EE message ──────────────────────────────────────
  // Sender encrypts content client-side using recipient's public key,
  // sends only ciphertext. Server stores ciphertext as-is — never decrypts.

  async sendE2eeMessage(sender: User, dto: SendE2eeMessageDto) {
    if (sender.id === dto.receiverId) {
      throw new ForbiddenException('You cannot message yourself');
    }

    const receiver = await this.userRepository.findOne({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

    if (!receiver.publicKey) {
      throw new BadRequestException(
        'Recipient has not registered a public key. Ask them to enable E2EE first.',
      );
    }

    // PKI: hash the ciphertext and sign it
    // This proves the ciphertext stored in DB was not altered after submission
    // Note: we hash ciphertext (not plaintext) — server never sees plaintext
    const ciphertextHash = hashString(dto.ciphertext);
    const signature = signData(ciphertextHash, this.pkiService.getPrivateKey());

    const message = this.e2eeMessageRepository.create({
      sender,
      receiver,
      ciphertext: dto.ciphertext,
      ciphertextHash,
      signature,
      isRead: false,
    });

    await this.e2eeMessageRepository.save(message);

    await this.auditService.log(
      AuditAction.MESSAGE_SENT,
      sender.id,
      message.id,
      'E2eeMessage',
      { receiverId: receiver.id, mode: 'e2ee' },
    );

    return {
      message: 'E2EE message sent successfully',
      data: {
        id: message.id,
        receiverId: receiver.id,
        sentAt: message.createdAt,
        ciphertextHash,
        signatureAttached: true,
        note: 'Message is end-to-end encrypted. Server cannot read content.',
      },
    };
  }

  // ── Get E2EE conversation with a user ─────────────────────────
  // Returns raw ciphertext — client decrypts using their private key.
  // Server also verifies PKI signature on each message to confirm
  // ciphertext integrity (not tampered with in DB).

  async getE2eeConversation(currentUser: User, otherUserId: string) {
    const otherUser = await this.userRepository.findOne({
      where: { id: otherUserId },
    });
    if (!otherUser) throw new NotFoundException('User not found');

    const messages = await this.e2eeMessageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.receiver', 'receiver')
      .where(
        '(msg.sender_id = :me AND msg.receiver_id = :other) OR (msg.sender_id = :other AND msg.receiver_id = :me)',
        { me: currentUser.id, other: otherUserId },
      )
      .orderBy('msg.createdAt', 'ASC')
      .getMany();

    // Mark unread as read
    const unreadIds = messages
      .filter((m) => m.receiver.id === currentUser.id && !m.isRead)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await this.e2eeMessageRepository
        .createQueryBuilder()
        .update(E2eeMessage)
        .set({ isRead: true })
        .whereInIds(unreadIds)
        .execute();
    }

    return messages.map((m) => {
      // PKI: verify ciphertext was not tampered with in DB
      let integrityVerified = false;
      let integrityNote = 'No PKI signature on record.';

      if (m.signature && m.ciphertextHash) {
        const recomputedHash = hashString(m.ciphertext);
        const hashMatches = recomputedHash === m.ciphertextHash;

        if (!hashMatches) {
          integrityNote =
            'WARNING: Ciphertext hash mismatch. Message may have been tampered with in the database.';
        } else {
          integrityVerified = verifySignature(
            m.ciphertextHash,
            m.signature,
            this.pkiService.getPublicKey(),
          );
          integrityNote = integrityVerified
            ? 'RSA-SHA256 signature verified. Ciphertext integrity confirmed. Decrypt using your private key.'
            : 'WARNING: RSA signature verification failed.';
        }
      }

      return {
        id: m.id,
        from: m.sender.id === currentUser.id ? 'me' : m.sender.email,
        senderId: m.sender.id,
        // Raw ciphertext returned — client decrypts with their private key
        ciphertext: m.ciphertext,
        isRead: m.isRead,
        sentAt: m.createdAt,
        integrity: {
          verified: integrityVerified,
          note: integrityNote,
        },
      };
    });
  }

  // ── Get E2EE inbox (conversation previews) ────────────────────

  async getE2eeInbox(currentUser: User) {
    const messages = await this.e2eeMessageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.receiver', 'receiver')
      .where('msg.sender_id = :id OR msg.receiver_id = :id', {
        id: currentUser.id,
      })
      .orderBy('msg.createdAt', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const inbox: {
      partnerId: string;
      partnerEmail: string;
      lastMessageAt: Date;
      unreadCount: number;
      encrypted: boolean;
    }[] = [];

    for (const m of messages) {
      const partner = m.sender.id === currentUser.id ? m.receiver : m.sender;

      if (!seen.has(partner.id)) {
        seen.add(partner.id);

        const unreadCount = await this.e2eeMessageRepository.count({
          where: {
            sender: { id: partner.id },
            receiver: { id: currentUser.id },
            isRead: false,
          },
        });

        inbox.push({
          partnerId: partner.id,
          partnerEmail: partner.email,
          lastMessageAt: m.createdAt,
          unreadCount,
          // Always true — last message preview intentionally omitted
          // since server cannot decrypt E2EE content
          encrypted: true,
        });
      }
    }

    return inbox;
  }
}
