import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Profile } from '../users/profile.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async getAllUsers() {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isVerified: u.isVerified,
      isSuspended: u.isSuspended,
      createdAt: u.createdAt,
    }));
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepository.findOne({
      where: { user: { id } },
    });

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
      profile: profile
        ? {
            name: profile.name,
            headline: profile.headline,
            location: profile.location,
            bio: profile.bio,
            education: profile.education,
            experience: profile.experience,
            skills: profile.skills,
          }
        : null,
    };
  }

  async suspendUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isSuspended)
      throw new BadRequestException('User is already suspended');

    user.isSuspended = true;
    await this.userRepository.save(user);

    return { message: 'User suspended successfully' };
  }

  async unsuspendUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isSuspended)
      throw new BadRequestException('User is not suspended');

    user.isSuspended = false;
    await this.userRepository.save(user);

    return { message: 'User unsuspended successfully' };
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.remove(user);

    return { message: 'User deleted successfully' };
  }
}
