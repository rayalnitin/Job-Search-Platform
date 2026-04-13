import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, FieldPrivacy } from './profile.entity';
import { ProfileView } from './profile-view.entity';
import { User, UserRole } from './user.entity';
import { UpdateProfileDto } from './dto/profile.dto';
import { Connection, ConnectionStatus } from '../connections/connection.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

const VIEW_DEDUP_MS = 60 * 60 * 1000;
const MAX_RECENT_VIEWERS = 20;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(ProfileView)
    private profileViewRepository: Repository<ProfileView>,
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
    private auditService: AuditService,
  ) {}

  // ── Get own profile (full, no privacy filtering) ──────────────

  async getProfile(user: User) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Profile not found');

    return {
      id: profile.id,
      email: profile.user.email,
      phone: profile.user.phone,
      role: profile.user.role,
      name: profile.name,
      headline: profile.headline,
      location: profile.location,
      bio: profile.bio,
      education: profile.education,
      experience: profile.experience,
      skills: profile.skills,
      hasAvatar: !!profile.avatarData,
      privacy: {
        headlinePrivacy: profile.headlinePrivacy,
        locationPrivacy: profile.locationPrivacy,
        bioPrivacy: profile.bioPrivacy,
        educationPrivacy: profile.educationPrivacy,
        experiencePrivacy: profile.experiencePrivacy,
        skillsPrivacy: profile.skillsPrivacy,
        optOutOfViewers: profile.optOutOfViewers,
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  // ── Get another user's profile (privacy-filtered) ─────────────

  async getProfileById(viewer: User, targetUserId: string) {
    if (viewer.id === targetUserId) {
      return this.getProfile(viewer);
    }

    const profile = await this.profileRepository.findOne({
      where: { user: { id: targetUserId } },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const isAdmin = viewer.role === UserRole.ADMIN;
    const isConnected = isAdmin
      ? true
      : await this.checkConnection(viewer.id, targetUserId);

    await this.logProfileView(viewer, targetUserId);

    const resolve = (
      value: string | null,
      privacy: FieldPrivacy,
    ): string | null => {
      if (isAdmin) return value;
      if (privacy === FieldPrivacy.PUBLIC) return value;
      if (privacy === FieldPrivacy.CONNECTIONS && isConnected) return value;
      return null;
    };

    return {
      id: profile.id,
      email: profile.user.email,
      role: profile.user.role,
      name: profile.name,
      hasAvatar: !!profile.avatarData,
      headline: resolve(profile.headline, profile.headlinePrivacy),
      location: resolve(profile.location, profile.locationPrivacy),
      bio: resolve(profile.bio, profile.bioPrivacy),
      education: resolve(profile.education, profile.educationPrivacy),
      experience: resolve(profile.experience, profile.experiencePrivacy),
      skills: resolve(profile.skills, profile.skillsPrivacy),
      privacy: {
        headlinePrivacy: profile.headlinePrivacy,
        locationPrivacy: profile.locationPrivacy,
        bioPrivacy: profile.bioPrivacy,
        educationPrivacy: profile.educationPrivacy,
        experiencePrivacy: profile.experiencePrivacy,
        skillsPrivacy: profile.skillsPrivacy,
      },
      createdAt: profile.createdAt,
    };
  }

  // ── Update own profile ────────────────────────────────────────

  async updateProfile(user: User, dto: UpdateProfileDto) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    Object.assign(profile, dto);
    await this.profileRepository.save(profile);

    return { message: 'Profile updated successfully', profile };
  }

  // ── Upload avatar ─────────────────────────────────────────────

  async uploadAvatar(user: User, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WEBP images are allowed',
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException('Avatar must be under 2MB');
    }

    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Replace existing avatar in-place
    profile.avatarData = file.buffer;
    profile.avatarMimeType = file.mimetype;
    await this.profileRepository.save(profile);

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl: `/users/avatar/${user.id}`,
    };
  }

  // ── Get avatar bytes (streamed by controller) ─────────────────

  async getAvatar(userId: string): Promise<{
    buffer: Buffer;
    mimeType: string;
  }> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile || !profile.avatarData) {
      throw new NotFoundException('Avatar not found');
    }

    return {
      buffer: profile.avatarData,
      mimeType: profile.avatarMimeType ?? 'image/jpeg',
    };
  }

  // ── Delete own avatar ─────────────────────────────────────────

  async deleteAvatar(user: User) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    if (!profile.avatarData) {
      throw new BadRequestException('No avatar to delete');
    }

    profile.avatarData = null;
    profile.avatarMimeType = null;
    await this.profileRepository.save(profile);

    return { message: 'Avatar deleted successfully' };
  }

  // ── Get my viewer count + recent viewers list ─────────────────

  async getMyViewers(user: User) {
    const totalViewers = await this.profileViewRepository
      .createQueryBuilder('pv')
      .where('pv.target_id = :id', { id: user.id })
      .select('COUNT(DISTINCT pv.viewer_id)', 'count')
      .getRawOne();

    const recentViews = await this.profileViewRepository
      .createQueryBuilder('pv')
      .leftJoinAndSelect('pv.viewer', 'viewer')
      .leftJoin('profiles', 'vp', 'vp.user_id = viewer.id')
      .where('pv.target_id = :id', { id: user.id })
      .andWhere('vp.opt_out_of_viewers = false')
      .orderBy('pv.viewedAt', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const recentViewers: {
      viewerId: string;
      viewerEmail: string;
      viewedAt: Date;
    }[] = [];

    for (const pv of recentViews) {
      if (!seen.has(pv.viewer.id)) {
        seen.add(pv.viewer.id);
        recentViewers.push({
          viewerId: pv.viewer.id,
          viewerEmail: pv.viewer.email,
          viewedAt: pv.viewedAt,
        });
        if (recentViewers.length >= MAX_RECENT_VIEWERS) break;
      }
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      totalUniqueViewers: parseInt(totalViewers?.count ?? '0', 10),
      recentViewers,
    };
  }

  // ── Internal: log a profile view ─────────────────────────────

  private async logProfileView(
    viewer: User,
    targetUserId: string,
  ): Promise<void> {
    const viewerProfile = await this.profileRepository.findOne({
      where: { user: { id: viewer.id } },
    });
    if (viewerProfile?.optOutOfViewers) return;

    const cutoff = new Date(Date.now() - VIEW_DEDUP_MS);
    const recentView = await this.profileViewRepository
      .createQueryBuilder('pv')
      .where('pv.viewer_id = :viewerId', { viewerId: viewer.id })
      .andWhere('pv.target_id = :targetId', { targetId: targetUserId })
      .andWhere('pv.viewedAt > :cutoff', { cutoff })
      .getOne();

    if (recentView) return;

    const targetUser = { id: targetUserId } as User;
    const view = this.profileViewRepository.create({
      viewer,
      target: targetUser,
    });
    await this.profileViewRepository.save(view);

    await this.auditService.log(
      AuditAction.PROFILE_VIEWED,
      viewer.id,
      targetUserId,
      'User',
      {},
    );
  }

  // ── Internal: check if two users are connected ────────────────

  async checkConnection(userAId: string, userBId: string): Promise<boolean> {
    const connection = await this.connectionRepository
      .createQueryBuilder('c')
      .where(
        '(c.requester_id = :a AND c.receiver_id = :b) OR (c.requester_id = :b AND c.receiver_id = :a)',
        { a: userAId, b: userBId },
      )
      .andWhere('c.status = :status', { status: ConnectionStatus.ACCEPTED })
      .getOne();

    return !!connection;
  }
}
