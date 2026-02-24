import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { ResumeModule } from './resume/resume.module';
import { AdminModule } from './admin/admin.module';
import { User } from './users/user.entity';
import { Profile } from './users/profile.entity';
import { Otp } from './otp/otp.entity';
import { Resume } from './resume/resume.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USERNAME', 'devuser'),
        password: configService.get<string>('DB_PASSWORD', 'devpass123'),
        database: configService.get<string>('DB_DATABASE', 'jobportal'),
        entities: [User, Profile, Otp, Resume],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    OtpModule,
    ResumeModule,
    AdminModule,
  ],
})
export class AppModule {}
