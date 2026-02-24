import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

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
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateProfile(user: User, dto: UpdateProfileDto) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    Object.assign(profile, dto);
    await this.profileRepository.save(profile);

    return { message: 'Profile updated successfully', profile };
  }
}
