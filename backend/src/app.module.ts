import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { ResumeModule } from './resume/resume.module';
import { AdminModule } from './admin/admin.module';
import { CompaniesModule } from './companies/companies.module';
import { AuditModule } from './audit/audit.module';
import { ApplicationsModule } from './applications/applications.module';
import { MessagesModule } from './messages/messages.module';
import { PkiModule } from './pki/pki.module';
import { ConnectionsModule } from './connections/connections.module';
import { User } from './users/user.entity';
import { Profile } from './users/profile.entity';
import { ProfileView } from './users/profile-view.entity';
import { Otp } from './otp/otp.entity';
import { Resume } from './resume/resume.entity';
import { Company } from './companies/company.entity';
import { Job } from './companies/job.entity';
import { AuditLog } from './audit/audit-log.entity';
import { Application } from './applications/application.entity';
import { Message } from './messages/message.entity';
import { Connection } from './connections/connection.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 10,
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USERNAME', 'devuser'),
        password: configService.get<string>('DB_PASSWORD', 'devpass123'),
        database: configService.get<string>('DB_DATABASE', 'jobportal'),
        entities: [
          User,
          Profile,
          ProfileView,
          Otp,
          Resume,
          Company,
          Job,
          AuditLog,
          Application,
          Message,
          Connection,
        ],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    PkiModule,
    UsersModule,
    AuthModule,
    OtpModule,
    ResumeModule,
    AdminModule,
    CompaniesModule,
    AuditModule,
    ApplicationsModule,
    MessagesModule,
    ConnectionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
