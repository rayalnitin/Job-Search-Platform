import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, ConnectionStatus } from './connection.entity';
import { User } from '../users/user.entity';
import { SendConnectionRequestDto } from './dto/connection.dto';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ── Send a connection request ─────────────────────────────────

  async sendRequest(requester: User, dto: SendConnectionRequestDto) {
    if (!dto.receiverId && !dto.receiverEmail) {
      throw new BadRequestException(
        'Provide either receiverId or receiverEmail',
      );
    }

    let receiver: User | null = null;

    if (dto.receiverId) {
      receiver = await this.userRepository.findOne({
        where: { id: dto.receiverId },
      });
    } else if (dto.receiverEmail) {
      receiver = await this.userRepository.findOne({
        where: { email: dto.receiverEmail.toLowerCase() },
      });
    }

    if (!receiver) throw new NotFoundException('User not found');

    if (requester.id === receiver.id) {
      throw new BadRequestException('You cannot connect with yourself');
    }

    // Check if a connection already exists in either direction
    const existing = await this.connectionRepository
      .createQueryBuilder('c')
      .where(
        '(c.requester_id = :a AND c.receiver_id = :b) OR (c.requester_id = :b AND c.receiver_id = :a)',
        { a: requester.id, b: receiver.id },
      )
      .getOne();

    if (existing) {
      if (existing.status === ConnectionStatus.ACCEPTED) {
        throw new ConflictException('You are already connected with this user');
      }
      if (existing.status === ConnectionStatus.PENDING) {
        throw new ConflictException(
          'A connection request already exists between you and this user',
        );
      }
      // If previously rejected, allow re-request by deleting old record
      if (existing.status === ConnectionStatus.REJECTED) {
        await this.connectionRepository.remove(existing);
      }
    }

    const connection = this.connectionRepository.create({
      requester,
      receiver,
      status: ConnectionStatus.PENDING,
    });

    await this.connectionRepository.save(connection);

    return {
      message: 'Connection request sent successfully',
      connection: {
        id: connection.id,
        receiverId: receiver.id,
        receiverEmail: receiver.email,
        status: connection.status,
        createdAt: connection.createdAt,
      },
    };
  }

  // ── Accept a connection request ───────────────────────────────

  async acceptRequest(currentUser: User, connectionId: string) {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['requester', 'receiver'],
    });
    if (!connection)
      throw new NotFoundException('Connection request not found');

    // Only the receiver can accept
    if (connection.receiver.id !== currentUser.id) {
      throw new ForbiddenException(
        'Only the recipient of a request can accept it',
      );
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept a request that is already ${connection.status}`,
      );
    }

    connection.status = ConnectionStatus.ACCEPTED;
    await this.connectionRepository.save(connection);

    return {
      message: 'Connection request accepted',
      connection: {
        id: connection.id,
        connectedWith: {
          id: connection.requester.id,
          email: connection.requester.email,
        },
        status: connection.status,
      },
    };
  }

  // ── Reject a connection request ───────────────────────────────

  async rejectRequest(currentUser: User, connectionId: string) {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['requester', 'receiver'],
    });
    if (!connection)
      throw new NotFoundException('Connection request not found');

    // Only the receiver can reject
    if (connection.receiver.id !== currentUser.id) {
      throw new ForbiddenException(
        'Only the recipient of a request can reject it',
      );
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a request that is already ${connection.status}`,
      );
    }

    connection.status = ConnectionStatus.REJECTED;
    await this.connectionRepository.save(connection);

    return { message: 'Connection request rejected' };
  }

  // ── Remove an existing connection ─────────────────────────────

  async removeConnection(currentUser: User, connectionId: string) {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['requester', 'receiver'],
    });
    if (!connection) throw new NotFoundException('Connection not found');

    // Either party can remove an accepted connection
    const isParty =
      connection.requester.id === currentUser.id ||
      connection.receiver.id === currentUser.id;

    if (!isParty) {
      throw new ForbiddenException('Access denied');
    }

    if (connection.status !== ConnectionStatus.ACCEPTED) {
      throw new BadRequestException(
        'You can only remove an accepted connection',
      );
    }

    await this.connectionRepository.remove(connection);

    return { message: 'Connection removed successfully' };
  }

  // ── List my accepted connections ──────────────────────────────

  async getMyConnections(currentUser: User) {
    const connections = await this.connectionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.requester', 'requester')
      .leftJoinAndSelect('c.receiver', 'receiver')
      .where(
        '(c.requester_id = :id OR c.receiver_id = :id) AND c.status = :status',
        { id: currentUser.id, status: ConnectionStatus.ACCEPTED },
      )
      .orderBy('c.updatedAt', 'DESC')
      .getMany();

    return connections.map((c) => {
      const other =
        c.requester.id === currentUser.id ? c.receiver : c.requester;
      return {
        connectionId: c.id,
        user: {
          id: other.id,
          email: other.email,
        },
        connectedSince: c.updatedAt,
      };
    });
  }

  // ── List incoming pending requests ────────────────────────────

  async getPendingRequests(currentUser: User) {
    const requests = await this.connectionRepository.find({
      where: {
        receiver: { id: currentUser.id },
        status: ConnectionStatus.PENDING,
      },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });

    return requests.map((c) => ({
      connectionId: c.id,
      from: {
        id: c.requester.id,
        email: c.requester.email,
      },
      requestedAt: c.createdAt,
    }));
  }

  // ── Connection graph (my connections only) ────────────────────
  // Returns each of my connections along with their own connections
  // (only those who are also my connections — limited graph)

  async getConnectionGraph(currentUser: User) {
    // Step 1: get all my accepted connections
    const myConnections = await this.connectionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.requester', 'requester')
      .leftJoinAndSelect('c.receiver', 'receiver')
      .where(
        '(c.requester_id = :id OR c.receiver_id = :id) AND c.status = :status',
        { id: currentUser.id, status: ConnectionStatus.ACCEPTED },
      )
      .getMany();

    const myConnectionIds = new Set<string>();
    const myConnectionUsers: { id: string; email: string }[] = [];

    for (const c of myConnections) {
      const other =
        c.requester.id === currentUser.id ? c.receiver : c.requester;
      myConnectionIds.add(other.id);
      myConnectionUsers.push({ id: other.id, email: other.email });
    }

    // Step 2: for each of my connections, find which of THEIR connections
    // are also MY connections (restricted graph — no strangers exposed)
    const graph: {
      user: { id: string; email: string };
      mutualConnections: { id: string; email: string }[];
    }[] = [];

    for (const connUser of myConnectionUsers) {
      const theirConnections = await this.connectionRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.requester', 'requester')
        .leftJoinAndSelect('c.receiver', 'receiver')
        .where(
          '(c.requester_id = :id OR c.receiver_id = :id) AND c.status = :status',
          { id: connUser.id, status: ConnectionStatus.ACCEPTED },
        )
        .getMany();

      // Only expose connections who are also MY connections
      const mutualConnections = theirConnections
        .map((c) => (c.requester.id === connUser.id ? c.receiver : c.requester))
        .filter((u) => u.id !== currentUser.id && myConnectionIds.has(u.id))
        .map((u) => ({ id: u.id, email: u.email }));

      graph.push({
        user: connUser,
        mutualConnections,
      });
    }

    return {
      totalConnections: myConnectionUsers.length,
      graph,
    };
  }
}
